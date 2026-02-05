# Rate Limiting

## Purpose

Prevent abuse and spam on:
- Payment request creation
- Account registration
- Login attempts
- General API calls

---

## Implementation with Supabase (PostgreSQL)

### Why Supabase for Rate Limiting?

- Already using Supabase for database
- No additional service/cost
- Transactional consistency
- Built-in cron via pg_cron or Supabase Edge Functions
- Simple sliding window implementation

---

## Database Schema

```prisma
// Add to schema.prisma

enum RecordStatus {
  ACTIVE
  INACTIVE
}

model RateLimitRecord {
  id          String       @id @default(uuid())
  key         String       // identifier:action (e.g., "user123:payment_request")
  action      String       // Action type (payment_request, login, registration)
  identifier  String       // User ID, IP, or email
  count       Int          @default(1)
  windowStart DateTime     @map("window_start")
  expiresAt   DateTime     @map("expires_at")
  status      RecordStatus @default(ACTIVE)
  createdAt   DateTime     @default(now()) @map("created_at")
  updatedAt   DateTime     @updatedAt @map("updated_at")

  @@unique([key])
  @@index([status, expiresAt])
  @@index([action, identifier, status])
  @@map("rate_limit_records")
}
```

### Why Status Instead of Delete?

1. **Audit Trail**: Keep history of rate limit events for analysis
2. **Debugging**: Investigate past rate limit issues
3. **Analytics**: Track patterns of abuse or heavy usage
4. **Recovery**: Reactivate if needed (rare but possible)

---

## Rate Limit Configuration

```typescript
// src/lib/config/rate-limit-config.ts

export interface RateLimitConfig {
  limit: number;      // Max requests allowed
  windowMs: number;   // Time window in milliseconds
}

export const RATE_LIMITS: Record<string, RateLimitConfig> = {
  // Payment request: 3 per minute per user
  paymentRequest: {
    limit: 3,
    windowMs: 60 * 1000 // 1 minute
  },

  // Cancel payment: 3 per minute per user
  cancelPayment: {
    limit: 3,
    windowMs: 60 * 1000
  },

  // Registration: 5 per hour per IP
  registration: {
    limit: 5,
    windowMs: 60 * 60 * 1000 // 1 hour
  },

  // Login: 5 attempts per 15 minutes per email
  login: {
    limit: 5,
    windowMs: 15 * 60 * 1000 // 15 minutes
  },

  // Forgot password: 3 per hour per email
  forgotPassword: {
    limit: 3,
    windowMs: 60 * 60 * 1000
  },

  // General API: 100 requests per minute per user
  api: {
    limit: 100,
    windowMs: 60 * 1000
  },

  // Strict: 10 requests per minute (for sensitive endpoints)
  strict: {
    limit: 10,
    windowMs: 60 * 1000
  }
};
```

---

## Rate Limit Service

