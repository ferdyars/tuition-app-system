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
