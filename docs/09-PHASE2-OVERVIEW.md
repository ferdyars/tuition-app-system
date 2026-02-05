# Phase 2: Student Payment Portal - Overview

## Introduction

This phase introduces a student-facing payment portal with bank transfer verification via IMAP email tracking. The system uses unique Rupiah amounts to match payments automatically and implements various safeguards against spam, double-clicks, and race conditions.

---

## Features Summary

| Feature | Purpose | Document |
|---------|---------|----------|
| Student Support Account | Allow students/parents to create payments without admin intervention | [10-STUDENT-ACCOUNT.md](./10-STUDENT-ACCOUNT.md) |
| IMAP Payment Tracking | Auto-verify bank transfers by checking email notifications | [11-BANK-TRANSFER-IMAP.md](./11-BANK-TRANSFER-IMAP.md) |
| Unique Rupiah Pricing | Match payments using unique amount (e.g., Rp 500.123) | [11-BANK-TRANSFER-IMAP.md](./11-BANK-TRANSFER-IMAP.md) |
| Idempotency Keys | Prevent duplicate transactions from double-clicks | [12-IDEMPOTENCY-EXPIRATION.md](./12-IDEMPOTENCY-EXPIRATION.md) |
| Payment Expiration | 5 min frontend / 10 min backend timeout | [12-IDEMPOTENCY-EXPIRATION.md](./12-IDEMPOTENCY-EXPIRATION.md) |
| Rate Limiting | Prevent spam and abuse | [13-RATE-LIMITING.md](./13-RATE-LIMITING.md) |
| WhatsApp Notification | Auto-send payment confirmation via WhatsApp | [15-WHATSAPP-NOTIFICATION.md](./15-WHATSAPP-NOTIFICATION.md) |
| Hono.js Migration | Separate backend for better performance | [16-HONOJS-MIGRATION.md](./16-HONOJS-MIGRATION.md) |

---

## Document Index

| # | Document | Description |
|---|----------|-------------|
| 09 | This file | Phase 2 overview |
| 10 | [STUDENT-ACCOUNT.md](./10-STUDENT-ACCOUNT.md) | Student account schema, registration, soft delete |
| 11 | [BANK-TRANSFER-IMAP.md](./11-BANK-TRANSFER-IMAP.md) | IMAP verification, unique amounts, email parsing |
| 12 | [IDEMPOTENCY-EXPIRATION.md](./12-IDEMPOTENCY-EXPIRATION.md) | Idempotency keys, payment expiration timing |
| 13 | [RATE-LIMITING.md](./13-RATE-LIMITING.md) | Rate limiting implementation |
| 14 | [PHASE2-API-ENDPOINTS.md](./14-PHASE2-API-ENDPOINTS.md) | API endpoints, env vars, testing, security |
| 15 | [WHATSAPP-NOTIFICATION.md](./15-WHATSAPP-NOTIFICATION.md) | WhatsApp notification (link & API) |
| 16 | [HONOJS-MIGRATION.md](./16-HONOJS-MIGRATION.md) | Migration from Next.js API to Hono.js |

---

## High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                     Student Portal (Frontend)                    │
│  - View tuitions                                                │
│  - Create payment requests                                       │
│  - 5-minute countdown timer                                      │
└─────────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                         API Layer                                │
│  - Rate limiting (Upstash Redis)                                │
│  - Idempotency checking                                         │
│  - Authentication (Student JWT)                                  │
└─────────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                      Business Logic                              │
│  - Unique amount generation                                      │
│  - Payment request creation                                      │
│  - Payment verification                                          │
└─────────────────────────────────────────────────────────────────┘
                                │
                    ┌───────────┴───────────┐
                    ▼                       ▼
┌───────────────────────────┐  ┌───────────────────────────┐
│        Database           │  │     IMAP Poller           │
│  - StudentAccount         │  │  - Check every 30s        │
│  - PaymentRequest         │  │  - Parse bank emails      │
│  - BankEmailLog           │  │  - Match by amount        │
│  - IdempotencyRecord      │  │  - Verify payments        │
└───────────────────────────┘  └───────────────────────────┘
```

---

## Payment Flow Overview

```
Student                        System                         Bank
   │                             │                              │
   │── 1. Login ────────────────>│                              │
   │                             │                              │
   │── 2. View tuitions ────────>│                              │
   │                             │                              │
   │── 3. Select & pay ─────────>│                              │
   │                             │── Generate unique amount     │
   │                             │   (Rp 500.000 + 123)         │
   │<── 4. Show Rp 500.123 ──────│                              │
   │       + 5-min countdown     │                              │
   │                             │                              │
   │── 5. Transfer via m-banking ──────────────────────────────>│
   │                             │                              │
   │                             │<── 6. Email notification ────│
   │                             │                              │
   │                             │── 7. Parse email             │
   │                             │      Match Rp 500.123        │
   │                             │      Update tuition to PAID  │
   │                             │                              │
   │<── 8. Payment confirmed ────│                              │
```

---

## Key Design Decisions

### 1. Soft Delete on Student Accounts
- Prevents database overload from accumulating deleted records in queries
- Maintains audit trail for historical data
- Allows account recovery if needed

### 2. Default Password = Parent Phone
- Easy for parents to remember
- Tied to existing verified data (NIS + NIK)
- Forces password change on first login (recommended)

### 3. Unique Amount (1-999 suffix)
- Enables automatic payment matching without manual confirmation
- 999 concurrent pending payments per base amount
- Expires unused codes after 10 minutes

### 4. Dual Timer (5min/10min)
- Frontend shows urgency (5 minutes)
- Backend allows email delay buffer (10 minutes)
- Prevents "just missed" verification failures

### 5. Idempotency Keys
- Prevents duplicate charges from double-clicks
- Caches response for 24 hours
- Client-generated for predictable behavior

---

## Implementation Notes for Claude

When implementing Phase 2, ask Claude to build both **backend** and **frontend** parts:

### Backend Tasks
- Database schema updates (Prisma migrations)
- API endpoints (Hono.js or Next.js API routes)
- Business logic services
- IMAP polling cron job
- Rate limiting middleware

### Frontend Tasks
- Student login page
- Dashboard with tuition list
- Bank selection component
- Payment request flow with countdown timer
- Payment status polling
- Change tuition modal (max 2 changes)
- Password change form

### Prompt Example

```
Based on docs/10-STUDENT-ACCOUNT.md, please implement:
1. The Prisma schema changes for Student account fields
2. The student login API endpoint
3. The student login page (React/Next.js)
4. The change password form component
```

### Implementation Order

1. **Schema** - Update Prisma schema with all new models
2. **Backend Services** - Implement business logic
3. **API Endpoints** - Create REST endpoints
4. **Frontend Pages** - Build UI components
5. **Integration** - Connect frontend to backend
6. **Testing** - Test full flow
