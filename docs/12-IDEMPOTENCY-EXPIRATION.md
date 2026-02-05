# Idempotency Keys & Payment Expiration

## Idempotency Keys

### Purpose

Prevent duplicate transactions from:
- Double-click on payment button
- Network retries
- Browser refresh during submission
- Mobile app retry logic

### Database Schema

```prisma
enum RecordStatus {
  ACTIVE
  INACTIVE
}

model IdempotencyRecord {
  key       String       @id
  response  String       @db.Text
  expiresAt DateTime     @map("expires_at")
  status    RecordStatus @default(ACTIVE)
  createdAt DateTime     @default(now()) @map("created_at")
  updatedAt DateTime     @updatedAt @map("updated_at")

  @@index([status, expiresAt])
  @@map("idempotency_records")
}
```

### Why Status Instead of Delete?

1. **Audit Trail**: Track all idempotency keys ever used
2. **Debugging**: Investigate duplicate request issues
3. **Analytics**: Understand retry patterns
4. **Compliance**: Financial transaction records

### Implementation

```typescript
// src/lib/middleware/idempotency.ts

import { createHash } from 'crypto';

/**
 * Generate idempotency key from request data
 * Uses SHA256 hash of user + action + payload + time window
 */
function generateIdempotencyKey(
  userId: string,
  action: string,
  payload: object
): string {
  const data = JSON.stringify({
    userId,
    action,
    payload,
    timestamp: Math.floor(Date.now() / 60000) // 1-minute window
  });

  return createHash('sha256').update(data).digest('hex');
}

/**
 * Check idempotency and execute action if not duplicate
 * Only checks ACTIVE records within expiry window
 */
async function withIdempotency<T>(
  key: string,
  action: () => Promise<T>,
  ttlHours: number = 24
): Promise<{ isDuplicate: boolean; result: T }> {
  // Check if ACTIVE key exists and not expired
  const existing = await prisma.idempotencyRecord.findFirst({
    where: {
      key,
      status: 'ACTIVE',
      expiresAt: { gt: new Date() }
    }
  });

  if (existing) {
    // Return cached result
    return {
      isDuplicate: true,
      result: JSON.parse(existing.response) as T
    };
  }

  // Execute action
  const result = await action();

  // Store result with TTL
  await prisma.idempotencyRecord.upsert({
    where: { key },
    create: {
      key,
      response: JSON.stringify(result),
      expiresAt: new Date(Date.now() + ttlHours * 60 * 60 * 1000),
      status: 'ACTIVE'
    },
    update: {
      response: JSON.stringify(result),
      expiresAt: new Date(Date.now() + ttlHours * 60 * 60 * 1000),
      status: 'ACTIVE'
    }
  });

  return { isDuplicate: false, result };
}

/**
 * Deactivate expired idempotency records
 * Run as cron job (marks INACTIVE instead of delete)
 */
async function deactivateExpiredIdempotencyRecords(): Promise<number> {
  const result = await prisma.idempotencyRecord.updateMany({
    where: {
      status: 'ACTIVE',
      expiresAt: { lt: new Date() }
    },
    data: {
      status: 'INACTIVE'
    }
  });

  return result.count;
}

/**
 * Get idempotency history for debugging (admin use)
 */
async function getIdempotencyHistory(
  keyPattern?: string,
  limit: number = 100
): Promise<IdempotencyRecord[]> {
  return prisma.idempotencyRecord.findMany({
    where: keyPattern ? {
      key: { contains: keyPattern }
    } : undefined,
    orderBy: { createdAt: 'desc' },
    take: limit
  });
}
```

### API Usage

```typescript
// POST /api/v1/student/payment-request

export async function POST(req: Request) {
  const session = await getStudentSession(req);
  const body = await req.json();

  // Get idempotency key from header or generate from payload
  const idempotencyKey =
    req.headers.get('X-Idempotency-Key') ||
    generateIdempotencyKey(
      session.studentAccountId,
      'CREATE_PAYMENT_REQUEST',
      { tuitionId: body.tuitionId }
    );

  // Execute with idempotency check
  const { isDuplicate, result } = await withIdempotency(
    idempotencyKey,
    () => createPaymentRequest(session.studentAccountId, body)
  );

  // Return appropriate status code
  return successResponse(result, isDuplicate ? 200 : 201);
}
```

### Frontend Implementation

