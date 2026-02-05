# Migration: Next.js API Routes to Hono.js

## Why Hono.js?

| Feature | Next.js API Routes | Hono.js |
|---------|-------------------|---------|
| Performance | Good | Excellent (fastest) |
| Bundle size | Heavy | Ultra-light (~14KB) |
| Type safety | Good | Excellent |
| Middleware | Basic | Rich ecosystem |
| Edge runtime | Supported | Native |
| OpenAPI/Swagger | Manual | Built-in |
| Testing | Complex | Simple |
| Portability | Next.js only | Any runtime |

---

## Architecture Overview

### Current: Next.js Monolith

```
school-tuition-system/
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   └── v1/           # API routes
│   │   ├── (admin)/          # Admin pages
│   │   └── (student)/        # Student pages
│   └── lib/
│       └── business-logic/   # Shared logic
```

### Target: Separated Backend

```
school-tuition-system/
├── apps/
│   ├── web/                  # Next.js frontend only
│   │   ├── src/
│   │   │   ├── app/          # Pages only, no API
│   │   │   └── lib/
│   │   └── package.json
│   │
│   └── api/                  # Hono.js backend
│       ├── src/
│       │   ├── routes/
│       │   ├── middleware/
│       │   ├── services/
│       │   └── index.ts
│       └── package.json
│
├── packages/
│   └── shared/               # Shared types, validators
│       ├── src/
│       └── package.json
│
└── package.json              # Monorepo root
```

---

## Step 1: Setup Monorepo

### Initialize Workspace

```bash
# Create workspace structure
mkdir -p apps/api apps/web packages/shared

# Move existing Next.js to apps/web
mv src apps/web/
mv public apps/web/
mv next.config.js apps/web/
mv tsconfig.json apps/web/

# Create root package.json
cat > package.json << 'EOF'
{
  "name": "school-tuition-system",
  "private": true,
  "workspaces": [
    "apps/*",
    "packages/*"
  ],
  "scripts": {
    "dev": "turbo run dev",
    "build": "turbo run build",
    "lint": "turbo run lint"
  },
  "devDependencies": {
    "turbo": "^2.0.0"
  }
}
EOF
```

### Turbo Config

```json
// turbo.json
{
  "$schema": "https://turbo.build/schema.json",
  "pipeline": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": ["dist/**", ".next/**"]
    },
    "dev": {
      "cache": false,
      "persistent": true
    },
    "lint": {}
  }
}
```

---

## Step 2: Create Hono.js API

### Initialize API Package

```bash
cd apps/api
bun init -y
bun add hono @hono/zod-validator zod
bun add -d typescript @types/node
```

### Package.json

```json
// apps/api/package.json
{
  "name": "@school/api",
  "version": "1.0.0",
  "scripts": {
    "dev": "bun run --hot src/index.ts",
    "build": "bun build src/index.ts --outdir=dist --target=node",
    "start": "bun run dist/index.js"
  },
  "dependencies": {
    "hono": "^4.0.0",
    "@hono/zod-validator": "^0.2.0",
    "zod": "^3.22.0",
    "@prisma/client": "^5.0.0",
    "bcryptjs": "^2.4.3",
    "jsonwebtoken": "^9.0.0"
  }
}
```

### Main Entry Point

```typescript
// apps/api/src/index.ts

import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import { prettyJSON } from 'hono/pretty-json';
import { secureHeaders } from 'hono/secure-headers';

import { authRoutes } from './routes/auth';
import { studentAuthRoutes } from './routes/student-auth';
import { studentRoutes } from './routes/student';
import { employeeRoutes } from './routes/employees';
import { tuitionRoutes } from './routes/tuitions';
import { paymentRoutes } from './routes/payments';
import { adminRoutes } from './routes/admin';
import { errorHandler } from './middleware/error-handler';

const app = new Hono().basePath('/api/v1');

// Global middleware
app.use('*', logger());
app.use('*', prettyJSON());
app.use('*', secureHeaders());
app.use('*', cors({
  origin: [
    'http://localhost:3000',
    'https://school.example.com',
    'https://student.school.example.com'
  ],
  credentials: true
}));

// Error handling
app.onError(errorHandler);

// Health check
app.get('/health', (c) => c.json({ status: 'ok', timestamp: new Date() }));

// Routes
app.route('/auth', authRoutes);
app.route('/student-auth', studentAuthRoutes);
app.route('/student', studentRoutes);
app.route('/employees', employeeRoutes);
app.route('/tuitions', tuitionRoutes);
app.route('/payments', paymentRoutes);
app.route('/admin', adminRoutes);

// 404 handler
app.notFound((c) => {
  return c.json({
    success: false,
    error: {
      message: 'Route not found',
      code: 'NOT_FOUND'
    }
  }, 404);
});

// Start server
const port = parseInt(process.env.PORT || '4000');

console.log(`Server running on http://localhost:${port}`);

