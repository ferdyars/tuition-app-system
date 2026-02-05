# Student Support Account

## Purpose

Allow students/parents to access a limited portal to:
- View their tuition status
- Create bank transfer payment requests
- Check payment verification status

---

## Account Management Overview

| Feature | Handled By |
|---------|------------|
| Account Creation | Admin |
| Default Password | Parent Phone Number |
| Password Reset | Admin |
| Change Password | Student (self-service) |
| Soft Delete | Automatic (6 months inactive + all paid) |

---

## Database Schema

Add account fields to existing `Student` model:

```prisma
// Update in schema.prisma

model Student {
  nis           String   @id @map("nis")
  nik           String   @unique @map("nik")
  name          String
  address       String
  parentName    String   @map("parent_name")
  parentPhone   String   @map("parent_phone")
  startJoinDate DateTime @map("start_join_date")
  createdAt     DateTime @default(now()) @map("created_at")
  updatedAt     DateTime @updatedAt @map("updated_at")

  // ========== Account Fields ==========
  hasAccount         Boolean   @default(false) @map("has_account")
  password           String?   // Hashed (default: parent phone number)
  mustChangePassword Boolean   @default(true) @map("must_change_password")
  lastLoginAt        DateTime? @map("last_login_at")
  lastPaymentAt      DateTime? @map("last_payment_at") // Track last payment activity
  accountCreatedAt   DateTime? @map("account_created_at")
  accountCreatedBy   String?   @map("account_created_by") // Employee ID who created

  // Account Soft Delete
  accountDeleted       Boolean   @default(false) @map("account_deleted")
  accountDeletedAt     DateTime? @map("account_deleted_at")
  accountDeletedBy     String?   @map("account_deleted_by") // "SYSTEM" or Employee ID
  accountDeletedReason String?   @map("account_deleted_reason")

  // Relations
  scholarships   Scholarship[]
  tuitions       Tuition[]
  studentClasses StudentClass[]
  paymentRequests PaymentRequest[]

  // Indexes for account queries
  @@index([hasAccount])
  @@index([hasAccount, accountDeleted])
  @@index([lastPaymentAt])
  @@map("students")
}
```

---

## Account Creation (Admin Only)

### Flow

1. Admin navigates to student detail page
2. Admin clicks "Create Account" button
3. System generates account with parent phone as default password
4. Admin notifies parent via WhatsApp (optional)

### Implementation

```typescript
// src/lib/services/student-account-service.ts

import bcrypt from 'bcryptjs';

interface CreateStudentAccountInput {
  studentNis: string;
  createdBy: string; // Admin employee ID
}

async function createStudentAccount(input: CreateStudentAccountInput) {
  const { studentNis, createdBy } = input;

  // 1. Get student data
  const student = await prisma.student.findUnique({
    where: { nis: studentNis }
  });

  if (!student) {
    throw new Error('Siswa tidak ditemukan');
  }

  // 2. Check if account already exists
  if (student.hasAccount) {
    if (student.accountDeleted) {
      throw new Error('Akun telah dihapus. Gunakan fitur restore untuk mengaktifkan kembali.');
    }
    throw new Error('Akun untuk siswa ini sudah ada');
  }

  // 3. Use parent phone as default password
  const defaultPassword = student.parentPhone;

  // Normalize phone number (remove non-digits)
  const normalizedPassword = defaultPassword.replace(/\D/g, '');

  // Hash password
  const hashedPassword = await bcrypt.hash(normalizedPassword, 10);

  // 4. Update student with account info
  await prisma.student.update({
    where: { nis: studentNis },
    data: {
      hasAccount: true,
      password: hashedPassword,
      mustChangePassword: true,
      accountCreatedAt: new Date(),
      accountCreatedBy: createdBy
    }
  });

  return {
    success: true,
    message: 'Akun berhasil dibuat. Password default: nomor HP orang tua.',
    studentNis,
    defaultPassword: normalizedPassword // Return for admin to communicate
  };
}
```

---

## Password Management

### Login Flow

