# Codebase Structure Reference

Last updated: 2026-02-04

## Folder Structure

```
school-tuition-system/
├── src/
│   ├── app/
│   │   ├── (auth)/                    # Auth layout group
│   │   │   └── login/
│   │   ├── (dashboard)/               # Dashboard routes
│   │   │   ├── academic-years/
│   │   │   ├── classes/
│   │   │   ├── discounts/
│   │   │   ├── employees/
│   │   │   ├── payments/
│   │   │   ├── reports/
│   │   │   ├── scholarships/
│   │   │   ├── students/
│   │   │   └── tuitions/
│   │   ├── api/v1/                    # API routes
│   │   │   ├── academic-years/
│   │   │   ├── auth/
│   │   │   ├── class-academics/
│   │   │   ├── dashboard/
│   │   │   ├── discounts/
│   │   │   ├── employees/
│   │   │   ├── payments/
│   │   │   ├── reports/
│   │   │   ├── scholarships/
│   │   │   ├── student-classes/
│   │   │   ├── student-portal/
│   │   │   ├── students/
│   │   │   └── tuitions/
│   │   ├── student-portal/            # Student portal pages
│   │   └── api-docs/
│   ├── components/
│   │   ├── forms/
│   │   ├── layouts/
│   │   ├── tables/
│   │   └── ui/
│   ├── hooks/
│   │   ├── api/                       # useStudents, usePayments, etc.
│   │   ├── useAuth.ts
│   │   └── usePermissions.ts
│   ├── lib/
│   │   ├── api-auth.ts               # Auth middleware
│   │   ├── api-client.ts             # Frontend API client
│   │   ├── api-response.ts           # Response formatters
│   │   ├── auth.ts                   # JWT operations
│   │   ├── prisma.ts                 # Prisma singleton
│   │   ├── token-blacklist.ts        # Token blacklist (in-memory)
│   │   ├── business-logic/
│   │   │   ├── tuition-generator.ts
│   │   │   ├── payment-processor.ts
│   │   │   ├── discount-processor.ts
│   │   │   ├── scholarship-processor.ts
│   │   │   ├── overdue-calculator.ts
│   │   │   └── class-name-generator.ts
│   │   └── excel-templates/
│   ├── store/
│   │   └── auth-store.ts             # Zustand auth store
│   ├── generated/prisma/             # Prisma generated types
│   └── proxy.ts                      # Middleware proxy
├── prisma/
│   ├── schema.prisma
│   └── seed.ts
├── docs/
└── public/
```

---

## Database Schema (Prisma)

**Location:** `prisma/schema.prisma`

### Models

| Model | Primary Key | Purpose |
|-------|-------------|---------|
| Employee | employeeId (uuid) | Staff (ADMIN/CASHIER) |
| Student | nis (string) | Student records |
| AcademicYear | id (uuid) | Academic periods |
| ClassAcademic | id (uuid) | Class configuration |
| StudentClass | id (uuid) | Student-class enrollment |
| Tuition | id (uuid) | Payment records |
| Payment | id (uuid) | Payment transactions |
| Scholarship | id (uuid) | Student scholarships |
| Discount | id (uuid) | Discount rules |

### Enums

```prisma
enum Role { ADMIN, CASHIER }
enum PaymentStatus { UNPAID, PAID, PARTIAL }
enum PaymentFrequency { MONTHLY, QUARTERLY, SEMESTER }
enum Month { JULY, AUGUST, ..., JUNE }
```

### Key Relations

```
AcademicYear 1──N ClassAcademic 1──N Tuition N──1 Student
                      │                  │
                      └──N StudentClass  └──N Payment N──1 Employee
                      │
                      └──N Scholarship N──1 Student
```

---

## Authentication

**Files:**
- `src/lib/auth.ts` - JWT operations
- `src/lib/api-auth.ts` - API middleware
- `src/lib/token-blacklist.ts` - Blacklist (in-memory Set)
- `src/store/auth-store.ts` - Zustand store
- `src/hooks/useAuth.ts` - Auth hook

