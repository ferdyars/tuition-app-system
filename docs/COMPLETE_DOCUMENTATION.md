# Step-by-Step Execution Guide for Claude Code

## Purpose
This guide breaks down the project into manageable phases to prevent token exhaustion and ensure complete implementation. Each phase is designed to be completed in a single Claude Code session.

## Overview
Total estimated time: 10-15 sessions
Each session: 30-60 minutes of focused work

---

## PHASE 1: Project Foundation (Session 1)
**Goal**: Set up project structure and database

### Tasks:
1. Create Next.js project
```bash
npx create-next-app@latest school-tuition-system --typescript --tailwind --app --src-dir
cd school-tuition-system
```

2. Install all dependencies (see 08-DEPLOYMENT.md)

3. Setup Supabase project
   - Create account/project
   - Get connection strings
   - Update .env.local

4. Create Prisma schema
   - Copy schema from `02-DATABASE-SCHEMA.md`
   - Run `npx prisma generate`
   - Run `npx prisma db push`

5. Create and run seed file
   - Copy seed from `08-DEPLOYMENT.md`
   - Run `npm run prisma:seed`

### Verification:
- [ ] Project builds without errors
- [ ] Database tables created in Supabase
- [ ] Default admin/cashier accounts exist
- [ ] Prisma Studio shows data

### Next Session Input:
"I've completed Phase 1. Database is set up with tables and seed data. Ready for Phase 2: Authentication & Layout."

---

## PHASE 2: Authentication & Layout (Session 2)
**Goal**: Implement authentication and dashboard layout

### Tasks:
1. Create Supabase client (`src/lib/supabase.ts`)
2. Create auth store (`src/store/auth-store.ts`)
3. Create useAuth hook (`src/hooks/useAuth.ts`)
4. Implement login page (`app/(auth)/login/page.tsx`)
5. Create dashboard layout:
   - Header component
   - Sidebar component
   - Main layout wrapper
6. Add route protection middleware

### Verification:
- [ ] Can login with admin@school.com / 123456
- [ ] Sidebar shows appropriate menu for role
- [ ] Logout works
- [ ] Protected routes redirect to login

### Next Session Input:
"Phase 2 complete. Authentication works and dashboard layout is ready. Starting Phase 3: Employee Management."

---

## PHASE 3: Employee Management (Session 3)
**Goal**: Complete CRUD for employees

### Tasks:
1. Create API routes:
   - GET /api/v1/employees
   - POST /api/v1/employees
   - PUT /api/v1/employees/[id]
   - DELETE /api/v1/employees/[id]
   - POST /api/v1/employees/[id]/reset-password

2. Create query keys (`src/lib/query-keys.ts` - employees section)

3. Create hooks (`src/hooks/api/useEmployees.ts`)

4. Create components:
   - EmployeeTable
   - EmployeeForm
   
5. Create pages:
   - /employees (list)
   - /employees/new (create)
   - /employees/[id] (edit)

### Verification:
- [ ] Can create employee
- [ ] Can list employees with pagination
- [ ] Can edit employee
- [ ] Can delete employee
- [ ] Can reset password

### Next Session Input:
"Phase 3 done. Employee management is fully functional. Moving to Phase 4: Student Management."

---

## PHASE 4: Student Management (Session 4)
**Goal**: Complete student CRUD and Excel import

### Tasks:
1. Create API routes:
   - GET /api/v1/students
   - POST /api/v1/students
   - PUT /api/v1/students/[nis]
   - DELETE /api/v1/students/[nis]
   - POST /api/v1/students/import
   - GET /api/v1/students/template

2. Create hooks (`src/hooks/api/useStudents.ts`)

3. Create Excel utilities:
   - `src/lib/excel-utils.ts`
   - `src/lib/excel-templates/student-template.ts`

4. Create components:
   - StudentTable
   - StudentForm
   - ExcelUploader

5. Create pages:
   - /students (list)
   - /students/new (create)
   - /students/[nis] (edit)
   - /students/import (Excel import)

### Verification:
- [ ] Can create student manually
- [ ] Can download Excel template
- [ ] Can import students via Excel
- [ ] Validation works correctly
- [ ] Can edit/delete students

### Next Session Input:
"Phase 4 complete. Student management with Excel import works. Ready for Phase 5: Academic Years & Classes."

---

## PHASE 5: Academic Years & Classes (Session 5)
**Goal**: Implement academic year and class management

### Tasks:
1. Academic Years:
   - API routes (GET, POST, PUT, DELETE)
   - Hooks
   - Form component
   - List page

2. Classes:
   - API routes
   - Hooks  
   - Class name generator (`src/lib/business-logic/class-name-generator.ts`)
   - Excel template for mass import
   - Components (table, form)
   - Pages (list, new, import)

### Verification:
- [ ] Can create academic years
- [ ] Can set active academic year
- [ ] Can create classes manually
- [ ] Can import classes via Excel
- [ ] Class names follow pattern (XII-IPA-2024/2025)

### Next Session Input:
"Phase 5 done. Academic years and classes are working. Next: Phase 6: Tuition Generation."

---

## PHASE 6: Tuition Generation (Session 6)
**Goal**: Implement smart tuition generator

### Tasks:
1. Create business logic:
   - `src/lib/business-logic/tuition-generator.ts`
   - Date calculation logic
   - Month skipping for mid-year joins

2. Create API routes:
   - GET /api/v1/tuitions
   - POST /api/v1/tuitions/generate
   - POST /api/v1/tuitions/generate-bulk

3. Create hooks

4. Create components:
   - TuitionGeneratorForm
   - TuitionTable (with filters)

5. Create pages:
   - /tuitions (list with filters)
   - /tuitions/generate (generator form)

### Verification:
- [ ] Can generate tuitions for a class
- [ ] Students joining mid-year skip previous months
- [ ] Due dates are correct (10th of each month)
- [ ] Can filter tuitions by status, class, month
- [ ] Generated tuitions show in table

### Next Session Input:
"Phase 6 complete. Tuition generator works with smart date handling. Moving to Phase 7: Scholarships."

---

## PHASE 7: Scholarship Management (Session 7)
**Goal**: Implement scholarship system with auto-payment

### Tasks:
1. Create business logic:
   - `src/lib/business-logic/scholarship-processor.ts`
   - Auto-payment logic for full scholarships

2. Create API routes:
   - GET /api/v1/scholarships
   - POST /api/v1/scholarships
   - POST /api/v1/scholarships/import
   - DELETE /api/v1/scholarships/[id]

3. Create Excel template with dropdowns

4. Create components:
   - ScholarshipTable
   - ScholarshipImportForm

5. Create pages:
   - /scholarships (list)
   - /scholarships/import

### Verification:
- [ ] Can import scholarships via Excel
- [ ] Full scholarships auto-mark tuitions as PAID
- [ ] Partial scholarships recorded correctly
- [ ] Can view scholarship list

### Next Session Input:
"Phase 7 done. Scholarships with auto-payment work. Ready for Phase 8: Payment Processing."

---

## PHASE 8: Payment Processing (Session 8)
**Goal**: Implement payment system for cashiers

### Tasks:
1. Create business logic:
   - `src/lib/business-logic/payment-processor.ts`
   - Status calculation (UNPAID → PARTIAL → PAID)

2. Create API routes:
   - GET /api/v1/payments
   - POST /api/v1/payments
   - DELETE /api/v1/payments/[id] (admin only)

3. Create hooks

4. Create components:
   - PaymentForm (with student/tuition selection)
   - PaymentTable

5. Create pages:
   - /payments (list)
   - /payments/new (process payment)

### Verification:
- [ ] Cashier can select student and unpaid tuition
- [ ] Can process partial payment
- [ ] Can process full payment
- [ ] Payment updates tuition status correctly
- [ ] Admin can reverse payment

### Next Session Input:
"Phase 8 complete. Payment processing works. Moving to Phase 9: Reports."

---

## PHASE 9: Reporting System (Session 9)
**Goal**: Implement overdue and summary reports

### Tasks:
1. Create business logic:
   - `src/lib/business-logic/overdue-calculator.ts`

2. Create API routes:
   - GET /api/v1/reports/overdue
   - GET /api/v1/reports/overdue/export
   - GET /api/v1/reports/class-summary

3. Create hooks

4. Create components:
   - OverdueReportTable
   - ClassSummaryCards

5. Create pages:
   - /reports/overdue
   - /reports/class-summary

### Verification:
- [ ] Overdue report shows correct data
- [ ] Can filter by class/grade/academic year
- [ ] Can export to Excel
- [ ] Class summary shows statistics
- [ ] Days overdue calculated correctly

### Next Session Input:
"Phase 9 done. Reports are working. Final phase: Phase 10: Polish & Testing."

---

## PHASE 10: Polish & Documentation (Session 10)
**Goal**: Final touches and Swagger docs

### Tasks:
1. Add Swagger configuration:
   - Install next-swagger-doc
   - Create swagger config
   - Add /api-docs page
   - Document key endpoints

2. Add error handling:
   - API error boundaries
   - Toast notifications for errors
   - Loading states

3. Add UI polish:
   - Empty states
   - Loading skeletons
   - Proper spacing/typography

4. Create README.md for deployment

5. Test critical flows:
   - Complete payment flow
   - Excel import flow
   - Report generation

### Verification:
- [ ] Swagger docs accessible
- [ ] All endpoints documented
- [ ] Error handling works
- [ ] UI looks polished
- [ ] All features tested

### Next Session Input:
"Phase 10 complete. System is production-ready!"

---

## Emergency Recovery

If session ends mid-phase:

1. Note exactly what was completed
2. Check what files were created
3. Start next session with:
   "I was in Phase X, completed tasks 1-3. Need to continue from task 4: [task description]. Here's what I have so far: [brief summary]"

## Context Persistence

At the start of each session, load:
1. Current phase number
2. Relevant docs (use the numbering system 01-08)
3. Previous session summary

Example prompt:
```
I'm starting Phase 4 (Student Management). 
Please load these context files:
- 02-DATABASE-SCHEMA.md (for Student model)
- 03-API-ENDPOINTS.md (for API structure)
- 04-FRONTEND-STRUCTURE.md (for component patterns)
- 05-QUERY-KEY-FACTORY.md (for hooks)
- 06-EXCEL-TEMPLATES.md (for import functionality)

Phase 3 (Employee Management) is complete and working.
Ready to implement Student CRUD and Excel import.
```

## Progress Tracking

Create a checklist file:

```markdown
# Project Progress

## ✅ Completed
- [ ] Phase 1: Foundation
- [ ] Phase 2: Auth & Layout
- [ ] Phase 3: Employees
- [ ] Phase 4: Students
- [ ] Phase 5: Academic Years & Classes
- [ ] Phase 6: Tuitions
- [ ] Phase 7: Scholarships
- [ ] Phase 8: Payments
- [ ] Phase 9: Reports
- [ ] Phase 10: Polish

## Current Phase
Phase X: [Name]

## Notes
[Add any important notes or decisions]
```

## Tips for Success

1. **One phase per session**: Don't skip ahead
2. **Test before moving on**: Verify each phase works
3. **Commit after each phase**: Use git to save progress
4. **Document issues**: Keep notes of any problems
5. **Take breaks**: Don't rush through phases
6. **Ask for help**: If stuck, describe the issue clearly

## Estimated Timeline

- **Fast pace**: 10 sessions (1-2 weeks)
- **Moderate pace**: 10-15 sessions (2-3 weeks)
- **Careful pace**: 15-20 sessions (3-4 weeks)

Choose your pace based on:
- Your familiarity with the stack
- Available time per session
- Complexity comfort level

## Success Criteria

Project is complete when:
- [ ] All 10 phases finished
- [ ] All verification checkboxes passed
- [ ] System deployed and accessible
- [ ] Default credentials work
- [ ] All core features functional
- [ ] Documentation complete
# School Tuition Management System - Project Overview

## Project Description
A comprehensive school tuition management system with role-based access control, automated tuition generation, scholarship management, and reporting capabilities.

## Core Features

### 1. Role-Based Access Control
- **Admin Role**: Full system management access
- **Cashier Role**: Limited to transaction processing only

### 2. Employee Management
- Create and manage employees
- Assign roles (Admin/Cashier)
- Default password: `123456`
- UUID-based employee IDs

### 3. Student Management
- Complete student profiles
- Mass import/update via Excel
- Track enrollment dates
- Parent information management

### 4. Academic Year Management
- Define school years (e.g., 2024/2025)
- Track academic periods

### 5. Class Management
- Classes organized by academic year
- Grades 1-12 supported
- Custom sections (A, IPA, IPS, etc.)
- Mass import capability
- Pattern: `GRADE-SECTION-YEAR` (e.g., `I-A-2016/2017`, `XII-IPA-2016/2017`)

### 6. Tuition Generation System
- Automated monthly tuition tracking (July - June)
- Smart date handling (students joining mid-year skip previous months)
- Example: Student joining January 2026 → June-December 2025 skipped
- Bulk generation per class

### 7. Scholarship Management
- Full/partial scholarship support
- Mass import only
- Auto-payment for full scholarships (marks as paid automatically)
- Per student, per class assignment

### 8. Payment Tracking
- Track payment status per month
- Integration with scholarship system
- Cashier transaction recording

### 9. Reporting System
- Overdue payments per academic class
- Global overdue payment report
- Exportable reports

## Tech Stack

### Frontend
- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **UI Library**: Mantine UI v7
- **State Management**: Zustand
- **Data Fetching**: TanStack Query v5 (with Query Key Factory pattern)
- **Forms**: React Hook Form + Zod validation
- **Tables**: Mantine React Table v2
- **Excel**: SheetJS (xlsx)

### Backend
- **Database**: Supabase (PostgreSQL)
- **ORM**: Prisma
- **API**: Next.js API Routes
- **Documentation**: Swagger/OpenAPI
- **Authentication**: Supabase Auth

### Features
- Server-side pagination
- Advanced filtering
- Excel import/export with templates
- Data validation with dropdowns
- Real-time updates

## Database Schema Overview