```typescript
// hooks/useIdempotentRequest.ts

import { useState, useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';

function useIdempotentRequest() {
  // Generate key once per component mount
  const [idempotencyKey] = useState(() => uuidv4());
  const [isSubmitting, setIsSubmitting] = useState(false);

  const submitRequest = useCallback(async (
    url: string,
    data: object
  ) => {
    if (isSubmitting) return null; // Prevent double submission

    setIsSubmitting(true);

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Idempotency-Key': idempotencyKey
        },
        body: JSON.stringify(data)
      });

      return response.json();
    } finally {
      setIsSubmitting(false);
    }
  }, [idempotencyKey, isSubmitting]);

  const resetKey = useCallback(() => {
    // Generate new key for next request
    return uuidv4();
  }, []);

  return { submitRequest, isSubmitting, resetKey };
}
```

### Usage in Component

```tsx
// components/PaymentRequestForm.tsx

function PaymentRequestForm({ tuitionId }: { tuitionId: string }) {
  const { submitRequest, isSubmitting } = useIdempotentRequest();
  const [result, setResult] = useState(null);

  const handleSubmit = async () => {
    const response = await submitRequest(
      '/api/v1/student/payment-request',
      { tuitionId }
    );

    if (response?.success) {
      setResult(response.data);
    }
  };

  return (
    <div>
      <button
        onClick={handleSubmit}
        disabled={isSubmitting}
      >
        {isSubmitting ? 'Memproses...' : 'Bayar Sekarang'}
      </button>

      {result && (
        <PaymentInstructions data={result} />
      )}
    </div>
  );
}
```

---

## Payment Expiration Timing

### Dual Timer Design

| Timer | Duration | Purpose |
|-------|----------|---------|
| Frontend | 5 minutes | Show countdown, create urgency |
| Backend | 10 minutes | Actual expiration, email delay buffer |

### Why Different Timings?

**5-minute frontend**:
- Creates sense of urgency
- Prevents user abandonment
- Shows clear deadline to user

**10-minute backend**:
- Buffer for email delivery delays (1-5 minutes)
- Buffer for IMAP polling interval (30 seconds)
- Buffer for network latency
- Prevents "just missed" verification failures

### Timing Calculation

```typescript
// src/lib/business-logic/payment-timing.ts

const BACKEND_EXPIRY_MINUTES = 10;
const FRONTEND_EXPIRY_MINUTES = 5;

interface PaymentTiming {
  backendExpiresAt: Date;
  frontendExpiresAt: Date;
  displayMinutes: number;
}

function calculatePaymentTiming(): PaymentTiming {
  const now = new Date();

  const backendExpiresAt = new Date(
    now.getTime() + BACKEND_EXPIRY_MINUTES * 60 * 1000
  );

  const frontendExpiresAt = new Date(
    now.getTime() + FRONTEND_EXPIRY_MINUTES * 60 * 1000
  );

  return {
    backendExpiresAt,
    frontendExpiresAt,
    displayMinutes: FRONTEND_EXPIRY_MINUTES
  };
}
```

### Backend: Create Payment Request

```typescript
// src/lib/services/payment-request-service.ts

async function createPaymentRequest(
  studentAccountId: string,
  tuitionId: string,
  idempotencyKey: string
): Promise<PaymentRequest> {
  const timing = calculatePaymentTiming();

  const tuition = await prisma.tuition.findUnique({
    where: { id: tuitionId }
  });

  if (!tuition) {
    throw new Error('Tuition tidak ditemukan');
  }

  // Generate unique amount
  const uniqueAmount = await getAvailableUniqueAmount(
    tuition.feeAmount.toNumber(),
    prisma
  );

  // Create payment request with backend expiry
  const request = await prisma.paymentRequest.create({
    data: {
      studentAccountId,
      tuitionId,
      baseAmount: uniqueAmount.baseAmount,
      uniqueCode: uniqueAmount.uniqueCode,
      totalAmount: uniqueAmount.totalAmount,
      idempotencyKey,
      expiresAt: timing.backendExpiresAt, // 10 minutes
      bankName: process.env.SCHOOL_BANK_NAME!,
      bankAccount: process.env.SCHOOL_BANK_ACCOUNT!,
      bankAccountName: process.env.SCHOOL_BANK_ACCOUNT_NAME!,
      status: 'PENDING'
    }
  });

  return request;
}
```

