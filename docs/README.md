# School Tuition Management System - Complete Documentation

## 📚 Documentation Index

This folder contains comprehensive documentation for building a complete school tuition management system using modern web technologies.

### Quick Start

**For Claude Code Users**: Start with `00-EXECUTION-GUIDE.md` for step-by-step implementation phases.

### Documentation Files

| File | Description | When to Use |
|------|-------------|-------------|
| `00-EXECUTION-GUIDE.md` | Step-by-step implementation guide (10 phases) | Start here! Essential for avoiding incomplete work |
| `01-PROJECT-OVERVIEW.md` | Project goals, features, and architecture | Understanding the big picture |
| `02-DATABASE-SCHEMA.md` | Complete Prisma schema and database design | Setting up database |
| `03-API-ENDPOINTS.md` | All API routes with Swagger documentation | Building backend |
| `04-FRONTEND-STRUCTURE.md` | React components and page structure | Building frontend |
| `05-QUERY-KEY-FACTORY.md` | TanStack Query setup and hooks | Data fetching and caching |
| `06-EXCEL-TEMPLATES.md` | Excel import/export functionality | Mass data operations |
| `07-BUSINESS-LOGIC.md` | Core calculations and business rules | Implementing tuition/payment logic |
| `08-DEPLOYMENT.md` | Configuration, setup, and deployment | Going to production |

## 🎯 Project Overview

**What it does**: Complete school administration system for managing:
- Students and employees
- Academic years and classes
- Monthly tuition tracking (July-June cycle)
- Scholarships with auto-payment
- Payment processing
- Overdue reports

**Key Features**:
- ✅ Role-based access (Admin / Cashier)
- ✅ Smart tuition generation (skips months before join date)
- ✅ Excel mass import with validation
- ✅ Full scholarship auto-payment
- ✅ Comprehensive reporting
- ✅ Modern, responsive UI

## 🛠 Tech Stack

- **Frontend**: Next.js 14, TypeScript, Mantine UI
- **Backend**: Next.js API Routes, Prisma ORM
- **Database**: Supabase (PostgreSQL)
- **State**: TanStack Query, Zustand
- **Forms**: React Hook Form, Zod
- **Tables**: Mantine React Table
- **Excel**: SheetJS (xlsx)
- **Docs**: Swagger/OpenAPI

## 🚀 Quick Start Guide

### Option 1: Sequential Implementation (Recommended)

Follow the phase-by-phase approach in `00-EXECUTION-GUIDE.md`:

1. **Phase 1**: Project foundation & database setup
2. **Phase 2**: Authentication & layout
3. **Phase 3**: Employee management
4. **Phase 4**: Student management with Excel
5. **Phase 5**: Academic years & classes
6. **Phase 6**: Tuition generation
7. **Phase 7**: Scholarship system
8. **Phase 8**: Payment processing
9. **Phase 9**: Reporting system
10. **Phase 10**: Polish & deployment

### Option 2: Direct Implementation

If you're experienced with the stack:

```bash
# 1. Read all docs
cat docs/*.md

# 2. Create project
npx create-next-app@latest school-tuition-system

# 3. Follow 08-DEPLOYMENT.md for setup

# 4. Implement features using other docs as reference
```

## 📖 How to Use This Documentation

### For Claude Code

**Starting a new session:**
```
I'm implementing Phase [X] of the school tuition system.
Please load:
- 00-EXECUTION-GUIDE.md (for current phase)
- [relevant doc files based on phase]

Previous progress: [brief summary]
Current task: [what you're working on]
```

**Mid-phase:**
```
Continuing Phase [X], Task [Y].
Completed: [list what's done]
Need help with: [specific issue]
```

### For Human Developers

1. **First time**: Read `01-PROJECT-OVERVIEW.md` for context
2. **Setting up**: Follow `08-DEPLOYMENT.md` exactly
3. **Building features**: Reference specific docs as needed
4. **Stuck**: Check `07-BUSINESS-LOGIC.md` for complex calculations

## 🗂 File Structure

```
school-tuition-system/
├── docs/                           # This folder
│   ├── 00-EXECUTION-GUIDE.md
│   ├── 01-PROJECT-OVERVIEW.md
│   ├── 02-DATABASE-SCHEMA.md
│   ├── 03-API-ENDPOINTS.md
│   ├── 04-FRONTEND-STRUCTURE.md
│   ├── 05-QUERY-KEY-FACTORY.md
│   ├── 06-EXCEL-TEMPLATES.md
│   ├── 07-BUSINESS-LOGIC.md
│   ├── 08-DEPLOYMENT.md
│   └── README.md (this file)
├── prisma/
│   └── schema.prisma              # From 02-DATABASE-SCHEMA.md
├── src/
│   ├── app/                       # Next.js pages (04-FRONTEND-STRUCTURE.md)
│   ├── components/                # React components
│   ├── hooks/                     # Custom hooks (05-QUERY-KEY-FACTORY.md)
│   ├── lib/                       # Utilities
│   ├── store/                     # Zustand stores
│   └── types/                     # TypeScript types
└── package.json
```