**JWT Config:**
- Algorithm: HS256
- Secret: `NEXTAUTH_SECRET` env
- Expiry: 8 hours
- Payload: `{ employeeId, email, name, role }`

**Token Sources:**
1. Header: `Authorization: Bearer {token}`
2. Cookie: `auth-token`

**Middleware Pattern:**
```typescript
export async function GET(request: NextRequest) {
  const auth = await requireAuth(request);
  if (auth instanceof Response) return auth;
  // ... handle request
}

export async function POST(request: NextRequest) {
  const auth = await requireRole(request, ["ADMIN"]);
  if (auth instanceof Response) return auth;
  // ... handle request
}
```

---

## API Response Format

**Location:** `src/lib/api-response.ts`

```typescript
// Success
{ success: true, data: T }

// Error
{ success: false, error: { message, code, details? } }
```

**Functions:**
- `successResponse(data, statusCode?, cacheControl?)`
- `errorResponse(message, code, statusCode?, details?)`

---

## API Routes Summary

| Route | Methods | Auth |
|-------|---------|------|
| `/api/v1/auth/login` | POST | None |
| `/api/v1/auth/logout` | POST | Required |
| `/api/v1/auth/me` | GET | Required |
| `/api/v1/academic-years` | GET, POST | Admin |
| `/api/v1/class-academics` | GET, POST | Admin |
| `/api/v1/students` | GET, POST | Admin |
| `/api/v1/student-classes` | GET, POST | Admin |
| `/api/v1/tuitions` | GET, POST | Admin |
| `/api/v1/tuitions/generate` | POST | Admin |
| `/api/v1/payments` | GET, POST | Cashier+ |
| `/api/v1/scholarships` | GET, POST | Admin |
| `/api/v1/discounts` | GET, POST | Admin |
| `/api/v1/employees` | GET, POST | Admin |
| `/api/v1/reports/*` | GET | Cashier+ |
| `/api/v1/dashboard/stats` | GET | Required |
| `/api/v1/student-portal/[nis]` | GET | Public |

---

## Tech Stack

| Category | Technology |
|----------|------------|
| Framework | Next.js 16.1.6 |
| React | 19.2.3 |
| Database | PostgreSQL |
| ORM | Prisma 7.3.0 |
| Auth | JWT (jose) |
| Password | bcryptjs |
| State | Zustand |
| Data Fetching | @tanstack/react-query |
| UI | Mantine |
| Validation | Zod |
| Excel | xlsx |
| Styling | Tailwind CSS 4 |
| Linting | Biome |

---

## Key Files for Phase 2 Implementation

### Must Modify

| File | Changes |
|------|---------|
| `prisma/schema.prisma` | Add StudentAccount, PaymentRequest, etc. |
| `src/lib/auth.ts` | Add student JWT support |
| `src/lib/api-auth.ts` | Add student auth middleware |
| `src/proxy.ts` | Add public paths for student routes |

### New Files to Create

| Path | Purpose |
|------|---------|
| `src/app/api/v1/student-auth/` | Student login/register/verify |
| `src/app/api/v1/student/` | Student portal API |
| `src/app/(student-portal)/` | Student portal pages |
| `src/lib/services/` | Rate limit, idempotency, IMAP |
| `src/lib/cron/` | Cron jobs |

---

## Environment Variables

```env
# Existing
DATABASE_URL=
DIRECT_URL=
NEXTAUTH_SECRET=
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# Phase 2 (to add)
STUDENT_JWT_SECRET=
IMAP_HOST=
IMAP_PORT=
IMAP_USER=
IMAP_PASSWORD=
SCHOOL_BANK_NAME=
SCHOOL_BANK_ACCOUNT=
SCHOOL_BANK_ACCOUNT_NAME=
ENABLE_CRON=
```