### Core Tables
1. **employees** - Staff management
2. **students** - Student records
3. **academic_years** - School year definitions
4. **class_academics** - Classes per academic year
5. **tuitions** - Monthly tuition records
6. **scholarships** - Scholarship assignments
7. **payments** - Payment transactions

### Relationships
- Classes → Academic Years (many-to-one)
- Tuitions → Class Academics (many-to-one)
- Scholarships → Students & Class Academics (many-to-one)
- Payments → Tuitions (many-to-one)

## Development Approach

### Phase 1: Foundation
- Project setup with Next.js 14
- Prisma schema definition
- Supabase configuration
- Base UI components with Mantine

### Phase 2: Core Features
- Authentication & authorization
- Employee management
- Student management with Excel import
- Academic year & class management

### Phase 3: Business Logic
- Tuition generator with date logic
- Scholarship management with auto-payment
- Payment processing

### Phase 4: Reporting & Polish
- Report generation
- Excel exports
- Performance optimization
- Testing

## File Structure
```
school-tuition-system/
├── docs/                           # Claude Code context files
│   ├── 01-PROJECT-OVERVIEW.md
│   ├── 02-DATABASE-SCHEMA.md
│   ├── 03-API-ENDPOINTS.md
│   ├── 04-FRONTEND-STRUCTURE.md
│   ├── 05-QUERY-KEY-FACTORY.md
│   ├── 06-EXCEL-TEMPLATES.md
│   ├── 07-BUSINESS-LOGIC.md
│   └── 08-DEPLOYMENT.md
├── prisma/
│   └── schema.prisma
├── src/
│   ├── app/                        # Next.js app router
│   ├── components/                 # React components
│   ├── lib/                        # Utilities & configs
│   ├── hooks/                      # Custom React hooks
│   ├── store/                      # Zustand stores
│   └── types/                      # TypeScript types
├── public/
│   └── templates/                  # Excel templates
└── package.json
```

## Key Business Rules

### Tuition Generation
1. Academic year runs July - June
2. Generate 12 monthly tuition records per student per class
3. If student joins mid-year, skip all previous months
4. Example: Join date = January 2026 → Generate only Jan-Jun 2026

### Scholarship Rules
1. Full scholarship → Auto-mark all tuition as PAID
2. Partial scholarship → Reduce tuition amount
3. Scholarships are class-specific
4. Mass import only (no manual entry)

### Payment Rules
1. Track payment date and amount
2. Link to specific tuition record
3. Cashier records transactions
4. Cannot pay twice for same month

### Class Naming Pattern
- Format: `{GRADE}-{SECTION}-{ACADEMIC_YEAR}`
- Grade: I, II, III, IV, V, VI, VII, VIII, IX, X, XI, XII (1-12)
- Section: Free text (A, B, IPA, IPS, BAHASA, etc.)
- Academic Year: YYYY/YYYY format (2024/2025)
- Examples:
  - `I-A-2024/2025` (Grade 1, Section A)
  - `XII-IPA-2024/2025` (Grade 12, Science track)

## Excel Import Features

### Student Import Columns
- NIS (Primary - dropdown validation)
- NIK (Text with validation)
- Name (Required)
- Address (Text)
- Parent Name (Required)
- Parent Phone (Phone format)
- Start Join Date (Date picker)

### Class Import Columns
- Academic Year (Dropdown from existing years)
- Grade (Dropdown 1-12)
- Section (Free text)

### Scholarship Import Columns
- NIS (Dropdown from existing students)
- Class Academic (Dropdown from existing classes)
- Nominal (Number format)

## Security & Permissions

### Admin Permissions
- Full CRUD on all modules
- View all reports
- Manage employees
- Generate tuitions
- Process payments

### Cashier Permissions
- View students (read-only)
- View classes (read-only)
- Process payments only
- View payment reports

## Next Steps
1. Review all context files (02-08)
2. Set up project with `npx create-next-app@latest`
3. Configure Prisma with Supabase
4. Implement authentication
5. Build core features module by module
6. Create Excel templates
7. Implement reports
8. Deploy to production

## Context Files for Claude Code
All context files are numbered 01-08 for easy reference. Load them sequentially for complete project understanding.
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
# API Endpoints & Swagger Documentation

## API Structure

All API routes follow RESTful conventions under `/api/v1/`

## Authentication

All endpoints require authentication via Supabase Auth.

```typescript
// Middleware for role checking
export function requireRole(allowedRoles: Role[]) {
  return async (req: NextRequest) => {
    const session = await getSession(req);
    if (!session || !allowedRoles.includes(session.user.role)) {
      return new Response('Forbidden', { status: 403 });
    }
  };
}
```

## API Endpoints

### 1. Authentication

#### POST /api/v1/auth/login
Login with email and password

**Request Body:**
```json
{
  "email": "admin@school.com",
  "password": "123456"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "user": {
      "employeeId": "uuid",
      "name": "System Administrator",
      "email": "admin@school.com",
      "role": "ADMIN"
    },
    "token": "jwt-token"
  }
}
```

#### POST /api/v1/auth/logout
Logout current user

#### GET /api/v1/auth/me
Get current user info

---

### 2. Employees (Admin Only)

#### GET /api/v1/employees
List all employees with pagination

**Query Parameters:**
- `page` (number, default: 1)
- `limit` (number, default: 10)
- `search` (string, optional)
- `role` (ADMIN | CASHIER, optional)

**Response:**
```json
{
  "success": true,
  "data": {
    "employees": [...],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 25,
      "totalPages": 3
    }
  }
}
```

#### POST /api/v1/employees
Create new employee

**Request Body:**
```json
{
  "name": "John Doe",
  "email": "john@school.com",
  "role": "CASHIER"
}
```

#### PUT /api/v1/employees/:id
Update employee

#### DELETE /api/v1/employees/:id
Delete employee

#### POST /api/v1/employees/:id/reset-password
Reset employee password to default (123456)

---

### 3. Students (Admin: Full, Cashier: Read)

#### GET /api/v1/students
List students with pagination and filters

**Query Parameters:**
- `page` (number)
- `limit` (number)
- `search` (string) - Search by NIS, NIK, name
- `startJoinDateFrom` (date)
- `startJoinDateTo` (date)

**Response:**
```json
{
  "success": true,
  "data": {
    "students": [
      {
        "nis": "2024001",
        "nik": "3578123456789012",
        "name": "Ahmad Rizki",
        "address": "Jl. Merdeka No. 123",
        "parentName": "Budi Santoso",
        "parentPhone": "081234567890",
        "startJoinDate": "2024-07-01T00:00:00Z"
      }
    ],
    "pagination": {...}
  }
}
```

#### POST /api/v1/students
Create single student (Admin only)

#### PUT /api/v1/students/:nis
Update student (Admin only)

#### DELETE /api/v1/students/:nis
Delete student (Admin only)

#### POST /api/v1/students/import
Mass import students from Excel (Admin only)

**Request:** multipart/form-data
- `file`: Excel file (.xlsx)

**Response:**
```json
{
  "success": true,
  "data": {
    "imported": 45,
    "updated": 5,
    "errors": [
      {
        "row": 12,
        "nis": "2024012",
        "error": "Duplicate NIK"
      }
    ]
  }
}
```

#### POST /api/v1/students/export
Export students to Excel

**Request Body:**
```json
{
  "filters": {
    "search": "Ahmad"
  }
}
```

**Response:** Excel file download

#### GET /api/v1/students/template
Download Excel import template

---

### 4. Academic Years (Admin Only)

#### GET /api/v1/academic-years
List all academic years

**Query Parameters:**
- `page` (number)
- `limit` (number)
- `isActive` (boolean)

#### POST /api/v1/academic-years
Create academic year

**Request Body:**
```json
{
  "year": "2025/2026",
  "startDate": "2025-07-01",
  "endDate": "2026-06-30",
  "isActive": true
}
```

#### PUT /api/v1/academic-years/:id
Update academic year

#### DELETE /api/v1/academic-years/:id
Delete academic year

#### POST /api/v1/academic-years/:id/set-active
Set academic year as active (deactivates others)

---

### 5. Class Academics (Admin Only)

#### GET /api/v1/class-academics
List classes with filters

**Query Parameters:**
- `page` (number)
- `limit` (number)
- `academicYearId` (string)
- `grade` (number 1-12)
- `search` (string) - Search className

**Response:**
```json
{
  "success": true,
  "data": {
    "classes": [
      {
        "id": "uuid",
        "academicYearId": "uuid",
        "grade": 12,
        "section": "IPA",
        "className": "XII-IPA-2024/2025",
        "academicYear": {
          "year": "2024/2025"
        },
        "_count": {
          "tuitions": 30,
          "scholarships": 5
        }
      }
    ],
    "pagination": {...}
  }
}
```

#### POST /api/v1/class-academics
Create single class

**Request Body:**
```json
{
  "academicYearId": "uuid",
  "grade": 12,
  "section": "IPA"
}
```

#### POST /api/v1/class-academics/import
Mass import classes

**Request:** multipart/form-data
- `file`: Excel file

#### PUT /api/v1/class-academics/:id
Update class

#### DELETE /api/v1/class-academics/:id
Delete class

#### GET /api/v1/class-academics/template
Download Excel template

---

### 6. Tuitions (Admin Only for Generation/Edit)

#### GET /api/v1/tuitions
List tuitions with filters

**Query Parameters:**
- `page` (number)
- `limit` (number)
- `classAcademicId` (string)
- `studentNis` (string)
- `status` (UNPAID | PAID | PARTIAL)
- `month` (JULY - JUNE)
- `year` (number)
- `dueDateFrom` (date)
- `dueDateTo` (date)

#### POST /api/v1/tuitions/generate
Generate tuitions for a class

**Request Body:**
```json
{
  "classAcademicId": "uuid",
  "feeAmount": 500000,
  "studentNisList": ["2024001", "2024002"], // Optional - if empty, all students
  "startMonth": "JULY", // Optional - default JULY
  "startYear": 2024 // Optional - default current academic year
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "generated": 360, // 30 students × 12 months
    "skipped": 120, // Students joined mid-year
    "details": {
      "totalStudents": 30,
      "monthsGenerated": 12
    }
  }
}
```

**Business Logic:**
1. Get all students in class (or specified students)
2. For each student:
   - Get their `startJoinDate`
   - Generate tuitions from their join month to June
   - Skip months before join date
3. Check for existing tuitions (don't duplicate)
4. Set due date: 10th of each month
5. Auto-apply scholarships if exist

#### POST /api/v1/tuitions/generate-bulk
Generate for multiple classes at once

**Request Body:**
```json
{
  "classes": [
    {
      "classAcademicId": "uuid-1",
      "feeAmount": 500000
    },
    {
      "classAcademicId": "uuid-2",
      "feeAmount": 600000
    }
  ]
}
```

#### GET /api/v1/tuitions/:id
Get single tuition details

#### PUT /api/v1/tuitions/:id
Update tuition (Admin only)

#### DELETE /api/v1/tuitions/:id
Delete tuition (Admin only)

---

### 7. Scholarships (Admin Only)

#### GET /api/v1/scholarships
List scholarships

**Query Parameters:**
- `page` (number)
- `limit` (number)
- `classAcademicId` (string)
- `studentNis` (string)
- `isFullScholarship` (boolean)

#### POST /api/v1/scholarships
Create single scholarship

**Request Body:**
```json
{
  "studentNis": "2024001",
  "classAcademicId": "uuid",
  "nominal": 500000
}
```

**Business Logic:**
1. Check if nominal >= monthly fee → Set `isFullScholarship = true`
2. If full scholarship:
   - Find all UNPAID tuitions for this student in this class
   - Mark them as PAID with paidAmount = feeAmount
   - Create system payment records

#### POST /api/v1/scholarships/import
Mass import scholarships

**Request:** multipart/form-data
- `file`: Excel file

**Excel Columns:**
- Student NIS (dropdown)
- Class Academic (dropdown)
- Nominal (number)

#### DELETE /api/v1/scholarships/:id
Delete scholarship

**Note:** Deleting scholarship does NOT revert auto-paid tuitions

---

### 8. Payments (Admin & Cashier)

#### GET /api/v1/payments
List payments

**Query Parameters:**
- `page` (number)
- `limit` (number)
- `studentNis` (string)
- `classAcademicId` (string)
- `employeeId` (string)
- `paymentDateFrom` (date)
- `paymentDateTo` (date)

#### POST /api/v1/payments
Create payment

**Request Body:**
```json
{
  "tuitionId": "uuid",
  "amount": 500000,
  "notes": "Cash payment"
}
```

**Business Logic:**
1. Validate tuition exists and is UNPAID/PARTIAL
2. Add amount to tuition.paidAmount
3. Update tuition status:
   - If paidAmount >= feeAmount → PAID
   - Else → PARTIAL
4. Record payment with current employee ID

#### GET /api/v1/payments/:id
Get payment details

#### DELETE /api/v1/payments/:id
Delete payment (Admin only, reverses the payment)

---

### 9. Reports (Admin & Cashier Read)

#### GET /api/v1/reports/overdue
Get overdue payments report

**Query Parameters:**
- `classAcademicId` (string, optional)
- `grade` (number, optional)
- `academicYearId` (string, optional)

**Response:**
```json
{
  "success": true,
  "data": {
    "overdue": [
      {
        "student": {
          "nis": "2024001",
          "name": "Ahmad Rizki",
          "parentPhone": "081234567890"
        },
        "class": {
          "className": "XII-IPA-2024/2025",
          "grade": 12,
          "section": "IPA"
        },
        "overdueMonths": [
          {
            "month": "JULY",
            "year": 2024,
            "feeAmount": 500000,
            "paidAmount": 0,
            "dueDate": "2024-07-10",
            "daysOverdue": 45
          }
        ],
        "totalOverdue": 1500000,
        "overdueCount": 3
      }
    ],
    "summary": {
      "totalStudents": 25,
      "totalOverdueAmount": 37500000,
      "totalOverdueRecords": 75
    }
  }
}
```

#### GET /api/v1/reports/overdue/export
Export overdue report to Excel

#### GET /api/v1/reports/class-summary
Class-wise payment summary

**Query Parameters:**
- `academicYearId` (string, optional)

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "class": {
        "id": "uuid",
        "className": "XII-IPA-2024/2025",
        "grade": 12
      },
      "statistics": {
        "totalStudents": 30,
        "totalTuitions": 360,
        "paid": 300,
        "unpaid": 50,
        "partial": 10,
        "totalFees": 180000000,
        "totalPaid": 150000000,
        "totalOutstanding": 30000000
      }
    }
  ]
}
```

#### GET /api/v1/reports/payment-history
Payment history report

**Query Parameters:**
- `startDate` (date)
- `endDate` (date)
- `employeeId` (string, optional)
- `classAcademicId` (string, optional)

---

## Swagger Configuration

### File: `src/lib/swagger.ts`

```typescript
import { createSwaggerSpec } from 'next-swagger-doc';