```typescript
// src/lib/services/student-auth-service.ts

interface LoginInput {
  nis: string;
  password: string;
}

interface LoginResult {
  success: boolean;
  token?: string;
  mustChangePassword?: boolean;
  error?: string;
}

async function loginStudent(input: LoginInput): Promise<LoginResult> {
  const { nis, password } = input;

  // 1. Find student with active account
  const student = await prisma.student.findUnique({
    where: { nis }
  });

  if (!student || !student.hasAccount || student.accountDeleted) {
    return { success: false, error: 'NIS atau password salah' };
  }

  // 2. Verify password
  const isValidPassword = await bcrypt.compare(password, student.password!);

  if (!isValidPassword) {
    return { success: false, error: 'NIS atau password salah' };
  }

  // 3. Update last login
  await prisma.student.update({
    where: { nis },
    data: { lastLoginAt: new Date() }
  });

  // 4. Generate JWT token
  const token = generateStudentJWT({
    studentNis: student.nis,
    studentName: student.name
  });

  return {
    success: true,
    token,
    mustChangePassword: student.mustChangePassword
  };
}
```

### Change Password (Self-Service)

```typescript
// src/lib/services/student-auth-service.ts

interface ChangePasswordInput {
  studentNis: string;
  currentPassword: string;
  newPassword: string;
}

async function changePassword(input: ChangePasswordInput): Promise<boolean> {
  const { studentNis, currentPassword, newPassword } = input;

  const student = await prisma.student.findUnique({
    where: { nis: studentNis }
  });

  if (!student || !student.hasAccount || student.accountDeleted) {
    throw new Error('Akun tidak ditemukan');
  }

  // Verify current password
  const isValid = await bcrypt.compare(currentPassword, student.password!);
  if (!isValid) {
    throw new Error('Password lama salah');
  }

  // Validate new password
  if (newPassword.length < 8) {
    throw new Error('Password baru minimal 8 karakter');
  }

  // Hash and update
  const hashedPassword = await bcrypt.hash(newPassword, 10);

  await prisma.student.update({
    where: { nis: studentNis },
    data: {
      password: hashedPassword,
      mustChangePassword: false
    }
  });

  return true;
}
```

### Reset Password (Admin Only)

```typescript
// src/lib/services/student-account-service.ts

interface ResetPasswordInput {
  studentNis: string;
  resetBy: string; // Admin employee ID
}

async function resetPassword(input: ResetPasswordInput) {
  const { studentNis, resetBy } = input;

  const student = await prisma.student.findUnique({
    where: { nis: studentNis }
  });

  if (!student || !student.hasAccount) {
    throw new Error('Akun tidak ditemukan');
  }

  // Reset to parent phone number
  const normalizedPassword = student.parentPhone.replace(/\D/g, '');
  const hashedPassword = await bcrypt.hash(normalizedPassword, 10);

  await prisma.student.update({
    where: { nis: studentNis },
    data: {
      password: hashedPassword,
      mustChangePassword: true
    }
  });

  return {
    success: true,
    message: 'Password berhasil direset ke nomor HP orang tua.',
    newPassword: normalizedPassword // Return for admin to communicate
  };
}
```

---

## Soft Delete Implementation

### Criteria for Auto Soft Delete

Account will be soft deleted when **ALL** conditions are met:
1. All tuition transactions are **fully paid** (no outstanding balance)
2. No payment activity for **6 months**
3. Account is not already deleted

### Why Soft Delete?

1. **Query Performance**: Avoid loading inactive accounts in frequent queries
2. **Database Optimization**: Reduce index size and query time
3. **Audit Trail**: Keep history of deleted accounts
4. **Recovery**: Allow account restoration if needed
5. **Compliance**: Maintain records for financial audit

### Automated Cleanup Job