### Frontend: Countdown Component

```tsx
// components/PaymentCountdown.tsx

import { useState, useEffect } from 'react';

interface PaymentCountdownProps {
  backendExpiresAt: Date;
  onExpire: () => void;
}

function PaymentCountdown({
  backendExpiresAt,
  onExpire
}: PaymentCountdownProps) {
  // Calculate frontend expiry (5 minutes before backend)
  const frontendExpiresAt = new Date(
    new Date(backendExpiresAt).getTime() - 5 * 60 * 1000
  );

  const [timeLeft, setTimeLeft] = useState(
    Math.max(0, frontendExpiresAt.getTime() - Date.now())
  );

  useEffect(() => {
    const timer = setInterval(() => {
      const remaining = Math.max(0, frontendExpiresAt.getTime() - Date.now());
      setTimeLeft(remaining);

      if (remaining === 0) {
        onExpire();
        clearInterval(timer);
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [frontendExpiresAt, onExpire]);

  const minutes = Math.floor(timeLeft / 60000);
  const seconds = Math.floor((timeLeft % 60000) / 1000);

  const isUrgent = timeLeft < 60000; // Last minute

  return (
    <div className={`
      text-center p-4 rounded-lg
      ${isUrgent ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'}
    `}>
      <p className="text-sm font-medium">Waktu tersisa untuk transfer:</p>
      <p className={`text-3xl font-bold ${isUrgent ? 'animate-pulse' : ''}`}>
        {minutes}:{seconds.toString().padStart(2, '0')}
      </p>
      {isUrgent && (
        <p className="text-xs mt-2">Segera lakukan transfer!</p>
      )}
    </div>
  );
}
```

### Frontend: Payment Instructions Page

```tsx
// pages/student/payment/[id].tsx

function PaymentInstructionsPage({ paymentRequest }) {
  const [isExpired, setIsExpired] = useState(false);
  const [status, setStatus] = useState(paymentRequest.status);

  // Poll for status updates
  useEffect(() => {
    if (status !== 'PENDING') return;

    const interval = setInterval(async () => {
      const response = await fetch(
        `/api/v1/student/payment-requests/${paymentRequest.id}`
      );
      const data = await response.json();

      if (data.data.status !== 'PENDING') {
        setStatus(data.data.status);
        clearInterval(interval);
      }
    }, 5000); // Check every 5 seconds

    return () => clearInterval(interval);
  }, [paymentRequest.id, status]);

  if (status === 'VERIFIED') {
    return <PaymentSuccess />;
  }

  if (status === 'EXPIRED' || isExpired) {
    return <PaymentExpired onRetry={() => window.location.reload()} />;
  }

  return (
    <div className="max-w-md mx-auto p-6">
      <h1 className="text-xl font-bold mb-4">Instruksi Pembayaran</h1>

      <PaymentCountdown
        backendExpiresAt={new Date(paymentRequest.expiresAt)}
        onExpire={() => setIsExpired(true)}
      />

      <div className="mt-6 space-y-4">
        <div className="bg-gray-50 p-4 rounded-lg">
          <p className="text-sm text-gray-500">Transfer ke:</p>
          <p className="font-bold">{paymentRequest.bankName}</p>
          <p className="text-lg">{paymentRequest.bankAccount}</p>
          <p className="text-sm">{paymentRequest.bankAccountName}</p>
        </div>

        <div className="bg-blue-50 p-4 rounded-lg">
          <p className="text-sm text-blue-600">Jumlah yang harus ditransfer:</p>
          <p className="text-2xl font-bold text-blue-700">
            Rp {paymentRequest.totalAmount.toLocaleString('id-ID')}
          </p>
          <p className="text-xs text-blue-500 mt-1">
            * Pastikan nominal transfer sesuai (termasuk angka unik)
          </p>
        </div>
      </div>

      <p className="text-sm text-gray-500 mt-6 text-center">
        Pembayaran akan terverifikasi otomatis setelah transfer berhasil
      </p>
    </div>
  );
}
```

---

## Cron Jobs for Status Management

### Idempotency Record Deactivation

Idempotency records are marked as INACTIVE after expiration (not deleted) for audit trail.

#### Option 1: Supabase pg_cron (Recommended)

```sql
-- Enable pg_cron extension in Supabase dashboard first
-- Dashboard > Database > Extensions > pg_cron

-- Deactivate expired idempotency records (marks as INACTIVE)
CREATE OR REPLACE FUNCTION deactivate_expired_idempotency_records()
RETURNS void AS $$
DECLARE
  deactivated_count INTEGER;
BEGIN
  UPDATE idempotency_records
  SET status = 'INACTIVE', updated_at = NOW()
  WHERE status = 'ACTIVE' AND expires_at < NOW();

  GET DIAGNOSTICS deactivated_count = ROW_COUNT;

  IF deactivated_count > 0 THEN
    RAISE NOTICE 'Deactivated % expired idempotency records', deactivated_count;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Expire pending payment requests
CREATE OR REPLACE FUNCTION expire_pending_payments()
RETURNS void AS $$
DECLARE
  expired_count INTEGER;
BEGIN
  UPDATE payment_requests
  SET status = 'EXPIRED', updated_at = NOW()
  WHERE status = 'PENDING' AND expires_at < NOW();

  GET DIAGNOSTICS expired_count = ROW_COUNT;

  IF expired_count > 0 THEN
    RAISE NOTICE 'Expired % pending payment requests', expired_count;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Hard delete very old INACTIVE records (older than 30 days)
CREATE OR REPLACE FUNCTION cleanup_old_inactive_records()
RETURNS void AS $$
BEGIN
  -- Clean old idempotency records
  DELETE FROM idempotency_records
  WHERE status = 'INACTIVE'
    AND updated_at < NOW() - INTERVAL '30 days';

  -- Clean old rate limit records
  DELETE FROM rate_limit_records
  WHERE status = 'INACTIVE'
    AND updated_at < NOW() - INTERVAL '30 days';
END;
$$ LANGUAGE plpgsql;

-- Schedule idempotency deactivation every hour
SELECT cron.schedule(
  'deactivate-idempotency-records',
  '0 * * * *',  -- Every hour at minute 0
  'SELECT deactivate_expired_idempotency_records()'
);

-- Schedule payment expiration every minute
SELECT cron.schedule(
  'expire-pending-payments',
  '* * * * *',  -- Every minute
  'SELECT expire_pending_payments()'
);

-- Schedule hard cleanup weekly (Sunday 3 AM)
SELECT cron.schedule(
  'cleanup-old-inactive-records',
  '0 3 * * 0',  -- Every Sunday at 3 AM
  'SELECT cleanup_old_inactive_records()'
);

-- Verify scheduled jobs
SELECT * FROM cron.job;

-- View job run history
SELECT * FROM cron.job_run_details ORDER BY start_time DESC LIMIT 20;
```

#### Option 2: Supabase Edge Function

```typescript
// supabase/functions/deactivate-expired/index.ts

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

serve(async () => {
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  );

  const now = new Date().toISOString();

  // Deactivate expired idempotency records
  const { data: idempotencyResult, error: idempotencyError } = await supabase
    .from('idempotency_records')
    .update({ status: 'INACTIVE', updated_at: now })
    .eq('status', 'ACTIVE')
    .lt('expires_at', now)
    .select('key');

  if (idempotencyError) {
    console.error('Idempotency deactivation failed:', idempotencyError);
  } else {
    console.log(`Deactivated ${idempotencyResult?.length || 0} idempotency records`);
  }

  // Expire pending payments
  const { data: paymentResult, error: paymentError } = await supabase
    .from('payment_requests')
    .update({ status: 'EXPIRED', updated_at: now })
    .eq('status', 'PENDING')
    .lt('expires_at', now)
    .select('id');

  if (paymentError) {
    console.error('Payment expiration failed:', paymentError);
  } else {
    console.log(`Expired ${paymentResult?.length || 0} payment requests`);
  }

  return new Response(JSON.stringify({
    success: true,
    idempotencyDeactivated: idempotencyResult?.length || 0,
    paymentsExpired: paymentResult?.length || 0
  }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' }
  });
});
```

Schedule in `supabase/config.toml`:

```toml
[functions.deactivate-expired]
schedule = "*/5 * * * *"  # Every 5 minutes
```

#### Option 3: Application-Level Cron (node-cron)

```typescript
// src/lib/cron/cleanup-cron.ts

import cron from 'node-cron';
import { prisma } from '@/lib/prisma';

/**
 * Deactivate expired idempotency records
 * Runs every hour
 */
cron.schedule('0 * * * *', async () => {
  try {
    const result = await prisma.idempotencyRecord.updateMany({
      where: {
        status: 'ACTIVE',
        expiresAt: { lt: new Date() }
      },
      data: {
        status: 'INACTIVE'
      }
    });

    if (result.count > 0) {
      console.log(`[Idempotency] Deactivated ${result.count} expired records`);
    }
  } catch (error) {
    console.error('[Idempotency] Deactivation error:', error);
  }
});

/**
 * Expire pending payment requests
 * Runs every minute
 */
cron.schedule('* * * * *', async () => {
  try {
    const result = await prisma.paymentRequest.updateMany({
      where: {
        status: 'PENDING',
        expiresAt: { lt: new Date() }
      },
      data: {
        status: 'EXPIRED'
      }
    });

    if (result.count > 0) {
      console.log(`[Payment Expiration] Expired ${result.count} payment requests`);
    }
  } catch (error) {
    console.error('[Payment Expiration] Error:', error);
  }
});

/**
 * Hard delete very old INACTIVE records - runs weekly (Sunday 3 AM)
 * Keeps last 30 days for audit trail, removes older
 */
cron.schedule('0 3 * * 0', async () => {
  try {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    // Clean old INACTIVE idempotency records
    const idempotencyResult = await prisma.idempotencyRecord.deleteMany({
      where: {
        status: 'INACTIVE',
        updatedAt: { lt: thirtyDaysAgo }
      }
    });

    // Clean old INACTIVE rate limit records
    const rateLimitResult = await prisma.rateLimitRecord.deleteMany({
      where: {
        status: 'INACTIVE',
        updatedAt: { lt: thirtyDaysAgo }
      }
    });

    console.log(`[Weekly Cleanup] Removed ${idempotencyResult.count} old idempotency records`);
    console.log(`[Weekly Cleanup] Removed ${rateLimitResult.count} old rate limit records`);
  } catch (error) {
    console.error('[Weekly Cleanup] Error:', error);
  }
});

console.log('[Cron Jobs] All cleanup jobs scheduled');
```

### Initialize Cron in Application

```typescript
// src/lib/cron/index.ts

// Import to initialize all cron jobs
import './cleanup-cron';
import './payment-checker-cron'; // IMAP checker
import './rate-limit-cleanup';   // Rate limit cleanup

export {};
```

```typescript
// In your main app entry point (e.g., instrumentation.ts for Next.js)
// or in Hono.js main index.ts

if (process.env.ENABLE_CRON === 'true') {
  import('@/lib/cron');
  console.log('Cron jobs initialized');
}
```

### Cron Job Summary

| Job | Schedule | Purpose |
|-----|----------|---------|
| Idempotency deactivation | Every hour | Mark expired idempotency as INACTIVE |
| Rate limit deactivation | Every 5 minutes | Mark expired rate limits as INACTIVE |
| Payment expiration | Every minute | Mark expired payment requests as EXPIRED |
| IMAP email check | Every 30 seconds | Check for bank transfer emails |
| Weekly cleanup | Sunday 3 AM | Hard delete INACTIVE records >30 days |

### Status Lifecycle

```
ACTIVE ──(expires)──> INACTIVE ──(30 days)──> DELETED
```

**Benefits of Status Approach:**
- 30-day audit trail for debugging
- Can query historical patterns
- Reversible if needed (reactivate)
- Gradual data cleanup prevents spikes

---

## Flow Diagram

### Idempotency Flow

```
Client                         Server
   │                             │
   │── POST /payment-request ───>│
   │    X-Idempotency-Key: abc   │
   │                             │── Check key exists?
   │                             │   No -> Process request
   │                             │   Store result with key
   │<── 201 Created ─────────────│
   │                             │
   │── POST /payment-request ───>│ (Double-click / retry)
   │    X-Idempotency-Key: abc   │
   │                             │── Check key exists?
   │                             │   Yes -> Return cached
   │<── 200 OK (same result) ────│
```

### Timing Flow

```
Time    Frontend              Backend               Bank
────────────────────────────────────────────────────────────
0:00    Request created       Store with 10min TTL
        Show 5min countdown

2:00    3min left...          Request still valid

5:00    EXPIRED (frontend)    Request still valid!  User transfers
        "Waktu habis"         (5min buffer)

7:00    -                     Email received        Email sent
                              Match & verify

10:00   -                     Actually expires
```