export default {
  port,
  fetch: app.fetch
};
```

---

## Step 3: Route Migration

### Example: Auth Routes

```typescript
// apps/api/src/routes/auth.ts

import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { prisma } from '../lib/prisma';
import { comparePassword, generateToken } from '../lib/auth';
import { authMiddleware, requireRole } from '../middleware/auth';

const authRoutes = new Hono();

// Login schema
const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1)
});

// POST /auth/login
authRoutes.post(
  '/login',
  zValidator('json', loginSchema),
  async (c) => {
    const { email, password } = c.req.valid('json');

    const employee = await prisma.employee.findUnique({
      where: { email }
    });

    if (!employee) {
      return c.json({
        success: false,
        error: { message: 'Invalid credentials', code: 'INVALID_CREDENTIALS' }
      }, 401);
    }

    const isValid = await comparePassword(password, employee.password);

    if (!isValid) {
      return c.json({
        success: false,
        error: { message: 'Invalid credentials', code: 'INVALID_CREDENTIALS' }
      }, 401);
    }

    const token = generateToken({
      employeeId: employee.employeeId,
      email: employee.email,
      role: employee.role
    });

    return c.json({
      success: true,
      data: {
        token,
        user: {
          employeeId: employee.employeeId,
          name: employee.name,
          email: employee.email,
          role: employee.role
        }
      }
    });
  }
);

// GET /auth/me
authRoutes.get('/me', authMiddleware, async (c) => {
  const user = c.get('user');

  const employee = await prisma.employee.findUnique({
    where: { employeeId: user.employeeId }
  });

  if (!employee) {
    return c.json({
      success: false,
      error: { message: 'User not found', code: 'NOT_FOUND' }
    }, 404);
  }

  return c.json({
    success: true,
    data: {
      employeeId: employee.employeeId,
      name: employee.name,
      email: employee.email,
      role: employee.role
    }
  });
});

// POST /auth/logout
authRoutes.post('/logout', authMiddleware, (c) => {
  // JWT is stateless, client should remove token
  return c.json({ success: true });
});

export { authRoutes };
```

### Example: Student Payment Request Routes

```typescript
// apps/api/src/routes/student.ts

import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { studentAuthMiddleware } from '../middleware/student-auth';
import { rateLimitMiddleware } from '../middleware/rate-limit';
import { idempotencyMiddleware } from '../middleware/idempotency';
import { prisma } from '../lib/prisma';
import { getAvailableUniqueAmount } from '../lib/unique-amount';

const studentRoutes = new Hono();

// Apply student auth to all routes
studentRoutes.use('*', studentAuthMiddleware);

// GET /student/profile
studentRoutes.get('/profile', async (c) => {
  const account = c.get('studentAccount');

  const student = await prisma.student.findUnique({
    where: { nis: account.studentNis }
  });

  return c.json({
    success: true,
    data: {
      nis: student.nis,
      name: student.name,
      email: account.email,
      parentName: student.parentName
    }
  });
});

// GET /student/tuitions
studentRoutes.get('/tuitions', async (c) => {
  const account = c.get('studentAccount');
  const { status, page = '1', limit = '10' } = c.req.query();

  const where: any = {
    studentNis: account.studentNis
  };

  if (status) {
    where.status = status;
  }

  const [tuitions, total] = await Promise.all([
    prisma.tuition.findMany({
      where,
      skip: (parseInt(page) - 1) * parseInt(limit),
      take: parseInt(limit),
      orderBy: [{ year: 'desc' }, { month: 'asc' }],
      include: {
        classAcademic: true
      }
    }),
    prisma.tuition.count({ where })
  ]);

  return c.json({
    success: true,
    data: {
      tuitions,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / parseInt(limit))
      }
    }
  });
});