## 📥 Download All Documentation

### Method 1: As Archive

Create a zip of all docs:
```bash
zip -r school-tuition-docs.zip docs/
```

### Method 2: As Single File

Combine all docs into one:
```bash
cat docs/00-EXECUTION-GUIDE.md \
    docs/01-PROJECT-OVERVIEW.md \
    docs/02-DATABASE-SCHEMA.md \
    docs/03-API-ENDPOINTS.md \
    docs/04-FRONTEND-STRUCTURE.md \
    docs/05-QUERY-KEY-FACTORY.md \
    docs/06-EXCEL-TEMPLATES.md \
    docs/07-BUSINESS-LOGIC.md \
    docs/08-DEPLOYMENT.md \
    > COMPLETE_DOCUMENTATION.md
```

### Method 3: Git Clone

```bash
# Clone repository
git clone [repo-url]
cd school-tuition-system/docs

# All docs are in /docs folder
```

## 🎓 Learning Path

### Beginner
1. Read `01-PROJECT-OVERVIEW.md` to understand the system
2. Follow `08-DEPLOYMENT.md` to setup environment
3. Use `00-EXECUTION-GUIDE.md` strictly - one phase at a time
4. Reference other docs only when building that specific feature

### Intermediate
1. Skim all docs to understand architecture
2. Setup project using `08-DEPLOYMENT.md`
3. Use `00-EXECUTION-GUIDE.md` as checklist
4. Dive deep into specific docs as needed

### Advanced
1. Review `01-PROJECT-OVERVIEW.md` and `02-DATABASE-SCHEMA.md`
2. Use other docs as reference during implementation
3. Customize and extend based on your needs

## 🔑 Key Concepts

### Role-Based Access Control
- **Admin**: Full system access
- **Cashier**: Payments and reports only

### Tuition Generation Logic
- Academic year: July → June
- Student joins mid-year: only pay from join month forward
- Example: Join in January → skip July-December

### Class Naming Pattern
- Format: `GRADE-SECTION-YEAR`
- Examples: `I-A-2024/2025`, `XII-IPA-2024/2025`

### Scholarship Auto-Payment
- Full scholarship: Auto-mark all tuitions as PAID
- Partial scholarship: Reduce amount but still require payment

### Excel Import
- Templates with data validation
- Dropdowns for critical fields
- Error reporting by row

## 📝 Important Notes

### Default Credentials
After seeding:
- **Admin**: `admin@school.com` / `123456`
- **Cashier**: `cashier@school.com` / `123456`

⚠️ Change these in production!

### Environment Variables
Required (see `08-DEPLOYMENT.md`):
- `DATABASE_URL` - Supabase connection
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`

### Database Schema
- Uses Prisma ORM
- PostgreSQL via Supabase
- Automatic migrations
- Row-Level Security (RLS) supported

## 🤝 Contributing

This is documentation for a school project. To improve:

1. **Fix errors**: Submit corrections
2. **Add examples**: More code samples welcome
3. **Clarify**: Improve explanations
4. **Extend**: Add new features/docs

## 📊 Documentation Statistics

- **Total Files**: 9 (plus this README)
- **Total Lines**: ~3,500+ lines of documentation
- **Code Examples**: 100+ snippets
- **Implementation Phases**: 10 phases
- **Estimated Dev Time**: 10-20 hours

## 🆘 Getting Help

### Common Issues

**Issue**: "Can't connect to database"
**Solution**: Check `DATABASE_URL` in `.env.local` and Supabase project status

**Issue**: "Prisma Client not found"
**Solution**: Run `npx prisma generate`

**Issue**: "Excel import fails"
**Solution**: Verify template format matches exactly (see `06-EXCEL-TEMPLATES.md`)

**Issue**: "Lost context mid-phase"
**Solution**: Check `00-EXECUTION-GUIDE.md` → Emergency Recovery section

### Where to Look

| Problem | Documentation |
|---------|---------------|
| Database errors | `02-DATABASE-SCHEMA.md` |
| API not working | `03-API-ENDPOINTS.md` |
| UI components | `04-FRONTEND-STRUCTURE.md` |
| Data fetching | `05-QUERY-KEY-FACTORY.md` |
| Business logic | `07-BUSINESS-LOGIC.md` |
| Deployment issues | `08-DEPLOYMENT.md` |

## 🎉 Success Criteria

Project is complete when:
- ✅ All 10 phases from `00-EXECUTION-GUIDE.md` finished
- ✅ Can login as admin and cashier
- ✅ Can create students and import via Excel
- ✅ Can generate tuitions for classes
- ✅ Can process payments
- ✅ Can view overdue reports
- ✅ Scholarships auto-pay tuitions
- ✅ System deployed and accessible

## 📞 Support

For questions or issues:
1. Re-read relevant documentation section
2. Check `00-EXECUTION-GUIDE.md` for your current phase
3. Review code examples in docs
4. Search for similar implementations in the stack's official docs

## 📄 License

Documentation provided as-is for educational purposes.

---

**Ready to build?** Start with `00-EXECUTION-GUIDE.md` → Phase 1! 🚀
