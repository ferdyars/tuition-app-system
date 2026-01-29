# Database Schema - Prisma Schema

## Complete Prisma Schema

```prisma
// prisma/schema.prisma

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// ============================================
// ENUMS
// ============================================

enum Role {
  ADMIN
  CASHIER
}

enum PaymentStatus {
  UNPAID
  PAID
  PARTIAL
}

enum Month {
  JULY
  AUGUST
  SEPTEMBER
  OCTOBER
  NOVEMBER
  DECEMBER
  JANUARY
  FEBRUARY
  MARCH
  APRIL
  MAY
  JUNE
}

// ============================================
// EMPLOYEE MANAGEMENT
// ============================================

model Employee {
  employeeId  String   @id @default(uuid()) @map("employee_id")
  name        String
  email       String   @unique
  password    String   // Hashed - default is bcrypt of "123456"
  role        Role     @default(CASHIER)
  createdAt   DateTime @default(now()) @map("created_at")
  updatedAt   DateTime @updatedAt @map("updated_at")

  // Relations
  payments    Payment[]

  @@map("employees")
}

// ============================================
// STUDENT MANAGEMENT
// ============================================

model Student {
  nis              String   @id @map("nis") // Student ID (Primary)
  nik              String   @unique @map("nik") // National ID Number
  name             String
  address          String
  parentName       String   @map("parent_name")
  parentPhone      String   @map("parent_phone")
  startJoinDate    DateTime @map("start_join_date")
  createdAt        DateTime @default(now()) @map("created_at")
  updatedAt        DateTime @updatedAt @map("updated_at")

  // Relations
  scholarships     Scholarship[]
  tuitions         Tuition[]

  @@map("students")
}

// ============================================
// ACADEMIC YEAR MANAGEMENT
// ============================================

model AcademicYear {
  id            String   @id @default(uuid())
  year          String   @unique // Format: "2024/2025"
  startDate     DateTime @map("start_date") // July 1st
  endDate       DateTime @map("end_date")   // June 30th next year
  isActive      Boolean  @default(false) @map("is_active")
  createdAt     DateTime @default(now()) @map("created_at")
  updatedAt     DateTime @updatedAt @map("updated_at")

  // Relations
  classAcademics ClassAcademic[]

  @@map("academic_years")
}

// ============================================
// CLASS MANAGEMENT
// ============================================

model ClassAcademic {
  id              String   @id @default(uuid())
  academicYearId  String   @map("academic_year_id")
  grade           Int      // 1-12
  section         String   // A, B, IPA, IPS, etc.
  className       String   @map("class_name") // Generated: "XII-IPA-2024/2025"
  createdAt       DateTime @default(now()) @map("created_at")
  updatedAt       DateTime @updatedAt @map("updated_at")

  // Relations
  academicYear    AcademicYear @relation(fields: [academicYearId], references: [id], onDelete: Cascade)
  tuitions        Tuition[]
  scholarships    Scholarship[]

  @@unique([academicYearId, grade, section])
  @@map("class_academics")
}

// ============================================
// TUITION MANAGEMENT
// ============================================

model Tuition {
  id              String        @id @default(uuid())
  classAcademicId String        @map("class_academic_id")
  studentNis      String        @map("student_nis")
  month           Month
  year            Int           // Calendar year
  feeAmount       Decimal       @map("fee_amount") @db.Decimal(10, 2)
  paidAmount      Decimal       @default(0) @map("paid_amount") @db.Decimal(10, 2)
  status          PaymentStatus @default(UNPAID)
  dueDate         DateTime      @map("due_date")
  generatedAt     DateTime      @default(now()) @map("generated_at")
  createdAt       DateTime      @default(now()) @map("created_at")
  updatedAt       DateTime      @updatedAt @map("updated_at")

  // Relations
  classAcademic   ClassAcademic @relation(fields: [classAcademicId], references: [id], onDelete: Cascade)
  student         Student       @relation(fields: [studentNis], references: [nis], onDelete: Cascade)
  payments        Payment[]

  @@unique([classAcademicId, studentNis, month, year])
  @@index([studentNis])
  @@index([classAcademicId])
  @@index([status])
  @@index([dueDate])
  @@map("tuitions")
}

// ============================================
// SCHOLARSHIP MANAGEMENT
// ============================================

model Scholarship {
  id              String   @id @default(uuid())
  studentNis      String   @map("student_nis")
  classAcademicId String   @map("class_academic_id")
  nominal         Decimal  @db.Decimal(10, 2) // Scholarship amount
  isFullScholarship Boolean @default(false) @map("is_full_scholarship")
  createdAt       DateTime @default(now()) @map("created_at")
  updatedAt       DateTime @updatedAt @map("updated_at")

  // Relations
  student         Student       @relation(fields: [studentNis], references: [nis], onDelete: Cascade)
  classAcademic   ClassAcademic @relation(fields: [classAcademicId], references: [id], onDelete: Cascade)

  @@unique([studentNis, classAcademicId])
  @@index([studentNis])
  @@index([classAcademicId])
  @@map("scholarships")
}

// ============================================
// PAYMENT MANAGEMENT
// ============================================

model Payment {
  id          String   @id @default(uuid())
  tuitionId   String   @map("tuition_id")
  employeeId  String   @map("employee_id") // Cashier who processed
  amount      Decimal  @db.Decimal(10, 2)
  paymentDate DateTime @default(now()) @map("payment_date")
  notes       String?
  createdAt   DateTime @default(now()) @map("created_at")
  updatedAt   DateTime @updatedAt @map("updated_at")

  // Relations
  tuition     Tuition  @relation(fields: [tuitionId], references: [id], onDelete: Cascade)
  employee    Employee @relation(fields: [employeeId], references: [employeeId], onDelete: Restrict)

  @@index([tuitionId])
  @@index([employeeId])
  @@index([paymentDate])
  @@map("payments")
}
```