export const getApiDocs = () => {
  const spec = createSwaggerSpec({
    apiFolder: 'src/app/api/v1',
    definition: {
      openapi: '3.0.0',
      info: {
        title: 'School Tuition Management API',
        version: '1.0.0',
        description: 'API documentation for School Tuition Management System',
      },
      servers: [
        {
          url: 'http://localhost:3000/api/v1',
          description: 'Development server',
        },
      ],
      components: {
        securitySchemes: {
          bearerAuth: {
            type: 'http',
            scheme: 'bearer',
            bearerFormat: 'JWT',
          },
        },
        schemas: {
          Error: {
            type: 'object',
            properties: {
              success: { type: 'boolean', example: false },
              error: {
                type: 'object',
                properties: {
                  message: { type: 'string' },
                  code: { type: 'string' },
                },
              },
            },
          },
        },
      },
      security: [{ bearerAuth: [] }],
    },
  });
  return spec;
};
```

### Swagger UI Route: `src/app/api-docs/page.tsx`

```typescript
'use client';

import SwaggerUI from 'swagger-ui-react';
import 'swagger-ui-react/swagger-ui.css';

export default function ApiDocsPage() {
  return <SwaggerUI url="/api/swagger" />;
}
```

### Swagger JSON Route: `src/app/api/swagger/route.ts`

```typescript
import { NextResponse } from 'next/server';
import { getApiDocs } from '@/lib/swagger';

export async function GET() {
  const spec = getApiDocs();
  return NextResponse.json(spec);
}
```

## Error Response Format

All errors follow this format:

```json
{
  "success": false,
  "error": {
    "message": "Error description",
    "code": "ERROR_CODE",
    "details": {} // Optional additional info
  }
}
```

### Common Error Codes
- `UNAUTHORIZED` (401)
- `FORBIDDEN` (403)
- `NOT_FOUND` (404)
- `VALIDATION_ERROR` (400)
- `DUPLICATE_ENTRY` (409)
- `SERVER_ERROR` (500)

## API Response Wrapper

```typescript
// src/lib/api-response.ts

export function successResponse<T>(data: T, statusCode = 200) {
  return Response.json(
    {
      success: true,
      data,
    },
    { status: statusCode }
  );
}

export function errorResponse(
  message: string,
  code: string,
  statusCode = 400,
  details?: unknown
) {
  return Response.json(
    {
      success: false,
      error: {
        message,
        code,
        ...(details && { details }),
      },
    },
    { status: statusCode }
  );
}
```
# Frontend Structure - Next.js 14 App Router with Mantine UI

## Directory Structure

```
src/
├── app/                          # Next.js 14 App Router
│   ├── (auth)/                   # Auth layout group
│   │   ├── login/
│   │   │   └── page.tsx
│   │   └── layout.tsx
│   ├── (dashboard)/              # Protected dashboard layout
│   │   ├── layout.tsx
│   │   ├── page.tsx              # Dashboard home
│   │   ├── employees/
│   │   │   ├── page.tsx
│   │   │   ├── [id]/
│   │   │   │   └── page.tsx
│   │   │   └── new/
│   │   │       └── page.tsx
│   │   ├── students/
│   │   │   ├── page.tsx
│   │   │   ├── [nis]/
│   │   │   │   └── page.tsx
│   │   │   ├── new/
│   │   │   │   └── page.tsx
│   │   │   └── import/
│   │   │       └── page.tsx
│   │   ├── academic-years/
│   │   │   ├── page.tsx
│   │   │   └── new/
│   │   │       └── page.tsx
│   │   ├── classes/
│   │   │   ├── page.tsx
│   │   │   ├── new/
│   │   │   │   └── page.tsx
│   │   │   └── import/
│   │   │       └── page.tsx
│   │   ├── tuitions/
│   │   │   ├── page.tsx
│   │   │   └── generate/
│   │   │       └── page.tsx
│   │   ├── scholarships/
│   │   │   ├── page.tsx
│   │   │   └── import/
│   │   │       └── page.tsx
│   │   ├── payments/
│   │   │   ├── page.tsx
│   │   │   └── new/
│   │   │       └── page.tsx
│   │   └── reports/
│   │       ├── overdue/
│   │       │   └── page.tsx
│   │       └── class-summary/
│   │           └── page.tsx
│   ├── api/
│   │   └── v1/                   # API routes (see 03-API-ENDPOINTS.md)
│   ├── api-docs/                 # Swagger UI
│   │   └── page.tsx
│   ├── layout.tsx                # Root layout
│   └── providers.tsx             # Global providers
│
├── components/                   # React components
│   ├── ui/                       # Base UI components
│   │   ├── DataTable/
│   │   │   └── DataTable.tsx     # Reusable table with MRT
│   │   ├── PageHeader/
│   │   │   └── PageHeader.tsx
│   │   ├── StatCard/
│   │   │   └── StatCard.tsx
│   │   ├── LoadingOverlay/
│   │   │   └── LoadingOverlay.tsx
│   │   └── ExcelUploader/
│   │       └── ExcelUploader.tsx
│   ├── layouts/
│   │   ├── DashboardLayout.tsx
│   │   ├── Sidebar.tsx
│   │   ├── Header.tsx
│   │   └── AuthLayout.tsx
│   ├── forms/
│   │   ├── EmployeeForm.tsx
│   │   ├── StudentForm.tsx
│   │   ├── AcademicYearForm.tsx
│   │   ├── ClassAcademicForm.tsx
│   │   ├── TuitionGeneratorForm.tsx
│   │   ├── ScholarshipImportForm.tsx
│   │   └── PaymentForm.tsx
│   ├── tables/
│   │   ├── EmployeeTable.tsx
│   │   ├── StudentTable.tsx
│   │   ├── ClassAcademicTable.tsx
│   │   ├── TuitionTable.tsx
│   │   ├── ScholarshipTable.tsx
│   │   └── PaymentTable.tsx
│   └── modals/
│       ├── ConfirmModal.tsx
│       └── ImportModal.tsx
│
├── hooks/                        # Custom React hooks
│   ├── api/                      # API hooks using TanStack Query
│   │   ├── useEmployees.ts
│   │   ├── useStudents.ts
│   │   ├── useAcademicYears.ts
│   │   ├── useClassAcademics.ts
│   │   ├── useTuitions.ts
│   │   ├── useScholarships.ts
│   │   ├── usePayments.ts
│   │   └── useReports.ts
│   ├── useAuth.ts
│   ├── usePermissions.ts
│   └── useExcelExport.ts
│
├── lib/                          # Utilities & configurations
│   ├── api-client.ts             # Axios/Fetch wrapper
│   ├── query-keys.ts             # Query key factory
│   ├── supabase.ts               # Supabase client
│   ├── prisma.ts                 # Prisma client
│   ├── swagger.ts                # Swagger config
│   ├── excel-utils.ts            # Excel import/export
│   ├── validators.ts             # Zod schemas
│   └── utils.ts                  # Helper functions
│
├── store/                        # Zustand stores
│   ├── auth-store.ts             # Auth state
│   ├── ui-store.ts               # UI state (modals, etc)
│   └── filter-store.ts           # Filter state
│
└── types/                        # TypeScript types
    ├── api.types.ts              # API request/response types
    ├── database.types.ts         # Database types
    └── index.ts                  # Barrel exports
```

## Key Components

### 1. Root Layout (`app/layout.tsx`)

```typescript
import { MantineProvider } from '@mantine/core';
import { Notifications } from '@mantine/notifications';
import { ModalsProvider } from '@mantine/modals';
import Providers from './providers';
import '@mantine/core/styles.css';
import '@mantine/notifications/styles.css';
import '@mantine/dates/styles.css';
import 'mantine-react-table/styles.css';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <Providers>
          <MantineProvider>
            <ModalsProvider>
              <Notifications position="top-right" />
              {children}
            </ModalsProvider>
          </MantineProvider>
        </Providers>
      </body>
    </html>
  );
}
```

### 2. Global Providers (`app/providers.tsx`)

```typescript
'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { useState } from 'react';

export default function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000, // 1 minute
            refetchOnWindowFocus: false,
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  );
}
```

### 3. Dashboard Layout (`app/(dashboard)/layout.tsx`)

```typescript
'use client';

import { AppShell } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import Sidebar from '@/components/layouts/Sidebar';
import Header from '@/components/layouts/Header';
import { useAuth } from '@/hooks/useAuth';
import { redirect } from 'next/navigation';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [mobileOpened, { toggle: toggleMobile }] = useDisclosure();
  const [desktopOpened, { toggle: toggleDesktop }] = useDisclosure(true);
  const { user, isLoading } = useAuth();

  if (isLoading) return <div>Loading...</div>;
  if (!user) redirect('/login');

  return (
    <AppShell
      header={{ height: 60 }}
      navbar={{
        width: 250,
        breakpoint: 'sm',
        collapsed: { mobile: !mobileOpened, desktop: !desktopOpened },
      }}
      padding="md"
    >
      <AppShell.Header>
        <Header
          mobileOpened={mobileOpened}
          desktopOpened={desktopOpened}
          toggleMobile={toggleMobile}
          toggleDesktop={toggleDesktop}
        />
      </AppShell.Header>

      <AppShell.Navbar p="md">
        <Sidebar />
      </AppShell.Navbar>

      <AppShell.Main>{children}</AppShell.Main>
    </AppShell>
  );
}
```

### 4. Sidebar Component (`components/layouts/Sidebar.tsx`)

```typescript
'use client';

import { NavLink } from '@mantine/core';
import {
  IconUsers,
  IconSchool,
  IconCalendar,
  IconBuilding,
  IconCash,
  IconGift,
  IconReceipt,
  IconReportAnalytics,
  IconHome,
} from '@tabler/icons-react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';

const adminLinks = [
  { icon: IconHome, label: 'Dashboard', href: '/' },
  { icon: IconUsers, label: 'Employees', href: '/employees' },
  { icon: IconSchool, label: 'Students', href: '/students' },
  { icon: IconCalendar, label: 'Academic Years', href: '/academic-years' },
  { icon: IconBuilding, label: 'Classes', href: '/classes' },
  { icon: IconCash, label: 'Tuitions', href: '/tuitions' },
  { icon: IconGift, label: 'Scholarships', href: '/scholarships' },
  { icon: IconReceipt, label: 'Payments', href: '/payments' },
  { icon: IconReportAnalytics, label: 'Reports', href: '/reports/overdue' },
];

const cashierLinks = [
  { icon: IconHome, label: 'Dashboard', href: '/' },
  { icon: IconSchool, label: 'Students', href: '/students' },
  { icon: IconReceipt, label: 'Payments', href: '/payments' },
  { icon: IconReportAnalytics, label: 'Reports', href: '/reports/overdue' },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { user } = useAuth();

  const links = user?.role === 'ADMIN' ? adminLinks : cashierLinks;

  return (
    <nav>
      {links.map((link) => (
        <NavLink
          key={link.href}
          component={Link}
          href={link.href}
          label={link.label}
          leftSection={<link.icon size={20} />}
          active={pathname === link.href}
        />
      ))}
    </nav>
  );
}
```

### 5. Reusable Data Table (`components/ui/DataTable/DataTable.tsx`)

```typescript
'use client';

import {
  MantineReactTable,
  useMantineReactTable,
  type MRT_ColumnDef,
  type MRT_PaginationState,
  type MRT_ColumnFiltersState,
  type MRT_SortingState,
} from 'mantine-react-table';
import { useState } from 'react';

interface DataTableProps<T extends Record<string, any>> {
  columns: MRT_ColumnDef<T>[];
  data: T[];
  totalRows: number;
  isLoading?: boolean;
  onPaginationChange?: (pagination: MRT_PaginationState) => void;
  onColumnFiltersChange?: (filters: MRT_ColumnFiltersState) => void;
  onSortingChange?: (sorting: MRT_SortingState) => void;
  enableRowActions?: boolean;
  renderRowActions?: (row: T) => React.ReactNode;
  enableTopToolbar?: boolean;
  renderTopToolbarCustomActions?: () => React.ReactNode;
}

export function DataTable<T extends Record<string, any>>({
  columns,
  data,
  totalRows,
  isLoading = false,
  onPaginationChange,
  onColumnFiltersChange,
  onSortingChange,
  enableRowActions = false,
  renderRowActions,
  enableTopToolbar = true,
  renderTopToolbarCustomActions,
}: DataTableProps<T>) {
  const [pagination, setPagination] = useState<MRT_PaginationState>({
    pageIndex: 0,
    pageSize: 10,
  });
  const [columnFilters, setColumnFilters] = useState<MRT_ColumnFiltersState>([]);
  const [sorting, setSorting] = useState<MRT_SortingState>([]);

  const table = useMantineReactTable({
    columns,
    data,
    rowCount: totalRows,
    state: {
      isLoading,
      pagination,
      columnFilters,
      sorting,
      showProgressBars: isLoading,
    },
    enableRowActions,
    renderRowActions: renderRowActions
      ? ({ row }) => renderRowActions(row.original)
      : undefined,
    manualPagination: true,
    manualFiltering: true,
    manualSorting: true,
    onPaginationChange: (updater) => {
      const newPagination =
        typeof updater === 'function' ? updater(pagination) : updater;
      setPagination(newPagination);
      onPaginationChange?.(newPagination);
    },
    onColumnFiltersChange: (updater) => {
      const newFilters =
        typeof updater === 'function' ? updater(columnFilters) : updater;
      setColumnFilters(newFilters);
      onColumnFiltersChange?.(newFilters);
    },
    onSortingChange: (updater) => {
      const newSorting = typeof updater === 'function' ? updater(sorting) : updater;
      setSorting(newSorting);
      onSortingChange?.(newSorting);
    },
    enableTopToolbar,
    renderTopToolbarCustomActions,
  });

  return <MantineReactTable table={table} />;
}
```

### 6. Employee Table Example (`components/tables/EmployeeTable.tsx`)

```typescript
'use client';