```typescript
// src/lib/services/rate-limit-service.ts

import { prisma } from '@/lib/prisma';
import { RATE_LIMITS, RateLimitConfig } from '@/lib/config/rate-limit-config';

export interface RateLimitResult {
  success: boolean;
  remaining: number;
  reset: Date;
  limit: number;
}

/**
 * Check rate limit using Supabase/PostgreSQL
 * Uses sliding window algorithm with status-based expiration
 */
export async function checkRateLimit(
  action: keyof typeof RATE_LIMITS,
  identifier: string
): Promise<RateLimitResult> {
  const config = RATE_LIMITS[action];
  const key = `${identifier}:${action}`;
  const now = new Date();
  const windowStart = new Date(now.getTime() - config.windowMs);
  const expiresAt = new Date(now.getTime() + config.windowMs);

  // Use transaction for atomic check-and-update
  const result = await prisma.$transaction(async (tx) => {
    // Find existing ACTIVE record within current window
    const existing = await tx.rateLimitRecord.findFirst({
      where: {
        key,
        status: 'ACTIVE',
        windowStart: { gte: windowStart }
      }
    });

    if (existing) {
      // Check if limit exceeded
      if (existing.count >= config.limit) {
        return {
          success: false,
          remaining: 0,
          reset: existing.expiresAt,
          limit: config.limit
        };
      }

      // Increment count
      const updated = await tx.rateLimitRecord.update({
        where: { id: existing.id },
        data: { count: existing.count + 1 }
      });

      return {
        success: true,
        remaining: config.limit - updated.count,
        reset: updated.expiresAt,
        limit: config.limit
      };
    }

    // Create new record
    await tx.rateLimitRecord.create({
      data: {
        key,
        action,
        identifier,
        count: 1,
        windowStart: now,
        expiresAt,
        status: 'ACTIVE'
      }
    });

    return {
      success: true,
      remaining: config.limit - 1,
      reset: expiresAt,
      limit: config.limit
    };
  });

  return result;
}

/**
 * Reset rate limit for a specific key (admin use)
 * Sets status to INACTIVE instead of deleting
 */
export async function resetRateLimit(
  action: string,
  identifier: string
): Promise<void> {
  const key = `${identifier}:${action}`;

  await prisma.rateLimitRecord.updateMany({
    where: {
      key,
      status: 'ACTIVE'
    },
    data: {
      status: 'INACTIVE'
    }
  });
}

/**
 * Get current rate limit status without incrementing
 */
export async function getRateLimitStatus(
  action: keyof typeof RATE_LIMITS,
  identifier: string
): Promise<RateLimitResult> {
  const config = RATE_LIMITS[action];
  const key = `${identifier}:${action}`;
  const windowStart = new Date(Date.now() - config.windowMs);

  const existing = await prisma.rateLimitRecord.findFirst({
    where: {
      key,
      status: 'ACTIVE',
      windowStart: { gte: windowStart }
    }
  });

  if (!existing) {
    return {
      success: true,
      remaining: config.limit,
      reset: new Date(Date.now() + config.windowMs),
      limit: config.limit
    };
  }

  return {
    success: existing.count < config.limit,
    remaining: Math.max(0, config.limit - existing.count),
    reset: existing.expiresAt,
    limit: config.limit
  };
}

/**
 * Get rate limit history for analytics (admin use)
 */
export async function getRateLimitHistory(
  action?: string,
  identifier?: string,
  limit: number = 100
): Promise<RateLimitRecord[]> {
  return prisma.rateLimitRecord.findMany({
    where: {
      ...(action && { action }),
      ...(identifier && { identifier })
    },
    orderBy: { createdAt: 'desc' },
    take: limit
  });
}
```

---

## Cron Job: Deactivate Expired Records

### Option 1: Supabase pg_cron (Recommended)

```sql
-- Enable pg_cron extension in Supabase dashboard first
-- Dashboard > Database > Extensions > pg_cron

-- Create deactivation function (marks as INACTIVE instead of delete)
CREATE OR REPLACE FUNCTION deactivate_expired_rate_limits()
RETURNS void AS $$
DECLARE
  deactivated_count INTEGER;
BEGIN
  UPDATE rate_limit_records
  SET status = 'INACTIVE', updated_at = NOW()
  WHERE status = 'ACTIVE' AND expires_at < NOW();

  GET DIAGNOSTICS deactivated_count = ROW_COUNT;

  IF deactivated_count > 0 THEN
    RAISE NOTICE 'Deactivated % expired rate limit records', deactivated_count;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Schedule to run every 5 minutes
SELECT cron.schedule(
  'deactivate-rate-limits',
  '*/5 * * * *',
  'SELECT deactivate_expired_rate_limits()'
);

-- Optional: Hard delete very old INACTIVE records (older than 30 days)
-- Run weekly to prevent table bloat
CREATE OR REPLACE FUNCTION cleanup_old_rate_limits()
RETURNS void AS $$
BEGIN
  DELETE FROM rate_limit_records
  WHERE status = 'INACTIVE'
    AND updated_at < NOW() - INTERVAL '30 days';
END;
$$ LANGUAGE plpgsql;

SELECT cron.schedule(
  'cleanup-old-rate-limits',
  '0 3 * * 0',  -- Every Sunday at 3 AM
  'SELECT cleanup_old_rate_limits()'
);

-- Verify scheduled jobs
SELECT * FROM cron.job;
```