```typescript
// src/jobs/cleanup-inactive-accounts.ts

import { CronJob } from 'cron';

// Run daily at 2 AM
const cleanupJob = new CronJob('0 2 * * *', async () => {
  await cleanupInactiveAccounts();
});

async function cleanupInactiveAccounts() {
  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

  // Find students with accounts eligible for soft delete
  const eligibleStudents = await prisma.student.findMany({
    where: {
      hasAccount: true,
      accountDeleted: false,
      lastPaymentAt: {
        lt: sixMonthsAgo
      }
    },
    include: {
      tuitions: {
        where: {
          status: { not: 'PAID' } // Check for unpaid tuitions
        }
      }
    }
  });

  const studentsToDeactivate: string[] = [];

  for (const student of eligibleStudents) {
    // Only deactivate if ALL tuitions are paid
    const hasUnpaidTuitions = student.tuitions.length > 0;

    if (!hasUnpaidTuitions) {
      studentsToDeactivate.push(student.nis);
    }
  }

  // Batch soft delete
  if (studentsToDeactivate.length > 0) {
    await prisma.student.updateMany({
      where: {
        nis: { in: studentsToDeactivate }
      },
      data: {
        accountDeleted: true,
        accountDeletedAt: new Date(),
        accountDeletedBy: 'SYSTEM',
        accountDeletedReason: 'Auto cleanup: 6 months inactive with all payments completed'
      }
    });

    console.log(`Soft deleted ${studentsToDeactivate.length} inactive accounts`);
  }
}

export { cleanupJob, cleanupInactiveAccounts };
```

### Manual Soft Delete (Admin)

```typescript
// src/lib/services/student-account-service.ts

async function softDeleteAccount(studentNis: string, deletedBy: string, reason?: string) {
  return prisma.student.update({
    where: { nis: studentNis },
    data: {
      accountDeleted: true,
      accountDeletedAt: new Date(),
      accountDeletedBy: deletedBy,
      accountDeletedReason: reason || 'Manual deletion by admin'
    }
  });
}
```

### Restore Account (Admin)

```typescript
// src/lib/services/student-account-service.ts

async function restoreAccount(studentNis: string) {
  const student = await prisma.student.findUnique({
    where: { nis: studentNis }
  });

  if (!student) {
    throw new Error('Siswa tidak ditemukan');
  }

  if (!student.hasAccount) {
    throw new Error('Siswa tidak memiliki akun');
  }

  if (!student.accountDeleted) {
    throw new Error('Akun tidak dalam status terhapus');
  }

  return prisma.student.update({
    where: { nis: studentNis },
    data: {
      accountDeleted: false,
      accountDeletedAt: null,
      accountDeletedBy: null,
      accountDeletedReason: null
    }
  });
}
```

### Query Pattern (Active Accounts Only)

```typescript
// src/lib/prisma/student-account-extensions.ts

// Find student with active account
async function findStudentWithActiveAccount(nis: string) {
  return prisma.student.findFirst({
    where: {
      nis,
      hasAccount: true,
      accountDeleted: false
    }
  });
}

// List students with accounts (exclude deleted by default)
async function listStudentsWithAccounts(
  page: number,
  limit: number,
  includeDeleted = false
) {
  const where = {
    hasAccount: true,
    ...(includeDeleted ? {} : { accountDeleted: false })
  };

  const [students, total] = await Promise.all([
    prisma.student.findMany({
      where,
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { accountCreatedAt: 'desc' },
      select: {
        nis: true,
        name: true,
        parentName: true,
        parentPhone: true,
        hasAccount: true,
        mustChangePassword: true,
        lastLoginAt: true,
        lastPaymentAt: true,
        accountCreatedAt: true,
        accountDeleted: true,
        accountDeletedAt: true,
        accountDeletedReason: true
      }
    }),
    prisma.student.count({ where })
  ]);

  return { students, total };
}
```

---

## API Endpoints

### Student Endpoints

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/api/v1/student-auth/login` | Login with NIS + password | None |
| POST | `/api/v1/student-auth/logout` | Logout | Student |
| POST | `/api/v1/student-auth/change-password` | Change password | Student |
| GET | `/api/v1/student/profile` | Get profile | Student |

### Admin Endpoints

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/api/v1/admin/student-accounts` | List students with accounts | Admin |
| POST | `/api/v1/admin/students/:nis/account` | Create account for student | Admin |
| DELETE | `/api/v1/admin/students/:nis/account` | Soft delete account | Admin |
| POST | `/api/v1/admin/students/:nis/account/restore` | Restore account | Admin |
| POST | `/api/v1/admin/students/:nis/account/reset-password` | Reset password | Admin |