## Key Schema Decisions

### 1. Primary Keys
- **Employee**: UUID (employee_id)
- **Student**: NIS (string - student ID)
- **AcademicYear**: UUID
- **ClassAcademic**: UUID
- **Tuition**: UUID (with unique constraint on class + student + month + year)
- **Scholarship**: UUID (with unique constraint on student + class)
- **Payment**: UUID

### 2. Enums
- **Role**: ADMIN, CASHIER
- **PaymentStatus**: UNPAID, PAID, PARTIAL
- **Month**: JULY through JUNE (academic calendar order)

### 3. Unique Constraints
- Employee email must be unique
- Student NIK must be unique
- Academic year must be unique
- Class per academic year (grade + section) must be unique
- Tuition per student per month per year must be unique
- Scholarship per student per class must be unique

### 4. Cascade Deletions
- Deleting Academic Year → Deletes all related classes
- Deleting Class → Deletes all related tuitions and scholarships
- Deleting Student → Deletes all related tuitions and scholarships
- Deleting Tuition → Deletes all related payments

### 5. Indexes
Created on frequently queried fields:
- Student NIS (foreign key lookups)
- Class Academic ID (foreign key lookups)
- Payment status (filtering overdue)
- Due date (reporting)
- Payment date (reporting)

## Database Relationships

```
AcademicYear (1) ──→ (N) ClassAcademic
                            │
                            ├─→ (N) Tuition ──→ (N) Payment
                            │        │
                            │        └─→ (1) Student
                            │
                            └─→ (N) Scholarship ──→ (1) Student

Employee (1) ──→ (N) Payment
```

## Migration Commands

```bash
# Generate Prisma Client
npx prisma generate

# Create migration
npx prisma migrate dev --name init

# Apply migrations
npx prisma migrate deploy

# Reset database (dev only)
npx prisma migrate reset

# Seed database
npx prisma db seed
```

## Seed Data Script

```typescript
// prisma/seed.ts

import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  // Create default admin
  const hashedPassword = await bcrypt.hash('123456', 10);
  
  const admin = await prisma.employee.upsert({
    where: { email: 'admin@school.com' },
    update: {},
    create: {
      name: 'System Administrator',
      email: 'admin@school.com',
      password: hashedPassword,
      role: 'ADMIN',
    },
  });

  console.log('Created admin:', admin);

  // Create default cashier
  const cashier = await prisma.employee.upsert({
    where: { email: 'cashier@school.com' },
    update: {},
    create: {
      name: 'Default Cashier',
      email: 'cashier@school.com',
      password: hashedPassword,
      role: 'CASHIER',
    },
  });

  console.log('Created cashier:', cashier);

  // Create academic year 2024/2025
  const academicYear = await prisma.academicYear.upsert({
    where: { year: '2024/2025' },
    update: {},
    create: {
      year: '2024/2025',
      startDate: new Date('2024-07-01'),
      endDate: new Date('2025-06-30'),
      isActive: true,
    },
  });

  console.log('Created academic year:', academicYear);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
```

## Environment Variables

```env
# .env.local

# Supabase
DATABASE_URL="postgresql://postgres:[YOUR-PASSWORD]@db.[YOUR-PROJECT-REF].supabase.co:5432/postgres"
DIRECT_URL="postgresql://postgres:[YOUR-PASSWORD]@db.[YOUR-PROJECT-REF].supabase.co:5432/postgres"

NEXT_PUBLIC_SUPABASE_URL="https://[YOUR-PROJECT-REF].supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="[YOUR-ANON-KEY]"
SUPABASE_SERVICE_ROLE_KEY="[YOUR-SERVICE-ROLE-KEY]"

# NextAuth (if using)
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="[GENERATE-WITH-openssl-rand-base64-32]"
```

## Supabase Setup

1. Create new Supabase project
2. Get connection string from Settings → Database
3. Enable Row Level Security (RLS) on all tables
4. Create RLS policies for role-based access
5. Run Prisma migrations

## Example RLS Policies

```sql
-- Enable RLS
ALTER TABLE employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE students ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

-- Admin can do everything
CREATE POLICY "Admin full access" ON employees
  FOR ALL
  USING (auth.jwt() ->> 'role' = 'ADMIN');

-- Cashier can only view and create payments
CREATE POLICY "Cashier read students" ON students
  FOR SELECT
  USING (auth.jwt() ->> 'role' IN ('ADMIN', 'CASHIER'));

CREATE POLICY "Cashier create payments" ON payments
  FOR INSERT
  WITH CHECK (auth.jwt() ->> 'role' IN ('ADMIN', 'CASHIER'));
```