### Option 2: Supabase Edge Function Cron

```typescript
// supabase/functions/deactivate-rate-limits/index.ts

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

serve(async () => {
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  );

  // Deactivate expired records
  const { data, error } = await supabase
    .from('rate_limit_records')
    .update({
      status: 'INACTIVE',
      updated_at: new Date().toISOString()
    })
    .eq('status', 'ACTIVE')
    .lt('expires_at', new Date().toISOString())
    .select('id');

  if (error) {
    console.error('Deactivation failed:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500
    });
  }

  console.log(`Deactivated ${data?.length || 0} rate limit records`);

  return new Response(JSON.stringify({
    success: true,
    deactivated: data?.length || 0
  }), {
    status: 200
  });
});
```

Schedule in `supabase/config.toml`:

```toml
[functions.deactivate-rate-limits]
schedule = "*/5 * * * *"
```

### Option 3: Application-Level Cron (node-cron)

```typescript
// src/lib/cron/rate-limit-cleanup.ts

import cron from 'node-cron';
import { prisma } from '@/lib/prisma';

// Deactivate expired records every 5 minutes
cron.schedule('*/5 * * * *', async () => {
  try {
    const result = await prisma.rateLimitRecord.updateMany({
      where: {
        status: 'ACTIVE',
        expiresAt: { lt: new Date() }
      },
      data: {
        status: 'INACTIVE'
      }
    });

    if (result.count > 0) {
      console.log(`[Rate Limit] Deactivated ${result.count} expired records`);
    }
  } catch (error) {
    console.error('[Rate Limit] Deactivation error:', error);
  }
});

// Hard delete very old INACTIVE records (weekly, Sunday 3 AM)
cron.schedule('0 3 * * 0', async () => {
  try {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    const result = await prisma.rateLimitRecord.deleteMany({
      where: {
        status: 'INACTIVE',
        updatedAt: { lt: thirtyDaysAgo }
      }
    });

    if (result.count > 0) {
      console.log(`[Rate Limit] Cleaned up ${result.count} old inactive records`);
    }
  } catch (error) {
    console.error('[Rate Limit] Cleanup error:', error);
  }
});

console.log('[Rate Limit Cleanup] Cron jobs scheduled');
```

---

## Rate Limit Middleware

```typescript
// src/lib/middleware/rate-limit.ts

import { checkRateLimit, RateLimitResult } from '@/lib/services/rate-limit-service';
import { RATE_LIMITS } from '@/lib/config/rate-limit-config';

/**
 * Rate limit error response
 */
export function rateLimitErrorResponse(result: RateLimitResult) {
  const retryAfter = Math.ceil(
    (result.reset.getTime() - Date.now()) / 1000
  );

  return new Response(
    JSON.stringify({
      success: false,
      error: {
        message: `Terlalu banyak permintaan. Coba lagi dalam ${retryAfter} detik.`,
        code: 'RATE_LIMIT_EXCEEDED',
        retryAfter
      }
    }),
    {
      status: 429,
      headers: {
        'Content-Type': 'application/json',
        'X-RateLimit-Limit': result.limit.toString(),
        'X-RateLimit-Remaining': result.remaining.toString(),
        'X-RateLimit-Reset': result.reset.toISOString(),
        'Retry-After': retryAfter.toString()
      }
    }
  );
}

/**
 * Add rate limit headers to response
 */
export function addRateLimitHeaders(
  response: Response,
  result: RateLimitResult
): Response {
  response.headers.set('X-RateLimit-Limit', result.limit.toString());
  response.headers.set('X-RateLimit-Remaining', result.remaining.toString());
  response.headers.set('X-RateLimit-Reset', result.reset.toISOString());
  return response;
}

// Re-export for convenience
export { checkRateLimit, RATE_LIMITS };
export type { RateLimitResult };
```

---

## API Integration Examples

### Payment Request Endpoint

