# Quick Reference Cheat Sheet

## 🚀 Fastest Start (3 steps)

```bash
# 1. Create project
npx create-next-app@latest school-tuition-system --typescript --tailwind --app --src-dir
cd school-tuition-system

# 2. Install dependencies (copy from 08-DEPLOYMENT.md)
npm install @mantine/core @mantine/hooks @mantine/form @mantine/notifications ...

# 3. Follow 00-EXECUTION-GUIDE.md Phase 1
```

## 📁 File Locations

| What | Where |
|------|-------|
| Database schema | `prisma/schema.prisma` (from doc 02) |
| API routes | `src/app/api/v1/` (from doc 03) |
| Components | `src/components/` (from doc 04) |
| Hooks | `src/hooks/api/` (from doc 05) |
| Business logic | `src/lib/business-logic/` (from doc 07) |

## 🔑 Key Commands

```bash
# Database
npx prisma generate          # Generate Prisma Client
npx prisma db push          # Push schema to database
npx prisma studio           # Open database GUI
npm run prisma:seed         # Seed initial data

# Development
npm run dev                 # Start dev server (localhost:3000)
npm run build              # Build for production
npm run start              # Start production server

# Prisma
npx prisma migrate dev     # Create migration
npx prisma migrate deploy  # Deploy migration
```

## 📊 Database Tables (Quick Reference)

```
employees       → Staff (admin/cashier)
students        → Student records
academic_years  → School years (2024/2025)
class_academics → Classes (XII-IPA-2024/2025)
tuitions        → Monthly fees (UNPAID/PAID/PARTIAL)
scholarships    → Student scholarships
payments        → Payment transactions
```

## 🔐 Default Login

```
Admin:
- Email: admin@school.com
- Password: 123456

Cashier:
- Email: cashier@school.com
- Password: 123456
```

## 🎯 Common Tasks

### Create a new API endpoint
1. Check `03-API-ENDPOINTS.md` for structure
2. Create file: `src/app/api/v1/[resource]/route.ts`
3. Add to query keys: `src/lib/query-keys.ts`
4. Create hook: `src/hooks/api/use[Resource].ts`

### Add Excel import
1. Check `06-EXCEL-TEMPLATES.md`
2. Create template: `src/lib/excel-templates/[name]-template.ts`
3. Add validator function
4. Create import API route
5. Use ExcelUploader component

### Add new page
1. Check `04-FRONTEND-STRUCTURE.md`
2. Create: `src/app/(dashboard)/[page]/page.tsx`
3. Add to sidebar: `src/components/layouts/Sidebar.tsx`
4. Check permissions with `usePermissions()`

## 🧮 Key Business Logic

### Tuition Generation
```typescript
// Student joins mid-year → skip previous months
// Academic year: July 2024 - June 2025
// Student joins: Jan 2025
// Result: Generate Jan-June only (6 months)
```

### Class Name Pattern
```typescript
// Format: GRADE-SECTION-YEAR
// Grade 1: I, Grade 12: XII
"XII-IPA-2024/2025"  // Grade 12, Science
"I-A-2024/2025"      // Grade 1, Section A
```

### Full Scholarship
```typescript
// If scholarship >= monthly fee:
// → Auto-mark all tuitions as PAID
// → Student never visits cashier
```

## 📋 Phase Checklist

- [ ] Phase 1: Foundation (database setup)
- [ ] Phase 2: Auth & Layout
- [ ] Phase 3: Employees
- [ ] Phase 4: Students + Excel
- [ ] Phase 5: Academic Years + Classes
- [ ] Phase 6: Tuition Generator
- [ ] Phase 7: Scholarships + Auto-pay
- [ ] Phase 8: Payment Processing
- [ ] Phase 9: Reports
- [ ] Phase 10: Polish + Swagger

## 🐛 Quick Fixes

### "Prisma Client not found"
```bash
npx prisma generate
```

### "Module not found: @/..."
Check `tsconfig.json` has:
```json
"paths": { "@/*": ["./src/*"] }
```

### Database connection error
Check `.env.local`:
```env
DATABASE_URL="postgresql://postgres:..."
```

### Excel import not working
1. Download template from system
2. Check column headers match exactly
3. Verify validation (dates, numbers)

## 📱 URLs

| What | URL |
|------|-----|
| App | `http://localhost:3000` |
| Prisma Studio | `http://localhost:5555` |
| API Docs | `http://localhost:3000/api-docs` |
| Supabase | `https://app.supabase.com` |

## 💡 Pro Tips

1. **Read 00-EXECUTION-GUIDE.md first** - Saves time
2. **One phase at a time** - Don't skip ahead
3. **Test after each phase** - Catch issues early
4. **Commit after success** - Can always rollback
5. **Use Prisma Studio** - Visual database debugging

## 🎨 Mantine Components

```typescript
// Common imports
import { Button, TextInput, Select, Table, Modal } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { useForm } from '@mantine/form';
import { DatePickerInput } from '@mantine/dates';
```

## 🔄 Data Flow

```
User Action
    ↓
Component (04-FRONTEND-STRUCTURE.md)
    ↓
Hook (05-QUERY-KEY-FACTORY.md)
    ↓
API Route (03-API-ENDPOINTS.md)
    ↓
Business Logic (07-BUSINESS-LOGIC.md)
    ↓
Prisma (02-DATABASE-SCHEMA.md)
    ↓
Database
```

## 📦 Package.json (Essentials)

```json
{
  "dependencies": {
    "next": "14.x",
    "@mantine/core": "latest",
    "@tanstack/react-query": "latest",
    "@prisma/client": "latest",
    "mantine-react-table": "latest",
    "xlsx": "latest",
    "zustand": "latest"
  }
}
```

## 🎯 Success Metrics

✅ Project complete when:
- Can login
- Can create student
- Can import via Excel
- Can generate tuitions
- Can process payment
- Can view overdue report
- System deployed

## 📚 Doc Reading Order

1. **Start**: `00-EXECUTION-GUIDE.md`
2. **Understand**: `01-PROJECT-OVERVIEW.md`
3. **Setup**: `08-DEPLOYMENT.md`
4. **Build**: Follow execution guide, reference others

## 🆘 When Stuck

1. Check current phase in `00-EXECUTION-GUIDE.md`
2. Review relevant doc (01-08)
3. Check this cheat sheet
4. Review code examples in docs
5. Test in Prisma Studio

---

**Remember**: Read `00-EXECUTION-GUIDE.md` first! It prevents 90% of issues. 🎯