import { DataTable } from '@/components/ui/DataTable/DataTable';
import { useEmployees } from '@/hooks/api/useEmployees';
import { ActionIcon, Badge, Group } from '@mantine/core';
import { IconEdit, IconTrash, IconKey } from '@tabler/icons-react';
import { type MRT_ColumnDef } from 'mantine-react-table';
import { Employee } from '@/types';
import { useState } from 'react';

export default function EmployeeTable() {
  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 10 });
  const [filters, setFilters] = useState<any>({});

  const { data, isLoading } = useEmployees({
    page: pagination.pageIndex + 1,
    limit: pagination.pageSize,
    ...filters,
  });

  const columns: MRT_ColumnDef<Employee>[] = [
    {
      accessorKey: 'name',
      header: 'Name',
    },
    {
      accessorKey: 'email',
      header: 'Email',
    },
    {
      accessorKey: 'role',
      header: 'Role',
      Cell: ({ cell }) => (
        <Badge color={cell.getValue() === 'ADMIN' ? 'blue' : 'green'}>
          {cell.getValue() as string}
        </Badge>
      ),
    },
  ];

  return (
    <DataTable
      columns={columns}
      data={data?.employees || []}
      totalRows={data?.pagination.total || 0}
      isLoading={isLoading}
      onPaginationChange={setPagination}
      enableRowActions
      renderRowActions={(row) => (
        <Group gap="xs">
          <ActionIcon variant="subtle" color="blue">
            <IconEdit size={18} />
          </ActionIcon>
          <ActionIcon variant="subtle" color="orange">
            <IconKey size={18} />
          </ActionIcon>
          <ActionIcon variant="subtle" color="red">
            <IconTrash size={18} />
          </ActionIcon>
        </Group>
      )}
    />
  );
}
```

### 7. Student Form with React Hook Form (`components/forms/StudentForm.tsx`)

```typescript
'use client';

import { useForm, zodResolver } from '@mantine/form';
import { TextInput, Textarea, Button, Stack } from '@mantine/core';
import { DatePickerInput } from '@mantine/dates';
import { z } from 'zod';

const studentSchema = z.object({
  nis: z.string().min(1, 'NIS is required'),
  nik: z.string().length(16, 'NIK must be 16 digits'),
  name: z.string().min(1, 'Name is required'),
  address: z.string().min(1, 'Address is required'),
  parentName: z.string().min(1, 'Parent name is required'),
  parentPhone: z.string().min(10, 'Phone must be at least 10 digits'),
  startJoinDate: z.date({ required_error: 'Start date is required' }),
});

type StudentFormValues = z.infer<typeof studentSchema>;

interface StudentFormProps {
  initialData?: Partial<StudentFormValues>;
  onSubmit: (data: StudentFormValues) => void;
  isLoading?: boolean;
}

export default function StudentForm({
  initialData,
  onSubmit,
  isLoading,
}: StudentFormProps) {
  const form = useForm({
    initialValues: {
      nis: initialData?.nis || '',
      nik: initialData?.nik || '',
      name: initialData?.name || '',
      address: initialData?.address || '',
      parentName: initialData?.parentName || '',
      parentPhone: initialData?.parentPhone || '',
      startJoinDate: initialData?.startJoinDate || new Date(),
    },
    validate: zodResolver(studentSchema),
  });

  return (
    <form onSubmit={form.onSubmit(onSubmit)}>
      <Stack gap="md">
        <TextInput
          label="NIS (Student ID)"
          placeholder="2024001"
          required
          {...form.getInputProps('nis')}
        />
        <TextInput
          label="NIK (National ID)"
          placeholder="3578123456789012"
          required
          maxLength={16}
          {...form.getInputProps('nik')}
        />
        <TextInput
          label="Student Name"
          placeholder="Ahmad Rizki"
          required
          {...form.getInputProps('name')}
        />
        <Textarea
          label="Address"
          placeholder="Jl. Merdeka No. 123"
          required
          {...form.getInputProps('address')}
        />
        <TextInput
          label="Parent Name"
          placeholder="Budi Santoso"
          required
          {...form.getInputProps('parentName')}
        />
        <TextInput
          label="Parent Phone"
          placeholder="081234567890"
          required
          {...form.getInputProps('parentPhone')}
        />
        <DatePickerInput
          label="Start Join Date"
          placeholder="Select date"
          required
          {...form.getInputProps('startJoinDate')}
        />
        <Button type="submit" loading={isLoading}>
          {initialData ? 'Update Student' : 'Create Student'}
        </Button>
      </Stack>
    </form>
  );
}
```

## Page Examples

### Students Page (`app/(dashboard)/students/page.tsx`)

```typescript
'use client';

import { Button, Group } from '@mantine/core';
import { IconPlus, IconFileUpload } from '@tabler/icons-react';
import { useRouter } from 'next/navigation';
import StudentTable from '@/components/tables/StudentTable';
import PageHeader from '@/components/ui/PageHeader/PageHeader';
import { usePermissions } from '@/hooks/usePermissions';

export default function StudentsPage() {
  const router = useRouter();
  const { canCreate } = usePermissions();

  return (
    <>
      <PageHeader
        title="Students"
        description="Manage student records"
        actions={
          canCreate && (
            <Group>
              <Button
                leftSection={<IconFileUpload size={18} />}
                variant="light"
                onClick={() => router.push('/students/import')}
              >
                Import Excel
              </Button>
              <Button
                leftSection={<IconPlus size={18} />}
                onClick={() => router.push('/students/new')}
              >
                Add Student
              </Button>
            </Group>
          )
        }
      />
      <StudentTable />
    </>
  );
}
```

### Payment Processing Page (`app/(dashboard)/payments/new/page.tsx`)

```typescript
'use client';

import { useState } from 'react';
import {
  Paper,
  Stack,
  Select,
  NumberInput,
  Textarea,
  Button,
  Text,
  Group,
  Badge,
} from '@mantine/core';
import { useStudents } from '@/hooks/api/useStudents';
import { useTuitions } from '@/hooks/api/useTuitions';
import { useCreatePayment } from '@/hooks/api/usePayments';
import { notifications } from '@mantine/notifications';

export default function NewPaymentPage() {
  const [selectedStudent, setSelectedStudent] = useState<string | null>(null);
  const [selectedTuition, setSelectedTuition] = useState<string | null>(null);
  const [amount, setAmount] = useState<number>(0);
  const [notes, setNotes] = useState('');

  const { data: students } = useStudents({ limit: 1000 });
  const { data: tuitions } = useTuitions({
    studentNis: selectedStudent || undefined,
    status: 'UNPAID',
  });

  const createPayment = useCreatePayment();

  const handleSubmit = () => {
    if (!selectedTuition || !amount) return;

    createPayment.mutate(
      {
        tuitionId: selectedTuition,
        amount,
        notes,
      },
      {
        onSuccess: () => {
          notifications.show({
            title: 'Success',
            message: 'Payment recorded successfully',
            color: 'green',
          });
          // Reset form
          setSelectedStudent(null);
          setSelectedTuition(null);
          setAmount(0);
          setNotes('');
        },
      }
    );
  };

  const selectedTuitionData = tuitions?.tuitions.find(
    (t) => t.id === selectedTuition
  );

  return (
    <Paper p="lg" withBorder>
      <Stack gap="md">
        <Text size="xl" fw={700}>
          Process Payment
        </Text>

        <Select
          label="Select Student"
          placeholder="Choose student"
          data={
            students?.students.map((s) => ({
              value: s.nis,
              label: `${s.nis} - ${s.name}`,
            })) || []
          }
          value={selectedStudent}
          onChange={setSelectedStudent}
          searchable
        />

        {selectedStudent && (
          <Select
            label="Select Tuition"
            placeholder="Choose unpaid tuition"
            data={
              tuitions?.tuitions.map((t) => ({
                value: t.id,
                label: `${t.month} ${t.year} - ${t.classAcademic.className}`,
              })) || []
            }
            value={selectedTuition}
            onChange={setSelectedTuition}
          />
        )}

        {selectedTuitionData && (
          <Paper p="md" withBorder>
            <Stack gap="xs">
              <Group justify="space-between">
                <Text>Class:</Text>
                <Text fw={600}>{selectedTuitionData.classAcademic.className}</Text>
              </Group>
              <Group justify="space-between">
                <Text>Period:</Text>
                <Text fw={600}>
                  {selectedTuitionData.month} {selectedTuitionData.year}
                </Text>
              </Group>
              <Group justify="space-between">
                <Text>Fee Amount:</Text>
                <Text fw={600}>
                  Rp {selectedTuitionData.feeAmount.toLocaleString('id-ID')}
                </Text>
              </Group>
              <Group justify="space-between">
                <Text>Already Paid:</Text>
                <Text fw={600}>
                  Rp {selectedTuitionData.paidAmount.toLocaleString('id-ID')}
                </Text>
              </Group>
              <Group justify="space-between">
                <Text>Outstanding:</Text>
                <Text fw={600} c="red">
                  Rp{' '}
                  {(
                    selectedTuitionData.feeAmount - selectedTuitionData.paidAmount
                  ).toLocaleString('id-ID')}
                </Text>
              </Group>
            </Stack>
          </Paper>
        )}

        <NumberInput
          label="Payment Amount"
          placeholder="Enter amount"
          value={amount}
          onChange={(val) => setAmount(Number(val))}
          prefix="Rp "
          thousandSeparator=","
          disabled={!selectedTuition}
        />

        <Textarea
          label="Notes (Optional)"
          placeholder="Payment notes"
          value={notes}
          onChange={(e) => setNotes(e.currentTarget.value)}
        />

        <Button
          onClick={handleSubmit}
          loading={createPayment.isPending}
          disabled={!selectedTuition || !amount}
        >
          Process Payment
        </Button>
      </Stack>
    </Paper>
  );
}
```

## Styling Configuration

### Mantine Theme (`src/lib/theme.ts`)

```typescript
import { createTheme } from '@mantine/core';

export const theme = createTheme({
  primaryColor: 'blue',
  fontFamily: 'Inter, sans-serif',
  defaultRadius: 'md',
  colors: {
    // Custom colors
  },
});
```

## Role-Based Permissions

### usePermissions Hook (`hooks/usePermissions.ts`)

```typescript
import { useAuth } from './useAuth';

export function usePermissions() {
  const { user } = useAuth();

  const isAdmin = user?.role === 'ADMIN';
  const isCashier = user?.role === 'CASHIER';

  return {
    canCreate: isAdmin,
    canUpdate: isAdmin,
    canDelete: isAdmin,
    canProcessPayment: isAdmin || isCashier,
    canViewReports: isAdmin || isCashier,
    canManageEmployees: isAdmin,
    canGenerateTuition: isAdmin,
    canManageScholarships: isAdmin,
  };
}
```
# TanStack Query - Query Key Factory Pattern

## Query Key Factory

Centralized query key management for type-safe and organized cache invalidation.

### File: `src/lib/query-keys.ts`

```typescript
export const queryKeys = {
  // Auth
  auth: {
    all: ['auth'] as const,
    me: () => [...queryKeys.auth.all, 'me'] as const,
  },

  // Employees
  employees: {
    all: ['employees'] as const,
    lists: () => [...queryKeys.employees.all, 'list'] as const,
    list: (filters: EmployeeFilters) =>
      [...queryKeys.employees.lists(), filters] as const,
    details: () => [...queryKeys.employees.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.employees.details(), id] as const,
  },

  // Students
  students: {
    all: ['students'] as const,
    lists: () => [...queryKeys.students.all, 'list'] as const,
    list: (filters: StudentFilters) =>
      [...queryKeys.students.lists(), filters] as const,
    details: () => [...queryKeys.students.all, 'detail'] as const,
    detail: (nis: string) => [...queryKeys.students.details(), nis] as const,
  },

  // Academic Years
  academicYears: {
    all: ['academic-years'] as const,
    lists: () => [...queryKeys.academicYears.all, 'list'] as const,
    list: (filters: AcademicYearFilters) =>
      [...queryKeys.academicYears.lists(), filters] as const,
    details: () => [...queryKeys.academicYears.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.academicYears.details(), id] as const,
    active: () => [...queryKeys.academicYears.all, 'active'] as const,
  },

  // Class Academics
  classAcademics: {
    all: ['class-academics'] as const,
    lists: () => [...queryKeys.classAcademics.all, 'list'] as const,
    list: (filters: ClassAcademicFilters) =>
      [...queryKeys.classAcademics.lists(), filters] as const,
    details: () => [...queryKeys.classAcademics.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.classAcademics.details(), id] as const,
    byYear: (yearId: string) =>
      [...queryKeys.classAcademics.all, 'by-year', yearId] as const,
  },

  // Tuitions
  tuitions: {
    all: ['tuitions'] as const,
    lists: () => [...queryKeys.tuitions.all, 'list'] as const,
    list: (filters: TuitionFilters) =>
      [...queryKeys.tuitions.lists(), filters] as const,
    details: () => [...queryKeys.tuitions.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.tuitions.details(), id] as const,
    byStudent: (nis: string) =>
      [...queryKeys.tuitions.all, 'by-student', nis] as const,
    byClass: (classId: string) =>
      [...queryKeys.tuitions.all, 'by-class', classId] as const,
    unpaid: () => [...queryKeys.tuitions.all, 'unpaid'] as const,
  },

  // Scholarships
  scholarships: {
    all: ['scholarships'] as const,
    lists: () => [...queryKeys.scholarships.all, 'list'] as const,
    list: (filters: ScholarshipFilters) =>
      [...queryKeys.scholarships.lists(), filters] as const,
    details: () => [...queryKeys.scholarships.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.scholarships.details(), id] as const,
    byStudent: (nis: string) =>
      [...queryKeys.scholarships.all, 'by-student', nis] as const,
  },

  // Payments
  payments: {
    all: ['payments'] as const,
    lists: () => [...queryKeys.payments.all, 'list'] as const,
    list: (filters: PaymentFilters) =>
      [...queryKeys.payments.lists(), filters] as const,
    details: () => [...queryKeys.payments.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.payments.details(), id] as const,
    byTuition: (tuitionId: string) =>
      [...queryKeys.payments.all, 'by-tuition', tuitionId] as const,
  },

  // Reports
  reports: {
    all: ['reports'] as const,
    overdue: (filters: OverdueFilters) =>
      [...queryKeys.reports.all, 'overdue', filters] as const,
    classSummary: (filters: ClassSummaryFilters) =>
      [...queryKeys.reports.all, 'class-summary', filters] as const,
    paymentHistory: (filters: PaymentHistoryFilters) =>
      [...queryKeys.reports.all, 'payment-history', filters] as const,
  },
} as const;