---

## Request/Response Examples

### Login

```typescript
// POST /api/v1/student-auth/login

// Request
{
  "nis": "2024001",
  "password": "081234567890" // Parent phone number
}

// Response (200)
{
  "success": true,
  "data": {
    "token": "jwt-token",
    "mustChangePassword": true,
    "user": {
      "studentNis": "2024001",
      "studentName": "Ahmad Rizki"
    }
  }
}
```

### Change Password

```typescript
// POST /api/v1/student-auth/change-password

// Request
{
  "currentPassword": "081234567890",
  "newPassword": "newSecurePassword123"
}

// Response (200)
{
  "success": true,
  "data": {
    "message": "Password berhasil diubah"
  }
}
```

### Create Account (Admin)

```typescript
// POST /api/v1/admin/students/:nis/account

// Response (201)
{
  "success": true,
  "data": {
    "studentNis": "2024001",
    "message": "Akun berhasil dibuat",
    "defaultPassword": "081234567890" // For admin to communicate to parent
  }
}
```

### Reset Password (Admin)

```typescript
// POST /api/v1/admin/students/:nis/account/reset-password

// Response (200)
{
  "success": true,
  "data": {
    "message": "Password berhasil direset ke nomor HP orang tua",
    "newPassword": "081234567890" // For admin to communicate to parent
  }
}
```

### List Students with Accounts (Admin)

```typescript
// GET /api/v1/admin/student-accounts?page=1&limit=10&includeDeleted=false

// Response
{
  "success": true,
  "data": {
    "students": [
      {
        "nis": "2024001",
        "name": "Ahmad Rizki",
        "parentName": "Budi Santoso",
        "parentPhone": "081234567890",
        "hasAccount": true,
        "mustChangePassword": false,
        "lastLoginAt": "2024-01-15T10:30:00Z",
        "lastPaymentAt": "2024-01-10T08:00:00Z",
        "accountCreatedAt": "2024-01-01T00:00:00Z",
        "accountDeleted": false
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 50,
      "totalPages": 5
    }
  }
}
```

---

## Security Considerations

1. **Admin-Only Creation**: Accounts can only be created by authenticated admins
2. **Default Password**: Parent phone number (normalized to digits only)
3. **Force Password Change**: Required on first login
4. **Password Policy**: Minimum 8 characters for new password
5. **Admin-Only Reset**: Password reset handled by admin, not self-service
6. **Soft Delete**: Maintains audit trail, allows recovery
7. **Rate Limiting**: Apply to login endpoint to prevent brute force

---

## Soft Delete Benefits for Performance

| Aspect | Benefit |
|--------|---------|
| Index Size | Smaller index with `WHERE accountDeleted = false` |
| Query Speed | Faster queries on active accounts only |
| Storage | Archived data can be moved to cold storage |
| Backup | Smaller backup size for active data |
| Audit | Complete history maintained for compliance |

---

## Migration Notes

To add account fields to existing Student table:

```sql
-- Add account columns to students table
ALTER TABLE students
ADD COLUMN has_account BOOLEAN DEFAULT FALSE,
ADD COLUMN password VARCHAR(255),
ADD COLUMN must_change_password BOOLEAN DEFAULT TRUE,
ADD COLUMN last_login_at TIMESTAMP,
ADD COLUMN last_payment_at TIMESTAMP,
ADD COLUMN account_created_at TIMESTAMP,
ADD COLUMN account_created_by VARCHAR(255),
ADD COLUMN account_deleted BOOLEAN DEFAULT FALSE,
ADD COLUMN account_deleted_at TIMESTAMP,
ADD COLUMN account_deleted_by VARCHAR(255),
ADD COLUMN account_deleted_reason TEXT;

-- Add indexes
CREATE INDEX idx_students_has_account ON students(has_account);
CREATE INDEX idx_students_account_active ON students(has_account, account_deleted);
CREATE INDEX idx_students_last_payment ON students(last_payment_at);
```
