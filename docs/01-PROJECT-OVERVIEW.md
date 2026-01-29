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