// Type definitions for filters
export interface EmployeeFilters {
  page?: number;
  limit?: number;
  search?: string;
  role?: 'ADMIN' | 'CASHIER';
}

export interface StudentFilters {
  page?: number;
  limit?: number;
  search?: string;
  startJoinDateFrom?: string;
  startJoinDateTo?: string;
}

export interface AcademicYearFilters {
  page?: number;
  limit?: number;
  isActive?: boolean;
}

export interface ClassAcademicFilters {
  page?: number;
  limit?: number;
  academicYearId?: string;
  grade?: number;
  search?: string;
}

export interface TuitionFilters {
  page?: number;
  limit?: number;
  classAcademicId?: string;
  studentNis?: string;
  status?: 'UNPAID' | 'PAID' | 'PARTIAL';
  month?: string;
  year?: number;
  dueDateFrom?: string;
  dueDateTo?: string;
}

export interface ScholarshipFilters {
  page?: number;
  limit?: number;
  classAcademicId?: string;
  studentNis?: string;
  isFullScholarship?: boolean;
}

export interface PaymentFilters {
  page?: number;
  limit?: number;
  studentNis?: string;
  classAcademicId?: string;
  employeeId?: string;
  paymentDateFrom?: string;
  paymentDateTo?: string;
}

export interface OverdueFilters {
  classAcademicId?: string;
  grade?: number;
  academicYearId?: string;
}

export interface ClassSummaryFilters {
  academicYearId?: string;
}

export interface PaymentHistoryFilters {
  startDate?: string;
  endDate?: string;
  employeeId?: string;
  classAcademicId?: string;
}
```

## API Hooks Implementation

### useEmployees Hook (`hooks/api/useEmployees.ts`)

```typescript
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys, type EmployeeFilters } from '@/lib/query-keys';
import { apiClient } from '@/lib/api-client';
import { Employee } from '@/types';

// List employees
export function useEmployees(filters: EmployeeFilters = {}) {
  return useQuery({
    queryKey: queryKeys.employees.list(filters),
    queryFn: async () => {
      const { data } = await apiClient.get('/employees', { params: filters });
      return data.data;
    },
  });
}

// Get single employee
export function useEmployee(id: string) {
  return useQuery({
    queryKey: queryKeys.employees.detail(id),
    queryFn: async () => {
      const { data } = await apiClient.get(`/employees/${id}`);
      return data.data;
    },
    enabled: !!id,
  });
}

// Create employee
export function useCreateEmployee() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (newEmployee: Omit<Employee, 'employeeId'>) => {
      const { data } = await apiClient.post('/employees', newEmployee);
      return data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.employees.lists() });
    },
  });
}

// Update employee
export function useUpdateEmployee() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      updates,
    }: {
      id: string;
      updates: Partial<Employee>;
    }) => {
      const { data } = await apiClient.put(`/employees/${id}`, updates);
      return data.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.employees.lists() });
      queryClient.invalidateQueries({
        queryKey: queryKeys.employees.detail(variables.id),
      });
    },
  });
}

// Delete employee
export function useDeleteEmployee() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      await apiClient.delete(`/employees/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.employees.lists() });
    },
  });
}

// Reset password
export function useResetEmployeePassword() {
  return useMutation({
    mutationFn: async (id: string) => {
      const { data } = await apiClient.post(`/employees/${id}/reset-password`);
      return data.data;
    },
  });
}
```

### useStudents Hook (`hooks/api/useStudents.ts`)

```typescript
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys, type StudentFilters } from '@/lib/query-keys';
import { apiClient } from '@/lib/api-client';
import { Student } from '@/types';

export function useStudents(filters: StudentFilters = {}) {
  return useQuery({
    queryKey: queryKeys.students.list(filters),
    queryFn: async () => {
      const { data } = await apiClient.get('/students', { params: filters });
      return data.data;
    },
  });
}

export function useStudent(nis: string) {
  return useQuery({
    queryKey: queryKeys.students.detail(nis),
    queryFn: async () => {
      const { data } = await apiClient.get(`/students/${nis}`);
      return data.data;
    },
    enabled: !!nis,
  });
}

export function useCreateStudent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (newStudent: Omit<Student, 'createdAt' | 'updatedAt'>) => {
      const { data } = await apiClient.post('/students', newStudent);
      return data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.students.lists() });
    },
  });
}

export function useUpdateStudent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      nis,
      updates,
    }: {
      nis: string;
      updates: Partial<Student>;
    }) => {
      const { data } = await apiClient.put(`/students/${nis}`, updates);
      return data.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.students.lists() });
      queryClient.invalidateQueries({
        queryKey: queryKeys.students.detail(variables.nis),
      });
    },
  });
}

export function useDeleteStudent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (nis: string) => {
      await apiClient.delete(`/students/${nis}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.students.lists() });
    },
  });
}

export function useImportStudents() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append('file', file);
      const { data } = await apiClient.post('/students/import', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      return data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.students.lists() });
    },
  });
}

export function useExportStudents() {
  return useMutation({
    mutationFn: async (filters: StudentFilters) => {
      const { data } = await apiClient.post(
        '/students/export',
        { filters },
        { responseType: 'blob' }
      );
      return data;
    },
  });
}
```

### useTuitions Hook (`hooks/api/useTuitions.ts`)

```typescript
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys, type TuitionFilters } from '@/lib/query-keys';
import { apiClient } from '@/lib/api-client';

export function useTuitions(filters: TuitionFilters = {}) {
  return useQuery({
    queryKey: queryKeys.tuitions.list(filters),
    queryFn: async () => {
      const { data } = await apiClient.get('/tuitions', { params: filters });
      return data.data;
    },
  });
}

export function useGenerateTuitions() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: {
      classAcademicId: string;
      feeAmount: number;
      studentNisList?: string[];
      startMonth?: string;
      startYear?: number;
    }) => {
      const { data } = await apiClient.post('/tuitions/generate', params);
      return data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.tuitions.lists() });
    },
  });
}

export function useGenerateTuitionsBulk() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: {
      classes: Array<{
        classAcademicId: string;
        feeAmount: number;
      }>;
    }) => {
      const { data } = await apiClient.post('/tuitions/generate-bulk', params);
      return data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.tuitions.lists() });
    },
  });
}
```

### usePayments Hook (`hooks/api/usePayments.ts`)

```typescript
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys, type PaymentFilters } from '@/lib/query-keys';
import { apiClient } from '@/lib/api-client';

export function usePayments(filters: PaymentFilters = {}) {
  return useQuery({
    queryKey: queryKeys.payments.list(filters),
    queryFn: async () => {
      const { data } = await apiClient.get('/payments', { params: filters });
      return data.data;
    },
  });
}

export function useCreatePayment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payment: {
      tuitionId: string;
      amount: number;
      notes?: string;
    }) => {
      const { data } = await apiClient.post('/payments', payment);
      return data.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.payments.lists() });
      queryClient.invalidateQueries({ queryKey: queryKeys.tuitions.lists() });
      queryClient.invalidateQueries({
        queryKey: queryKeys.payments.byTuition(variables.tuitionId),
      });
    },
  });
}