// Payment request schema
const paymentRequestSchema = z.object({
  tuitionId: z.string().uuid()
});

// POST /student/payment-request
studentRoutes.post(
  '/payment-request',
  rateLimitMiddleware('paymentRequest'),
  idempotencyMiddleware,
  zValidator('json', paymentRequestSchema),
  async (c) => {
    const account = c.get('studentAccount');
    const { tuitionId } = c.req.valid('json');
    const idempotencyKey = c.get('idempotencyKey');

    // Verify tuition belongs to student
    const tuition = await prisma.tuition.findFirst({
      where: {
        id: tuitionId,
        studentNis: account.studentNis,
        status: { in: ['UNPAID', 'PARTIAL'] }
      }
    });

    if (!tuition) {
      return c.json({
        success: false,
        error: { message: 'Tuition not found or already paid', code: 'NOT_FOUND' }
      }, 404);
    }

    // Check for existing pending request
    const existingRequest = await prisma.paymentRequest.findFirst({
      where: {
        tuitionId,
        status: 'PENDING',
        expiresAt: { gt: new Date() }
      }
    });

    if (existingRequest) {
      return c.json({
        success: true,
        data: existingRequest
      });
    }

    // Generate unique amount
    const uniqueAmount = await getAvailableUniqueAmount(
      tuition.feeAmount.toNumber() - tuition.paidAmount.toNumber()
    );

    // Create payment request
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    const request = await prisma.paymentRequest.create({
      data: {
        studentAccountId: account.id,
        tuitionId,
        baseAmount: uniqueAmount.baseAmount,
        uniqueCode: uniqueAmount.uniqueCode,
        totalAmount: uniqueAmount.totalAmount,
        idempotencyKey,
        expiresAt,
        bankName: process.env.SCHOOL_BANK_NAME!,
        bankAccount: process.env.SCHOOL_BANK_ACCOUNT!,
        bankAccountName: process.env.SCHOOL_BANK_ACCOUNT_NAME!
      }
    });

    return c.json({
      success: true,
      data: request
    }, 201);
  }
);

export { studentRoutes };
```

---

## Step 4: Middleware

### Auth Middleware

```typescript
// apps/api/src/middleware/auth.ts

import { Context, Next } from 'hono';
import { verify } from 'jsonwebtoken';

interface JWTPayload {
  employeeId: string;
  email: string;
  role: 'ADMIN' | 'CASHIER';
}

export async function authMiddleware(c: Context, next: Next) {
  const authHeader = c.req.header('Authorization');

  if (!authHeader?.startsWith('Bearer ')) {
    return c.json({
      success: false,
      error: { message: 'Unauthorized', code: 'UNAUTHORIZED' }
    }, 401);
  }

  const token = authHeader.substring(7);

  try {
    const payload = verify(token, process.env.JWT_SECRET!) as JWTPayload;
    c.set('user', payload);
    await next();
  } catch {
    return c.json({
      success: false,
      error: { message: 'Invalid token', code: 'INVALID_TOKEN' }
    }, 401);
  }
}

export function requireRole(...roles: string[]) {
  return async (c: Context, next: Next) => {
    const user = c.get('user');

    if (!roles.includes(user.role)) {
      return c.json({
        success: false,
        error: { message: 'Forbidden', code: 'FORBIDDEN' }
      }, 403);
    }

    await next();
  };
}
```

### Rate Limit Middleware

```typescript
// apps/api/src/middleware/rate-limit.ts

import { Context, Next } from 'hono';
import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!
});

const limiters = {
  paymentRequest: new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(3, '1 m'),
    prefix: 'ratelimit:payment-request'
  }),
  login: new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(5, '15 m'),
    prefix: 'ratelimit:login'
  }),
  api: new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(100, '1 m'),
    prefix: 'ratelimit:api'
  })
};

export function rateLimitMiddleware(type: keyof typeof limiters) {
  return async (c: Context, next: Next) => {
    const identifier = c.get('user')?.employeeId ||
                       c.get('studentAccount')?.id ||
                       c.req.header('x-forwarded-for') ||
                       'anonymous';

    const result = await limiters[type].limit(identifier);

    c.header('X-RateLimit-Limit', result.limit.toString());
    c.header('X-RateLimit-Remaining', result.remaining.toString());
    c.header('X-RateLimit-Reset', new Date(result.reset).toISOString());

    if (!result.success) {
      const retryAfter = Math.ceil((result.reset - Date.now()) / 1000);
      c.header('Retry-After', retryAfter.toString());

      return c.json({
        success: false,
        error: {
          message: `Rate limit exceeded. Try again in ${retryAfter} seconds.`,
          code: 'RATE_LIMIT_EXCEEDED'
        }
      }, 429);
    }

    await next();
  };
}
```

### Error Handler

```typescript
// apps/api/src/middleware/error-handler.ts