```typescript
// src/app/api/v1/student/payment-request/route.ts

import { checkRateLimit, rateLimitErrorResponse, addRateLimitHeaders } from '@/lib/middleware/rate-limit';

export async function POST(req: Request) {
  const session = await getStudentSession(req);

  // Check rate limit
  const rateLimitResult = await checkRateLimit(
    'paymentRequest',
    session.studentAccountId
  );

  if (!rateLimitResult.success) {
    return rateLimitErrorResponse(rateLimitResult);
  }

  // Continue with request...
  const body = await req.json();
  const result = await createPaymentRequest(session.studentAccountId, body);

  const response = successResponse(result, 201);
  return addRateLimitHeaders(response, rateLimitResult);
}
```

### Login Endpoint

```typescript
// src/app/api/v1/student-auth/login/route.ts

export async function POST(req: Request) {
  const body = await req.json();
  const { email, password } = body;

  // Rate limit by email
  const rateLimitResult = await checkRateLimit('login', email);

  if (!rateLimitResult.success) {
    return rateLimitErrorResponse(rateLimitResult);
  }

  // Continue with login...
  const result = await loginStudentAccount({ email, password });

  if (!result.success) {
    return errorResponse(result.error!, 'INVALID_CREDENTIALS', 401);
  }

  return successResponse(result);
}
```

### Registration Endpoint

```typescript
// src/app/api/v1/student-auth/register/route.ts

export async function POST(req: Request) {
  // Get client IP
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0] ||
             req.headers.get('x-real-ip') ||
             'unknown';

  // Rate limit by IP
  const rateLimitResult = await checkRateLimit('registration', ip);

  if (!rateLimitResult.success) {
    return rateLimitErrorResponse(rateLimitResult);
  }

  // Continue with registration...
  const body = await req.json();
  const result = await registerStudentAccount(body);

  return successResponse(result, 201);
}
```

---

## Rate Limit Summary

| Endpoint | Limit | Window | Identifier |
|----------|-------|--------|------------|
| POST /student-auth/register | 5 | 1 hour | IP address |
| POST /student-auth/login | 5 | 15 min | Email |
| POST /student-auth/forgot-password | 3 | 1 hour | Email |
| POST /student/payment-request | 3 | 1 min | Account ID |
| POST /student/payment-requests/:id/cancel | 3 | 1 min | Account ID |
| GET /student/* | 100 | 1 min | Account ID |
| All other endpoints | 100 | 1 min | User ID |

---

## Frontend Handling

```typescript
// hooks/useApi.ts

async function fetchWithRateLimit(url: string, options: RequestInit = {}) {
  const response = await fetch(url, options);

  if (response.status === 429) {
    const data = await response.json();
    const retryAfter = parseInt(response.headers.get('Retry-After') || '60');

    // Show user-friendly message
    toast.error(`Terlalu banyak permintaan. Coba lagi dalam ${retryAfter} detik.`);

    throw new RateLimitError(data.error.message, retryAfter);
  }

  return response;
}

class RateLimitError extends Error {
  retryAfter: number;

  constructor(message: string, retryAfter: number) {
    super(message);
    this.name = 'RateLimitError';
    this.retryAfter = retryAfter;
  }
}
```

---

## Admin API: Manage Rate Limits

```typescript
// GET /api/v1/admin/rate-limits
// List all active rate limit records

// DELETE /api/v1/admin/rate-limits/:id
// Remove specific rate limit (unblock user)

// POST /api/v1/admin/rate-limits/reset
// Request: { action: "login", identifier: "user@email.com" }
// Reset rate limit for specific user/action
```

---

## Monitoring

```typescript
// Log rate limit events for monitoring

async function checkRateLimitWithLogging(
  action: keyof typeof RATE_LIMITS,
  identifier: string
): Promise<RateLimitResult> {
  const result = await checkRateLimit(action, identifier);

  if (!result.success) {
    console.warn('Rate limit exceeded:', {
      action,
      identifier: identifier.substring(0, 8) + '...', // Partial for privacy
      reset: result.reset.toISOString()
    });

    // Optional: Track in analytics
    // await prisma.rateLimitLog.create({ data: { action, identifier, ... } });
  }

  return result;
}
```