export function useDeletePayment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      await apiClient.delete(`/payments/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.payments.lists() });
      queryClient.invalidateQueries({ queryKey: queryKeys.tuitions.lists() });
    },
  });
}
```

### useReports Hook (`hooks/api/useReports.ts`)

```typescript
import { useQuery, useMutation } from '@tanstack/react-query';
import { queryKeys, type OverdueFilters } from '@/lib/query-keys';
import { apiClient } from '@/lib/api-client';

export function useOverdueReport(filters: OverdueFilters = {}) {
  return useQuery({
    queryKey: queryKeys.reports.overdue(filters),
    queryFn: async () => {
      const { data } = await apiClient.get('/reports/overdue', {
        params: filters,
      });
      return data.data;
    },
  });
}

export function useExportOverdueReport() {
  return useMutation({
    mutationFn: async (filters: OverdueFilters) => {
      const { data } = await apiClient.get('/reports/overdue/export', {
        params: filters,
        responseType: 'blob',
      });
      return data;
    },
  });
}

export function useClassSummaryReport(filters: { academicYearId?: string } = {}) {
  return useQuery({
    queryKey: queryKeys.reports.classSummary(filters),
    queryFn: async () => {
      const { data } = await apiClient.get('/reports/class-summary', {
        params: filters,
      });
      return data.data;
    },
  });
}
```

## Cache Invalidation Examples

### After Creating Student
```typescript
// Automatically handled in useCreateStudent
queryClient.invalidateQueries({ queryKey: queryKeys.students.lists() });
```

### After Payment
```typescript
// Invalidate multiple related queries
queryClient.invalidateQueries({ queryKey: queryKeys.payments.lists() });
queryClient.invalidateQueries({ queryKey: queryKeys.tuitions.lists() });
queryClient.invalidateQueries({ queryKey: queryKeys.reports.all });
```

### Manual Invalidation
```typescript
// Invalidate all employees
queryClient.invalidateQueries({ queryKey: queryKeys.employees.all });

// Invalidate specific employee
queryClient.invalidateQueries({ queryKey: queryKeys.employees.detail('uuid') });

// Invalidate all lists but not details
queryClient.invalidateQueries({ queryKey: queryKeys.students.lists() });
```

## Prefetching

```typescript
// Prefetch next page
const prefetchNextPage = async (currentPage: number, filters: StudentFilters) => {
  await queryClient.prefetchQuery({
    queryKey: queryKeys.students.list({ ...filters, page: currentPage + 1 }),
    queryFn: async () => {
      const { data } = await apiClient.get('/students', {
        params: { ...filters, page: currentPage + 1 },
      });
      return data.data;
    },
  });
};
```

## Optimistic Updates

```typescript
export function useUpdateStudent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ nis, updates }: { nis: string; updates: Partial<Student> }) => {
      const { data } = await apiClient.put(`/students/${nis}`, updates);
      return data.data;
    },
    // Optimistic update
    onMutate: async ({ nis, updates }) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.students.detail(nis) });
      
      const previousStudent = queryClient.getQueryData(queryKeys.students.detail(nis));
      
      queryClient.setQueryData(queryKeys.students.detail(nis), (old: any) => ({
        ...old,
        ...updates,
      }));
      
      return { previousStudent };
    },
    // Rollback on error
    onError: (err, variables, context) => {
      queryClient.setQueryData(
        queryKeys.students.detail(variables.nis),
        context?.previousStudent
      );
    },
    // Refetch on success or error
    onSettled: (data, error, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.students.detail(variables.nis) });
    },
  });
}
```
# Excel Templates - Import/Export System

## Overview

The system uses SheetJS (xlsx) for Excel operations with pre-defined templates that include data validation to prevent human error.

## Excel Utility Functions

### File: `src/lib/excel-utils.ts`

```typescript
import * as XLSX from 'xlsx';

export interface ExcelColumn {
  header: string;
  key: string;
  width?: number;
  validation?: {
    type: 'list' | 'date' | 'number' | 'text';
    options?: string[]; // For list validation
    min?: number; // For number validation
    max?: number;
  };
}

export interface ExcelTemplate {
  sheetName: string;
  columns: ExcelColumn[];
  data?: any[];
}

/**
 * Create Excel template with data validation
 */
export function createExcelTemplate(template: ExcelTemplate): XLSX.WorkBook {
  const workbook = XLSX.utils.book_new();
  
  // Create worksheet
  const wsData: any[][] = [];
  
  // Add headers
  const headers = template.columns.map((col) => col.header);
  wsData.push(headers);
  
  // Add sample data if provided
  if (template.data && template.data.length > 0) {
    template.data.forEach((row) => {
      const rowData = template.columns.map((col) => row[col.key] || '');
      wsData.push(rowData);
    });
  } else {
    // Add 100 empty rows for user input
    for (let i = 0; i < 100; i++) {
      wsData.push(template.columns.map(() => ''));
    }
  }
  
  const worksheet = XLSX.utils.aoa_to_sheet(wsData);
  
  // Set column widths
  worksheet['!cols'] = template.columns.map((col) => ({
    wch: col.width || 20,
  }));
  
  // Add data validation (NOTE: SheetJS has limited validation support)
  // For dropdown validation, we'll add a separate sheet with options
  const dropdownColumns = template.columns.filter(
    (col) => col.validation?.type === 'list'
  );
  
  if (dropdownColumns.length > 0) {
    const validationSheet: any = {};
    dropdownColumns.forEach((col, index) => {
      const colLetter = String.fromCharCode(65 + index); // A, B, C, etc.
      col.validation?.options?.forEach((option, rowIndex) => {
        const cellRef = `${colLetter}${rowIndex + 1}`;
        validationSheet[cellRef] = { v: option };
      });
    });
    
    const validationWs = XLSX.utils.json_to_sheet(
      dropdownColumns.reduce((acc, col, index) => {
        col.validation?.options?.forEach((option, i) => {
          if (!acc[i]) acc[i] = {};
          acc[i][col.header] = option;
        });
        return acc;
      }, [] as any[])
    );
    
    XLSX.utils.book_append_sheet(workbook, validationWs, 'Options');
  }
  
  XLSX.utils.book_append_sheet(workbook, worksheet, template.sheetName);
  
  return workbook;
}

/**
 * Download Excel file
 */
export function downloadExcel(workbook: XLSX.WorkBook, filename: string) {
  XLSX.writeFile(workbook, filename);
}

/**
 * Read Excel file
 */
export async function readExcelFile<T = any>(
  file: File
): Promise<{ data: T[]; errors: string[] }> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        const workbook = XLSX.read(data, { type: 'binary' });
        
        // Read first sheet
        const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
        const jsonData = XLSX.utils.sheet_to_json<T>(firstSheet, {
          raw: false, // Convert dates to strings
          defval: '', // Default value for empty cells
        });
        
        // Basic validation
        const errors: string[] = [];
        if (jsonData.length === 0) {
          errors.push('Excel file is empty');
        }
        
        resolve({ data: jsonData, errors });
      } catch (error) {
        reject(error);
      }
    };
    
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsBinaryString(file);
  });
}

/**
 * Export data to Excel
 */
export function exportToExcel<T>(
  data: T[],
  filename: string,
  sheetName: string = 'Sheet1'
) {
  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
  XLSX.writeFile(workbook, filename);
}

/**
 * Validate Excel data against schema
 */
export function validateExcelData<T>(
  data: any[],
  requiredFields: (keyof T)[],
  rowValidation?: (row: any, index: number) => string | null
): { valid: T[]; errors: Array<{ row: number; errors: string[] }> } {
  const valid: T[] = [];
  const errors: Array<{ row: number; errors: string[] }> = [];
  
  data.forEach((row, index) => {
    const rowErrors: string[] = [];
    
    // Check required fields
    requiredFields.forEach((field) => {
      if (!row[field] || row[field] === '') {
        rowErrors.push(`${String(field)} is required`);
      }
    });
    
    // Custom validation
    if (rowValidation) {
      const customError = rowValidation(row, index);
      if (customError) {
        rowErrors.push(customError);
      }
    }
    
    if (rowErrors.length > 0) {
      errors.push({ row: index + 2, errors: rowErrors }); // +2 for header and 0-index
    } else {
      valid.push(row as T);
    }
  });
  
  return { valid, errors };
}
```

## Template Definitions

### Student Import Template

```typescript
// src/lib/excel-templates/student-template.ts

import { createExcelTemplate, ExcelColumn } from '../excel-utils';

export interface StudentExcelRow {
  NIS: string;
  NIK: string;
  'Student Name': string;
  Address: string;
  'Parent Name': string;
  'Parent Phone': string;
  'Start Join Date': string; // Format: YYYY-MM-DD
}

export function createStudentTemplate() {
  const columns: ExcelColumn[] = [
    {
      header: 'NIS',
      key: 'NIS',
      width: 15,
      validation: { type: 'text' },
    },
    {
      header: 'NIK',
      key: 'NIK',
      width: 20,
      validation: { type: 'text' },
    },
    {
      header: 'Student Name',
      key: 'Student Name',
      width: 25,
      validation: { type: 'text' },
    },
    {
      header: 'Address',
      key: 'Address',
      width: 40,
      validation: { type: 'text' },
    },
    {
      header: 'Parent Name',
      key: 'Parent Name',
      width: 25,
      validation: { type: 'text' },
    },
    {
      header: 'Parent Phone',
      key: 'Parent Phone',
      width: 15,
      validation: { type: 'text' },
    },
    {
      header: 'Start Join Date',
      key: 'Start Join Date',
      width: 15,
      validation: { type: 'date' },
    },
  ];
  
  return createExcelTemplate({
    sheetName: 'Students',
    columns,
    data: [
      {
        NIS: '2024001',
        NIK: '3578123456789012',
        'Student Name': 'Ahmad Rizki',
        Address: 'Jl. Merdeka No. 123',
        'Parent Name': 'Budi Santoso',
        'Parent Phone': '081234567890',
        'Start Join Date': '2024-07-01',
      },
    ],
  });
}

export function validateStudentData(data: any[]) {
  return validateExcelData<StudentExcelRow>(
    data,
    ['NIS', 'NIK', 'Student Name', 'Address', 'Parent Name', 'Parent Phone', 'Start Join Date'],
    (row, index) => {
      // Validate NIK length
      if (row.NIK && row.NIK.length !== 16) {
        return 'NIK must be 16 digits';
      }
      
      // Validate date format
      if (row['Start Join Date'] && !/^\d{4}-\d{2}-\d{2}$/.test(row['Start Join Date'])) {
        return 'Start Join Date must be in YYYY-MM-DD format';
      }
      
      // Validate phone
      if (row['Parent Phone'] && row['Parent Phone'].length < 10) {
        return 'Parent Phone must be at least 10 digits';
      }
      
      return null;
    }
  );
}
```

### Class Academic Import Template

```typescript
// src/lib/excel-templates/class-template.ts

export interface ClassExcelRow {
  'Academic Year': string; // Dropdown
  Grade: number; // Dropdown 1-12
  Section: string;
}

export function createClassTemplate(academicYears: string[]) {
  const columns: ExcelColumn[] = [
    {
      header: 'Academic Year',
      key: 'Academic Year',
      width: 20,
      validation: {
        type: 'list',
        options: academicYears, // e.g., ['2024/2025', '2025/2026']
      },
    },
    {
      header: 'Grade',
      key: 'Grade',
      width: 10,
      validation: {
        type: 'list',
        options: ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12'],
      },
    },
    {
      header: 'Section',
      key: 'Section',
      width: 15,
      validation: { type: 'text' },
    },
  ];
  
  return createExcelTemplate({
    sheetName: 'Classes',
    columns,
    data: [
      {
        'Academic Year': academicYears[0] || '2024/2025',
        Grade: 12,
        Section: 'IPA',
      },
      {
        'Academic Year': academicYears[0] || '2024/2025',
        Grade: 12,
        Section: 'IPS',
      },
    ],
  });
}

export function validateClassData(data: any[]) {
  return validateExcelData<ClassExcelRow>(
    data,
    ['Academic Year', 'Grade', 'Section'],
    (row, index) => {
      // Validate grade range
      const grade = parseInt(row.Grade);
      if (isNaN(grade) || grade < 1 || grade > 12) {
        return 'Grade must be between 1 and 12';
      }
      
      return null;
    }
  );
}
```

### Scholarship Import Template

```typescript
// src/lib/excel-templates/scholarship-template.ts

export interface ScholarshipExcelRow {
  'Student NIS': string; // Dropdown
  'Class Academic': string; // Dropdown (format: XII-IPA-2024/2025)
  Nominal: number;
}

export function createScholarshipTemplate(
  students: Array<{ nis: string; name: string }>,
  classes: Array<{ id: string; className: string }>
) {
  const columns: ExcelColumn[] = [
    {
      header: 'Student NIS',
      key: 'Student NIS',
      width: 20,
      validation: {
        type: 'list',
        options: students.map((s) => `${s.nis} - ${s.name}`),
      },
    },
    {
      header: 'Class Academic',
      key: 'Class Academic',
      width: 30,
      validation: {
        type: 'list',
        options: classes.map((c) => c.className),
      },
    },
    {
      header: 'Nominal',
      key: 'Nominal',
      width: 15,
      validation: {
        type: 'number',
        min: 0,
      },
    },
  ];
  
  return createExcelTemplate({
    sheetName: 'Scholarships',
    columns,
    data: [
      {
        'Student NIS': students[0] ? `${students[0].nis} - ${students[0].name}` : '',
        'Class Academic': classes[0]?.className || '',
        Nominal: 500000,
      },
    ],
  });
}

export function validateScholarshipData(
  data: any[],
  students: Array<{ nis: string }>,
  classes: Array<{ className: string }>
) {
  const validNis = students.map((s) => s.nis);
  const validClasses = classes.map((c) => c.className);
  
  return validateExcelData<ScholarshipExcelRow>(
    data,
    ['Student NIS', 'Class Academic', 'Nominal'],
    (row, index) => {
      // Extract NIS from "NIS - Name" format
      const nis = row['Student NIS'].split(' - ')[0];
      if (!validNis.includes(nis)) {
        return 'Invalid Student NIS';
      }
      
      if (!validClasses.includes(row['Class Academic'])) {
        return 'Invalid Class Academic';
      }
      
      const nominal = parseFloat(row.Nominal);
      if (isNaN(nominal) || nominal < 0) {
        return 'Nominal must be a positive number';
      }
      
      return null;
    }
  );
}
```

## Excel Upload Component

### File: `src/components/ui/ExcelUploader/ExcelUploader.tsx`

```typescript
'use client';

import { useState } from 'react';
import { FileInput, Button, Stack, Alert, Progress, Text, Group } from '@mantine/core';
import { IconFileUpload, IconAlertCircle, IconCheck } from '@tabler/icons-react';
import { readExcelFile } from '@/lib/excel-utils';

interface ExcelUploaderProps<T> {
  onUpload: (data: T[]) => Promise<void>;
  validator?: (data: any[]) => {
    valid: T[];
    errors: Array<{ row: number; errors: string[] }>;
  };
  accept?: string;
}

export function ExcelUploader<T>({
  onUpload,
  validator,
  accept = '.xlsx,.xls',
}: ExcelUploaderProps<T>) {
  const [file, setFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [uploadResult, setUploadResult] = useState<{
    success: number;
    errors: Array<{ row: number; errors: string[] }>;
  } | null>(null);

  const handleUpload = async () => {
    if (!file) return;

    setIsProcessing(true);
    setUploadResult(null);

    try {
      const { data, errors: readErrors } = await readExcelFile(file);

      if (readErrors.length > 0) {
        throw new Error(readErrors.join(', '));
      }

      let validData = data;
      let validationErrors: Array<{ row: number; errors: string[] }> = [];

      if (validator) {
        const result = validator(data);
        validData = result.valid;
        validationErrors = result.errors;
      }

      if (validData.length > 0) {
        await onUpload(validData);
      }

      setUploadResult({
        success: validData.length,
        errors: validationErrors,
      });
    } catch (error) {
      console.error('Upload error:', error);
      setUploadResult({
        success: 0,
        errors: [{ row: 0, errors: [(error as Error).message] }],
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Stack gap="md">
      <FileInput
        label="Upload Excel File"
        placeholder="Choose file"
        accept={accept}
        value={file}
        onChange={setFile}
        leftSection={<IconFileUpload size={18} />}
      />

      <Button
        onClick={handleUpload}
        disabled={!file}
        loading={isProcessing}
      >
        Process Import
      </Button>

      {isProcessing && (
        <Progress value={100} animated />
      )}

      {uploadResult && (
        <>
          {uploadResult.success > 0 && (
            <Alert icon={<IconCheck size={18} />} color="green">
              Successfully imported {uploadResult.success} records
            </Alert>
          )}

          {uploadResult.errors.length > 0 && (
            <Alert icon={<IconAlertCircle size={18} />} color="red">
              <Stack gap="xs">
                <Text fw={600}>
                  {uploadResult.errors.length} rows have errors:
                </Text>
                {uploadResult.errors.slice(0, 5).map((error, index) => (
                  <Text key={index} size="sm">
                    Row {error.row}: {error.errors.join(', ')}
                  </Text>
                ))}
                {uploadResult.errors.length > 5 && (
                  <Text size="sm" c="dimmed">
                    ... and {uploadResult.errors.length - 5} more errors
                  </Text>
                )}
              </Stack>
            </Alert>
          )}
        </>
      )}
    </Stack>
  );
}
```

## Usage Examples

### Student Import Page

```typescript
'use client';

import { Button, Paper, Stack, Title } from '@mantine/core';
import { IconDownload } from '@tabler/icons-react';
import { ExcelUploader } from '@/components/ui/ExcelUploader/ExcelUploader';
import { useImportStudents } from '@/hooks/api/useStudents';
import {
  createStudentTemplate,
  validateStudentData,
  type StudentExcelRow,
} from '@/lib/excel-templates/student-template';
import { downloadExcel } from '@/lib/excel-utils';

export default function StudentImportPage() {
  const importMutation = useImportStudents();

  const handleDownloadTemplate = () => {
    const template = createStudentTemplate();
    downloadExcel(template, 'student-import-template.xlsx');
  };

  const handleImport = async (data: StudentExcelRow[]) => {
    // Transform data to match API format
    const students = data.map((row) => ({
      nis: row.NIS,
      nik: row.NIK,
      name: row['Student Name'],
      address: row.Address,
      parentName: row['Parent Name'],
      parentPhone: row['Parent Phone'],
      startJoinDate: new Date(row['Start Join Date']),
    }));

    await importMutation.mutateAsync(students);
  };

  return (
    <Paper p="lg">
      <Stack gap="lg">
        <Title order={2}>Import Students</Title>

        <Button
          leftSection={<IconDownload size={18} />}
          onClick={handleDownloadTemplate}
          variant="light"
        >
          Download Excel Template
        </Button>

        <ExcelUploader
          onUpload={handleImport}
          validator={validateStudentData}
        />
      </Stack>
    </Paper>
  );
}
```

## Excel Export with Filters

```typescript
// Hook for exporting with current filters
export function useExportWithFilters() {
  const exportMutation = useExportStudents();

  const handleExport = async (filters: StudentFilters) => {
    const blob = await exportMutation.mutateAsync(filters);
    
    // Create download link
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `students-${new Date().toISOString().split('T')[0]}.xlsx`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  };

  return { handleExport, isExporting: exportMutation.isPending };
}
```
# Business Logic & Core Calculations

## Tuition Generation Logic

### Overview
Tuition is generated monthly from July to June (academic year cycle). Students who join mid-year only pay from their join month forward.

### File: `src/lib/business-logic/tuition-generator.ts`

```typescript
import { Month } from '@prisma/client';

export interface TuitionGenerationParams {
  classAcademicId: string;
  className: string; // e.g., "XII-IPA-2024/2025"
  feeAmount: number;
  students: Array<{
    nis: string;
    startJoinDate: Date;
  }>;
  academicYear: {
    startDate: Date; // July 1st
    endDate: Date; // June 30th next year
  };
}

export interface GeneratedTuition {
  classAcademicId: string;
  studentNis: string;
  month: Month;
  year: number;
  feeAmount: number;
  dueDate: Date;
  status: 'UNPAID';
}

// Academic calendar order
const MONTH_ORDER: Month[] = [
  'JULY',
  'AUGUST',
  'SEPTEMBER',
  'OCTOBER',
  'NOVEMBER',
  'DECEMBER',
  'JANUARY',
  'FEBRUARY',
  'MARCH',
  'APRIL',
  'MAY',
  'JUNE',
];

const MONTH_TO_NUMBER: Record<Month, number> = {
  JANUARY: 1,
  FEBRUARY: 2,
  MARCH: 3,
  APRIL: 4,
  MAY: 5,
  JUNE: 6,
  JULY: 7,
  AUGUST: 8,
  SEPTEMBER: 9,
  OCTOBER: 10,
  NOVEMBER: 11,
  DECEMBER: 12,
};

/**
 * Generate tuitions for students based on their join date
 */
export function generateTuitions(
  params: TuitionGenerationParams
): GeneratedTuition[] {
  const tuitions: GeneratedTuition[] = [];
  const { classAcademicId, feeAmount, students, academicYear } = params;

  students.forEach((student) => {
    const studentTuitions = generateTuitionsForStudent({
      classAcademicId,
      feeAmount,
      studentNis: student.nis,
      startJoinDate: student.startJoinDate,
      academicYear,
    });

    tuitions.push(...studentTuitions);
  });

  return tuitions;
}

/**
 * Generate tuitions for a single student
 */
function generateTuitionsForStudent(params: {
  classAcademicId: string;
  feeAmount: number;
  studentNis: string;
  startJoinDate: Date;
  academicYear: {
    startDate: Date;
    endDate: Date;
  };
}): GeneratedTuition[] {
  const { classAcademicId, feeAmount, studentNis, startJoinDate, academicYear } =
    params;

  const tuitions: GeneratedTuition[] = [];

  // Determine which months to generate
  const monthsToGenerate = getMonthsToGenerate(
    startJoinDate,
    academicYear.startDate,
    academicYear.endDate
  );

  monthsToGenerate.forEach(({ month, year }) => {
    tuitions.push({
      classAcademicId,
      studentNis,
      month,
      year,
      feeAmount,
      dueDate: getDueDate(month, year),
      status: 'UNPAID',
    });
  });

  return tuitions;
}

/**
 * Determine which months a student needs to pay for
 * 
 * Example 1:
 * - Academic year: July 2024 - June 2025
 * - Student joins: July 2024
 * - Result: All months (July 2024 - June 2025)
 * 
 * Example 2:
 * - Academic year: July 2024 - June 2025
 * - Student joins: January 2025
 * - Result: January 2025 - June 2025 only
 * 
 * Example 3:
 * - Academic year: July 2025 - June 2026
 * - Student joins: January 2026
 * - Result: January 2026 - June 2026
 * - Skipped: July 2025 - December 2025
 */
function getMonthsToGenerate(
  startJoinDate: Date,
  academicStart: Date,
  academicEnd: Date
): Array<{ month: Month; year: number }> {
  const months: Array<{ month: Month; year: number }> = [];

  // If student joined before academic year starts, include all months
  if (startJoinDate <= academicStart) {
    return generateAllAcademicMonths(academicStart, academicEnd);
  }

  // If student joined after academic year ends, no tuitions
  if (startJoinDate > academicEnd) {
    return [];
  }

  // Student joined mid-year - generate from join month to end of academic year
  const joinMonth = startJoinDate.getMonth() + 1; // 1-12
  const joinYear = startJoinDate.getFullYear();

  // Find the position in academic calendar
  let currentDate = new Date(joinYear, joinMonth - 1, 1);
  const endDate = academicEnd;

  while (currentDate <= endDate) {
    const monthNumber = currentDate.getMonth() + 1;
    const month = getMonthFromNumber(monthNumber);
    const year = currentDate.getFullYear();

    months.push({ month, year });

    // Move to next month
    currentDate.setMonth(currentDate.getMonth() + 1);
  }

  return months;
}

/**
 * Generate all months in an academic year (July - June)
 */
function generateAllAcademicMonths(
  academicStart: Date,
  academicEnd: Date
): Array<{ month: Month; year: number }> {
  const months: Array<{ month: Month; year: number }> = [];
  let currentDate = new Date(academicStart);

  while (currentDate <= academicEnd) {
    const monthNumber = currentDate.getMonth() + 1;
    const month = getMonthFromNumber(monthNumber);
    const year = currentDate.getFullYear();

    months.push({ month, year });

    // Move to next month
    currentDate.setMonth(currentDate.getMonth() + 1);
  }

  return months;
}

/**
 * Convert month number (1-12) to Month enum
 */
function getMonthFromNumber(monthNumber: number): Month {
  const monthMap: Record<number, Month> = {
    1: 'JANUARY',
    2: 'FEBRUARY',
    3: 'MARCH',
    4: 'APRIL',
    5: 'MAY',
    6: 'JUNE',
    7: 'JULY',
    8: 'AUGUST',
    9: 'SEPTEMBER',
    10: 'OCTOBER',
    11: 'NOVEMBER',
    12: 'DECEMBER',
  };

  return monthMap[monthNumber];
}

/**
 * Get due date for tuition (10th of each month)
 */
function getDueDate(month: Month, year: number): Date {
  const monthNumber = MONTH_TO_NUMBER[month];
  return new Date(year, monthNumber - 1, 10); // 10th of the month
}

/**
 * Calculate total tuition for a student in an academic year
 */
export function calculateTotalTuition(
  feeAmount: number,
  startJoinDate: Date,
  academicYear: { startDate: Date; endDate: Date }
): { total: number; months: number } {
  const months = getMonthsToGenerate(
    startJoinDate,
    academicYear.startDate,
    academicYear.endDate
  );

  return {
    total: feeAmount * months.length,
    months: months.length,
  };
}
```

## Class Name Pattern Generator

```typescript
// src/lib/business-logic/class-name-generator.ts

/**
 * Generate class name pattern: GRADE-SECTION-YEAR
 * Examples:
 * - Grade 1, Section A, Year 2024/2025 → I-A-2024/2025
 * - Grade 12, Section IPA, Year 2024/2025 → XII-IPA-2024/2025
 */
export function generateClassName(
  grade: number,
  section: string,
  academicYear: string
): string {
  const romanGrade = convertToRoman(grade);
  return `${romanGrade}-${section}-${academicYear}`;
}

/**
 * Convert number to Roman numerals (1-12)
 */
function convertToRoman(num: number): string {
  const romanMap: Record<number, string> = {
    1: 'I',
    2: 'II',
    3: 'III',
    4: 'IV',
    5: 'V',
    6: 'VI',
    7: 'VII',
    8: 'VIII',
    9: 'IX',
    10: 'X',
    11: 'XI',
    12: 'XII',
  };

  return romanMap[num] || String(num);
}

/**
 * Parse class name back to components
 */
export function parseClassName(className: string): {
  grade: number;
  section: string;
  academicYear: string;
} | null {
  // Pattern: ROMAN-SECTION-YYYY/YYYY
  const match = className.match(/^([IVX]+)-(.+)-(\d{4}\/\d{4})$/);

  if (!match) return null;

  const [, romanGrade, section, academicYear] = match;

  return {
    grade: convertFromRoman(romanGrade),
    section,
    academicYear,
  };
}

/**
 * Convert Roman numerals back to numbers
 */
function convertFromRoman(roman: string): number {
  const romanToNum: Record<string, number> = {
    I: 1,
    II: 2,
    III: 3,
    IV: 4,
    V: 5,
    VI: 6,
    VII: 7,
    VIII: 8,
    IX: 9,
    X: 10,
    XI: 11,
    XII: 12,
  };

  return romanToNum[roman] || 0;
}
```

## Scholarship Auto-Payment Logic

```typescript
// src/lib/business-logic/scholarship-processor.ts

import { Prisma } from '@prisma/client';

export interface ScholarshipApplicationParams {
  studentNis: string;
  classAcademicId: string;
  nominal: number;
  monthlyFee: number;
}

export interface ScholarshipApplicationResult {
  isFullScholarship: boolean;
  tuitionsAffected: number;
  autoPayments: Array<{
    tuitionId: string;
    amount: number;
  }>;
}

/**
 * Apply scholarship and auto-pay tuitions if full scholarship
 */
export async function applyScholarship(
  params: ScholarshipApplicationParams,
  prisma: any // PrismaClient
): Promise<ScholarshipApplicationResult> {
  const { studentNis, classAcademicId, nominal, monthlyFee } = params;

  // Determine if full scholarship
  const isFullScholarship = nominal >= monthlyFee;

  const result: ScholarshipApplicationResult = {
    isFullScholarship,
    tuitionsAffected: 0,
    autoPayments: [],
  };

  if (isFullScholarship) {
    // Find all unpaid tuitions for this student in this class
    const unpaidTuitions = await prisma.tuition.findMany({
      where: {
        studentNis,
        classAcademicId,
        status: 'UNPAID',
      },
    });

    // Create auto-payments for all unpaid tuitions
    for (const tuition of unpaidTuitions) {
      // Update tuition to PAID
      await prisma.tuition.update({
        where: { id: tuition.id },
        data: {
          status: 'PAID',
          paidAmount: tuition.feeAmount,
        },
      });

      // Create system payment record
      await prisma.payment.create({
        data: {
          tuitionId: tuition.id,
          employeeId: 'SYSTEM', // Or use admin user ID
          amount: tuition.feeAmount,
          notes: `Auto-paid via full scholarship (${nominal})`,
        },
      });

      result.autoPayments.push({
        tuitionId: tuition.id,
        amount: tuition.feeAmount.toNumber(),
      });
    }

    result.tuitionsAffected = unpaidTuitions.length;
  }

  return result;
}

/**
 * Calculate scholarship coverage percentage
 */
export function calculateScholarshipCoverage(
  scholarshipAmount: number,
  monthlyFee: number
): {
  percentage: number;
  isFullScholarship: boolean;
  remainingAmount: number;
} {
  const percentage = Math.min((scholarshipAmount / monthlyFee) * 100, 100);
  const isFullScholarship = percentage >= 100;
  const remainingAmount = Math.max(monthlyFee - scholarshipAmount, 0);

  return {
    percentage,
    isFullScholarship,
    remainingAmount,
  };
}
```

## Payment Processing Logic

```typescript
// src/lib/business-logic/payment-processor.ts

export interface PaymentParams {
  tuitionId: string;
  amount: number;
  employeeId: string;
  notes?: string;
}

export interface PaymentResult {
  paymentId: string;
  newStatus: 'PAID' | 'PARTIAL' | 'UNPAID';
  remainingAmount: number;
}

/**
 * Process payment and update tuition status
 */
export async function processPayment(
  params: PaymentParams,
  prisma: any
): Promise<PaymentResult> {
  const { tuitionId, amount, employeeId, notes } = params;

  // Get tuition
  const tuition = await prisma.tuition.findUnique({
    where: { id: tuitionId },
  });

  if (!tuition) {
    throw new Error('Tuition not found');
  }

  // Calculate new paid amount
  const newPaidAmount = tuition.paidAmount.toNumber() + amount;
  const feeAmount = tuition.feeAmount.toNumber();

  // Determine new status
  let newStatus: 'PAID' | 'PARTIAL' | 'UNPAID';
  if (newPaidAmount >= feeAmount) {
    newStatus = 'PAID';
  } else if (newPaidAmount > 0) {
    newStatus = 'PARTIAL';
  } else {
    newStatus = 'UNPAID';
  }

  // Create payment record
  const payment = await prisma.payment.create({
    data: {
      tuitionId,
      employeeId,
      amount,
      notes: notes || '',
    },
  });

  // Update tuition
  await prisma.tuition.update({
    where: { id: tuitionId },
    data: {
      paidAmount: newPaidAmount,
      status: newStatus,
    },
  });

  return {
    paymentId: payment.id,
    newStatus,
    remainingAmount: Math.max(feeAmount - newPaidAmount, 0),
  };
}

/**
 * Reverse/delete payment
 */
export async function reversePayment(
  paymentId: string,
  prisma: any
): Promise<void> {
  // Get payment
  const payment = await prisma.payment.findUnique({
    where: { id: paymentId },
    include: { tuition: true },
  });

  if (!payment) {
    throw new Error('Payment not found');
  }

  const tuition = payment.tuition;
  const newPaidAmount = tuition.paidAmount.toNumber() - payment.amount.toNumber();

  // Determine new status
  let newStatus: 'PAID' | 'PARTIAL' | 'UNPAID';
  if (newPaidAmount >= tuition.feeAmount.toNumber()) {
    newStatus = 'PAID';
  } else if (newPaidAmount > 0) {
    newStatus = 'PARTIAL';
  } else {
    newStatus = 'UNPAID';
  }

  // Update tuition
  await prisma.tuition.update({
    where: { id: tuition.id },
    data: {
      paidAmount: newPaidAmount,
      status: newStatus,
    },
  });

  // Delete payment
  await prisma.payment.delete({
    where: { id: paymentId },
  });
}
```

## Overdue Calculation

```typescript
// src/lib/business-logic/overdue-calculator.ts

export interface OverdueItem {
  tuitionId: string;
  studentNis: string;
  studentName: string;
  className: string;
  month: string;
  year: number;
  feeAmount: number;
  paidAmount: number;
  outstandingAmount: number;
  dueDate: Date;
  daysOverdue: number;
}

/**
 * Calculate days overdue
 */
export function calculateDaysOverdue(dueDate: Date): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0); // Start of today

  const due = new Date(dueDate);
  due.setHours(0, 0, 0, 0);

  if (today <= due) return 0;

  const diffTime = today.getTime() - due.getTime();
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

  return diffDays;
}

/**
 * Get overdue tuitions
 */
export async function getOverdueTuitions(
  filters: {
    classAcademicId?: string;
    grade?: number;
    academicYearId?: string;
  },
  prisma: any
): Promise<OverdueItem[]> {
  const today = new Date();

  const where: any = {
    status: { in: ['UNPAID', 'PARTIAL'] },
    dueDate: { lt: today },
  };

  if (filters.classAcademicId) {
    where.classAcademicId = filters.classAcademicId;
  }

  if (filters.grade || filters.academicYearId) {
    where.classAcademic = {};
    if (filters.grade) {
      where.classAcademic.grade = filters.grade;
    }
    if (filters.academicYearId) {
      where.classAcademic.academicYearId = filters.academicYearId;
    }
  }

  const tuitions = await prisma.tuition.findMany({
    where,
    include: {
      student: true,
      classAcademic: true,
    },
    orderBy: [
      { dueDate: 'asc' },
      { student: { name: 'asc' } },
    ],
  });

  return tuitions.map((t: any) => ({
    tuitionId: t.id,
    studentNis: t.studentNis,
    studentName: t.student.name,
    className: t.classAcademic.className,
    month: t.month,
    year: t.year,
    feeAmount: t.feeAmount.toNumber(),
    paidAmount: t.paidAmount.toNumber(),
    outstandingAmount: t.feeAmount.toNumber() - t.paidAmount.toNumber(),
    dueDate: t.dueDate,
    daysOverdue: calculateDaysOverdue(t.dueDate),
  }));
}
```

## Academic Year Date Helpers

```typescript
// src/lib/business-logic/academic-year-helpers.ts

/**
 * Generate academic year dates (July 1 - June 30)
 */
export function generateAcademicYearDates(year: string): {
  startDate: Date;
  endDate: Date;
} {
  // Parse "2024/2025"
  const [startYearStr, endYearStr] = year.split('/');
  const startYear = parseInt(startYearStr);
  const endYear = parseInt(endYearStr);

  return {
    startDate: new Date(startYear, 6, 1), // July 1, startYear
    endDate: new Date(endYear, 5, 30), // June 30, endYear
  };
}

/**
 * Get current academic year
 */
export function getCurrentAcademicYear(): string {
  const today = new Date();
  const month = today.getMonth() + 1; // 1-12
  const year = today.getFullYear();

  // If before July, we're in previous academic year
  if (month < 7) {
    return `${year - 1}/${year}`;
  } else {
    return `${year}/${year + 1}`;
  }
}

/**
 * Validate academic year format
 */
export function isValidAcademicYear(year: string): boolean {
  const match = year.match(/^(\d{4})\/(\d{4})$/);
  if (!match) return false;

  const [, startYearStr, endYearStr] = match;
  const startYear = parseInt(startYearStr);
  const endYear = parseInt(endYearStr);

  // End year should be start year + 1
  return endYear === startYear + 1;
}
```

## Testing Examples

```typescript
// Example test cases for tuition generation

describe('Tuition Generation', () => {
  test('Student joining at start of academic year', () => {
    const result = generateTuitions({
      classAcademicId: 'class-1',
      className: 'XII-IPA-2024/2025',
      feeAmount: 500000,
      students: [
        {
          nis: '2024001',
          startJoinDate: new Date('2024-07-01'),
        },
      ],
      academicYear: {
        startDate: new Date('2024-07-01'),
        endDate: new Date('2025-06-30'),
      },
    });

    expect(result).toHaveLength(12); // All 12 months
  });

  test('Student joining mid-year (January)', () => {
    const result = generateTuitions({
      classAcademicId: 'class-1',
      className: 'XII-IPA-2024/2025',
      feeAmount: 500000,
      students: [
        {
          nis: '2024002',
          startJoinDate: new Date('2025-01-15'),
        },
      ],
      academicYear: {
        startDate: new Date('2024-07-01'),
        endDate: new Date('2025-06-30'),
      },
    });

    // Should only generate Jan-Jun 2025 (6 months)
    expect(result).toHaveLength(6);
    expect(result[0].month).toBe('JANUARY');
    expect(result[5].month).toBe('JUNE');
  });
});
```
# Deployment & Configuration Guide

## Environment Setup

### Prerequisites
- Node.js 18+ or 20+
- npm or yarn or pnpm
- Supabase account
- Git

## Project Initialization

### 1. Create Next.js Project

```bash
npx create-next-app@latest school-tuition-system --typescript --tailwind --app --src-dir
cd school-tuition-system
```

### 2. Install Dependencies

```bash
# Core dependencies
npm install @mantine/core @mantine/hooks @mantine/form @mantine/notifications @mantine/modals @mantine/dates
npm install @tabler/icons-react
npm install @tanstack/react-query @tanstack/react-query-devtools
npm install @prisma/client
npm install mantine-react-table
npm install xlsx
npm install zustand
npm install bcryptjs
npm install zod
npm install dayjs

# Dev dependencies
npm install -D prisma
npm install -D @types/bcryptjs
npm install -D next-swagger-doc swagger-ui-react
npm install -D @types/node

# Supabase
npm install @supabase/supabase-js @supabase/auth-helpers-nextjs
```

## Configuration Files

### package.json Scripts

```json
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "prisma:generate": "prisma generate",
    "prisma:push": "prisma db push",
    "prisma:migrate": "prisma migrate dev",
    "prisma:studio": "prisma studio",
    "prisma:seed": "ts-node --compiler-options {\"module\":\"CommonJS\"} prisma/seed.ts"
  }
}
```

### tsconfig.json

```json
{
  "compilerOptions": {
    "target": "ES2017",
    "lib": ["dom", "dom.iterable", "esnext"],
    "allowJs": true,
    "skipLibCheck": true,
    "strict": true,
    "forceConsistentCasingInFileNames": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "plugins": [
      {
        "name": "next"
      }
    ],
    "paths": {
      "@/*": ["./src/*"]
    }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}
```

### .env.local Template

```env
# Database
DATABASE_URL="postgresql://postgres:[PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres?pgbouncer=true"
DIRECT_URL="postgresql://postgres:[PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres"

# Supabase
NEXT_PUBLIC_SUPABASE_URL="https://[PROJECT-REF].supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="[YOUR-ANON-KEY]"
SUPABASE_SERVICE_ROLE_KEY="[YOUR-SERVICE-ROLE-KEY]"

# App
NEXT_PUBLIC_APP_URL="http://localhost:3000"
NODE_ENV="development"

# NextAuth (if used)
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="[GENERATE-WITH: openssl rand -base64 32]"
```

### .gitignore

```gitignore
# Dependencies
/node_modules
/.pnp
.pnp.js

# Testing
/coverage

# Next.js
/.next/
/out/

# Production
/build

# Misc
.DS_Store
*.pem

# Debug
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# Local env files
.env*.local
.env

# Vercel
.vercel

# Typescript
*.tsbuildinfo
next-env.d.ts

# Prisma
/prisma/migrations
```

## Supabase Setup

### 1. Create Supabase Project
1. Go to https://supabase.com
2. Create new project
3. Save database password
4. Wait for project setup (2-3 minutes)

### 2. Get Connection Strings
```sql
-- In Supabase SQL Editor, get connection info
-- Settings → Database → Connection String
```

### 3. Setup Prisma

```bash
# Initialize Prisma
npx prisma init

# Copy schema from docs/02-DATABASE-SCHEMA.md to prisma/schema.prisma

# Generate Prisma Client
npx prisma generate

# Push schema to Supabase
npx prisma db push

# Open Prisma Studio
npx prisma studio
```

### 4. Seed Database

Create `prisma/seed.ts`:

```typescript
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

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

  console.log('✅ Created admin:', admin.email);

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

  console.log('✅ Created cashier:', cashier.email);

  // Create current academic year
  const currentYear = '2024/2025';
  const academicYear = await prisma.academicYear.upsert({
    where: { year: currentYear },
    update: {},
    create: {
      year: currentYear,
      startDate: new Date('2024-07-01'),
      endDate: new Date('2025-06-30'),
      isActive: true,
    },
  });

  console.log('✅ Created academic year:', academicYear.year);

  console.log('🎉 Seeding complete!');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
```

Run seed:
```bash
npm run prisma:seed
```

## Mantine Configuration

### postcss.config.js

```javascript
module.exports = {
  plugins: {
    'postcss-preset-mantine': {},
    'postcss-simple-vars': {
      variables: {
        'mantine-breakpoint-xs': '36em',
        'mantine-breakpoint-sm': '48em',
        'mantine-breakpoint-md': '62em',
        'mantine-breakpoint-lg': '75em',
        'mantine-breakpoint-xl': '88em',
      },
    },
  },
};
```

### src/app/layout.tsx

```typescript
import '@mantine/core/styles.css';
import '@mantine/notifications/styles.css';
import '@mantine/dates/styles.css';
import 'mantine-react-table/styles.css';

import { MantineProvider, ColorSchemeScript } from '@mantine/core';
import { Notifications } from '@mantine/notifications';
import { ModalsProvider } from '@mantine/modals';
import Providers from './providers';

export const metadata = {
  title: 'School Tuition Management System',
  description: 'Manage school tuitions, payments, and scholarships',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <ColorSchemeScript />
      </head>
      <body>
        <Providers>
          <MantineProvider defaultColorScheme="light">
            <ModalsProvider>
              <Notifications position="top-right" />
              {children}
            </ModalsProvider>
          </MantineProvider>
        </Providers>
      </body>
    </html>
  );
}
```

## Development Workflow

### 1. Start Development Server

```bash
npm run dev
```

Access at: http://localhost:3000

### 2. View Prisma Studio

```bash
npm run prisma:studio
```

Access at: http://localhost:5555

### 3. API Documentation

Access Swagger UI at: http://localhost:3000/api-docs

## Production Deployment

### Vercel Deployment

1. **Push to GitHub**
```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin [YOUR-REPO-URL]
git push -u origin main
```

2. **Deploy to Vercel**
- Go to https://vercel.com
- Import GitHub repository
- Add environment variables from .env.local
- Deploy

3. **Update Environment Variables**
```env
NEXT_PUBLIC_APP_URL="https://your-app.vercel.app"
```

### Database Migration for Production

```bash
# Create migration
npx prisma migrate dev --name init

# Deploy migration
npx prisma migrate deploy
```

## Docker Configuration (Optional)

### Dockerfile

```dockerfile
FROM node:20-alpine AS base

# Dependencies
FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

COPY package*.json ./
RUN npm ci

# Builder
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

RUN npx prisma generate
RUN npm run build

# Runner
FROM base AS runner
WORKDIR /app

ENV NODE_ENV production

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

ENV PORT 3000
ENV HOSTNAME "0.0.0.0"

CMD ["node", "server.js"]
```

### docker-compose.yml

```yaml
version: '3.8'

services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      - DATABASE_URL=${DATABASE_URL}
      - NEXT_PUBLIC_SUPABASE_URL=${NEXT_PUBLIC_SUPABASE_URL}
      - NEXT_PUBLIC_SUPABASE_ANON_KEY=${NEXT_PUBLIC_SUPABASE_ANON_KEY}
    depends_on:
      - db

  db:
    image: postgres:15-alpine
    environment:
      - POSTGRES_USER=postgres
      - POSTGRES_PASSWORD=postgres
      - POSTGRES_DB=school_tuition
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data

volumes:
  postgres_data:
```

## Performance Optimization

### Next.js Config

```javascript
// next.config.js
/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  experimental: {
    optimizePackageImports: ['@mantine/core', '@mantine/hooks'],
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.supabase.co',
      },
    ],
  },
};

module.exports = nextConfig;
```

## Monitoring & Logging

### Recommended Tools
- **Error Tracking**: Sentry
- **Analytics**: Vercel Analytics
- **Logging**: Axiom or Logtail
- **Uptime Monitoring**: Better Uptime

## Security Checklist

- [ ] Environment variables secured
- [ ] API routes protected with auth middleware
- [ ] Prisma queries parameterized (prevents SQL injection)
- [ ] Input validation on all forms
- [ ] Rate limiting on API routes
- [ ] CORS configured properly
- [ ] HTTPS enabled in production
- [ ] Database backups scheduled
- [ ] Row-Level Security (RLS) enabled in Supabase

## Backup Strategy

### Database Backups
```bash
# Manual backup
pg_dump $DATABASE_URL > backup_$(date +%Y%m%d).sql

# Restore
psql $DATABASE_URL < backup_20240101.sql
```

### Supabase Auto-Backups
- Automatic daily backups (Pro plan)
- Point-in-time recovery
- Backup retention: 30 days

## Default Credentials

After seeding database:

**Admin Account:**
- Email: `admin@school.com`
- Password: `123456`

**Cashier Account:**
- Email: `cashier@school.com`
- Password: `123456`

⚠️ **IMPORTANT**: Change default passwords in production!

## Troubleshooting

### Common Issues

1. **Prisma Client not found**
```bash
npx prisma generate
```

2. **Database connection error**
- Check DATABASE_URL in .env.local
- Verify Supabase project is running
- Check IP whitelist in Supabase

3. **Excel import not working**
- Verify file format (.xlsx or .xls)
- Check column headers match template
- Review console for validation errors

4. **Authentication issues**
- Clear browser cache
- Verify Supabase keys
- Check token expiration

## Support & Resources

- **Next.js Docs**: https://nextjs.org/docs
- **Mantine UI**: https://mantine.dev
- **Prisma**: https://www.prisma.io/docs
- **Supabase**: https://supabase.com/docs
- **TanStack Query**: https://tanstack.com/query/latest

## Maintenance Tasks

### Weekly
- Review error logs
- Check database performance
- Monitor API response times

### Monthly
- Update dependencies: `npm update`
- Database cleanup (old records)
- Security audit

### Quarterly
- Major dependency updates
- Performance review
- User feedback review