import { Context } from 'hono';
import { ZodError } from 'zod';

export function errorHandler(err: Error, c: Context) {
  console.error('Error:', err);

  // Zod validation error
  if (err instanceof ZodError) {
    return c.json({
      success: false,
      error: {
        message: 'Validation error',
        code: 'VALIDATION_ERROR',
        details: err.errors
      }
    }, 400);
  }

  // Generic error
  return c.json({
    success: false,
    error: {
      message: process.env.NODE_ENV === 'production'
        ? 'Internal server error'
        : err.message,
      code: 'SERVER_ERROR'
    }
  }, 500);
}
```

---

## Step 5: OpenAPI/Swagger Integration

```typescript
// apps/api/src/lib/openapi.ts

import { OpenAPIHono } from '@hono/zod-openapi';
import { swaggerUI } from '@hono/swagger-ui';

const app = new OpenAPIHono();

// Add OpenAPI documentation
app.doc('/doc', {
  openapi: '3.0.0',
  info: {
    title: 'School Tuition API',
    version: '1.0.0',
    description: 'API for School Tuition Management System'
  },
  servers: [
    { url: 'http://localhost:4000/api/v1', description: 'Development' },
    { url: 'https://api.school.example.com/api/v1', description: 'Production' }
  ]
});

// Swagger UI
app.get('/swagger', swaggerUI({ url: '/api/v1/doc' }));
```

---

## Step 6: Update Frontend

### API Client

```typescript
// apps/web/src/lib/api-client.ts

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1';

export async function apiClient<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = getToken(); // From cookie or localStorage

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options.headers
    }
  });

  const data = await response.json();

  if (!response.ok) {
    throw new APIError(data.error.message, data.error.code, response.status);
  }

  return data;
}
```

### Environment Variables

```env
# apps/web/.env.local
NEXT_PUBLIC_API_URL=http://localhost:4000/api/v1
```

---

## Step 7: Deployment

### Dockerfile for API

```dockerfile
# apps/api/Dockerfile

FROM oven/bun:1 AS builder
WORKDIR /app
COPY package.json bun.lockb ./
RUN bun install --frozen-lockfile
COPY . .
RUN bun run build

FROM oven/bun:1-slim
WORKDIR /app
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
EXPOSE 4000
CMD ["bun", "run", "dist/index.js"]
```

### Docker Compose

```yaml
# docker-compose.yml

version: '3.8'

services:
  api:
    build:
      context: ./apps/api
    ports:
      - "4000:4000"
    environment:
      - DATABASE_URL=${DATABASE_URL}
      - JWT_SECRET=${JWT_SECRET}
    depends_on:
      - postgres
      - redis

  web:
    build:
      context: ./apps/web
    ports:
      - "3000:3000"
    environment:
      - NEXT_PUBLIC_API_URL=http://api:4000/api/v1

  postgres:
    image: postgres:15
    volumes:
      - postgres_data:/var/lib/postgresql/data
    environment:
      - POSTGRES_DB=school_tuition
      - POSTGRES_USER=postgres
      - POSTGRES_PASSWORD=password

  redis:
    image: redis:alpine
    volumes:
      - redis_data:/data

volumes:
  postgres_data:
  redis_data:
```

---

## Migration Checklist

- [ ] Setup monorepo structure (Turborepo)
- [ ] Create Hono.js API package
- [ ] Migrate auth routes
- [ ] Migrate student-auth routes
- [ ] Migrate student routes
- [ ] Migrate employee routes
- [ ] Migrate tuition routes
- [ ] Migrate payment routes
- [ ] Migrate admin routes
- [ ] Setup middleware (auth, rate-limit, error-handler)
- [ ] Setup OpenAPI documentation
- [ ] Update frontend API client
- [ ] Update environment variables
- [ ] Create Dockerfile
- [ ] Test all endpoints
- [ ] Deploy to production
