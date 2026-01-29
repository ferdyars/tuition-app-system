# 🚀 Running from Scratch - Complete Step-by-Step Guide

## Prerequisites Check

Before starting, ensure you have:

- [ ] Node.js 18+ installed ([Download](https://nodejs.org))
- [ ] npm 9+ (comes with Node.js)
- [ ] Git installed ([Download](https://git-scm.com))
- [ ] Code editor (VS Code recommended)
- [ ] Supabase account ([Sign up free](https://supabase.com))

**Check versions:**
```bash
node --version   # Should show v18.x.x or higher
npm --version    # Should show 9.x.x or higher
git --version    # Should show git version 2.x.x
```

---

## 🎯 Step 1: Create Next.js Project (5 minutes)

### 1.1 Create Project

Open terminal and run:

```bash
npx create-next-app@latest school-tuition-system
```

**When prompted, answer:**
```
✔ Would you like to use TypeScript? › Yes
✔ Would you like to use ESLint? › Yes
✔ Would you like to use Tailwind CSS? › Yes
✔ Would you like to use `src/` directory? › Yes
✔ Would you like to use App Router? › Yes
✔ Would you like to customize the default import alias (@/*)? › No
```

### 1.2 Navigate to Project

```bash
cd school-tuition-system
```

---

## 📦 Step 2: Install Dependencies (3 minutes)

Copy and paste this entire command:

```bash
npm install @mantine/core@^7.14.0 @mantine/dates@^7.14.0 @mantine/form@^7.14.0 @mantine/hooks@^7.14.0 @mantine/modals@^7.14.0 @mantine/notifications@^7.14.0 @prisma/client@^5.22.0 @supabase/auth-helpers-nextjs@^0.10.0 @supabase/supabase-js@^2.46.0 @tabler/icons-react@^3.21.0 @tanstack/react-query@^5.59.0 @tanstack/react-query-devtools@^5.59.0 bcryptjs@^2.4.3 dayjs@^1.11.13 mantine-react-table@^2.0.4 xlsx@^0.18.5 zod@^3.23.8 zustand@^5.0.1
```

### Install Dev Dependencies

```bash
npm install -D @types/bcryptjs@^2.4.6 next-swagger-doc@^0.4.0 postcss-preset-mantine@^1.17.0 postcss-simple-vars@^7.0.1 prisma@^5.22.0 swagger-ui-react@^5.17.14 ts-node@^10.9.2
```

**Wait for installation to complete** (this may take 2-3 minutes)

---

## 🗄️ Step 3: Setup Supabase Database (10 minutes)

### 3.1 Create Supabase Project

1. Go to [https://supabase.com](https://supabase.com)
2. Click "Start your project" (or "New Project" if you have account)
3. Sign in with GitHub/Google/Email
4. Click "New Project"
5. Fill in:
   - **Name**: `school-tuition-db` (or any name)
   - **Database Password**: Create a strong password (SAVE THIS!)
   - **Region**: Choose closest to you
   - **Pricing Plan**: Free
6. Click "Create new project"
7. **Wait 2-3 minutes** for database to provision

### 3.2 Get Database Connection String

Once project is ready:

1. Click **Settings** (gear icon in sidebar)
2. Click **Database**
3. Scroll down to **Connection string**
4. Select **URI** tab
5. Copy the connection string
6. Replace `[YOUR-PASSWORD]` with your actual password

**Example:**
```
postgresql://postgres.abcdefghijk:YOUR_PASSWORD@aws-0-us-east-1.pooler.supabase.com:6543/postgres
```

### 3.3 Get Supabase API Keys

1. Still in Settings, click **API**
2. Copy these values:
   - **Project URL** (starts with `https://`)
   - **anon public** key (under Project API keys)
   - **service_role** key (under Project API keys - click "Reveal")

---

## ⚙️ Step 4: Configure Environment Variables (2 minutes)

### 4.1 Create `.env.local` file

In your project root, create file `.env.local`:

```bash
# On Mac/Linux
touch .env.local

# On Windows (Command Prompt)
type nul > .env.local

# Or just create it in VS Code
```

### 4.2 Add Configuration

Open `.env.local` and paste this, **replacing the placeholders**:

```env
# Database (from Step 3.2)
DATABASE_URL="postgresql://postgres.xxxx:YOUR_PASSWORD@xxxx.pooler.supabase.com:6543/postgres?pgbouncer=true"
DIRECT_URL="postgresql://postgres.xxxx:YOUR_PASSWORD@xxxx.pooler.supabase.com:6543/postgres"

# Supabase (from Step 3.3)
NEXT_PUBLIC_SUPABASE_URL="https://xxxxxxxxxxxx.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="your-anon-key-here"
SUPABASE_SERVICE_ROLE_KEY="your-service-role-key-here"

# App
NEXT_PUBLIC_APP_URL="http://localhost:3000"
NODE_ENV="development"
```

**Important**: 
- For `DATABASE_URL`, add `?pgbouncer=true` at the end
- For `DIRECT_URL`, use the same string WITHOUT `?pgbouncer=true`

---

## 🗃️ Step 5: Setup Prisma & Database Schema (5 minutes)

### 5.1 Initialize Prisma

```bash
npx prisma init
```

This creates `prisma/schema.prisma` file.

### 5.2 Replace Schema

**Delete everything** in `prisma/schema.prisma` and replace with this complete schema:

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
  directUrl = env("DIRECT_URL")
}

// ENUMS
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

// MODELS
model Employee {
  employeeId  String   @id @default(uuid()) @map("employee_id")
  name        String
  email       String   @unique
  password    String
  role        Role     @default(CASHIER)
  createdAt   DateTime @default(now()) @map("created_at")
  updatedAt   DateTime @updatedAt @map("updated_at")
  payments    Payment[]
  @@map("employees")
}

model Student {
  nis              String   @id
  nik              String   @unique
  name             String
  address          String
  parentName       String   @map("parent_name")
  parentPhone      String   @map("parent_phone")
  startJoinDate    DateTime @map("start_join_date")
  createdAt        DateTime @default(now()) @map("created_at")
  updatedAt        DateTime @updatedAt @map("updated_at")
  scholarships     Scholarship[]
  tuitions         Tuition[]
  @@map("students")
}

model AcademicYear {
  id            String   @id @default(uuid())
  year          String   @unique
  startDate     DateTime @map("start_date")
  endDate       DateTime @map("end_date")
  isActive      Boolean  @default(false) @map("is_active")
  createdAt     DateTime @default(now()) @map("created_at")
  updatedAt     DateTime @updatedAt @map("updated_at")
  classAcademics ClassAcademic[]
  @@map("academic_years")
}

model ClassAcademic {
  id              String   @id @default(uuid())
  academicYearId  String   @map("academic_year_id")
  grade           Int
  section         String
  className       String   @map("class_name")
  createdAt       DateTime @default(now()) @map("created_at")
  updatedAt       DateTime @updatedAt @map("updated_at")
  academicYear    AcademicYear @relation(fields: [academicYearId], references: [id], onDelete: Cascade)
  tuitions        Tuition[]
  scholarships    Scholarship[]
  @@unique([academicYearId, grade, section])
  @@map("class_academics")
}

model Tuition {
  id              String        @id @default(uuid())
  classAcademicId String        @map("class_academic_id")
  studentNis      String        @map("student_nis")
  month           Month
  year            Int
  feeAmount       Decimal       @map("fee_amount") @db.Decimal(10, 2)
  paidAmount      Decimal       @default(0) @map("paid_amount") @db.Decimal(10, 2)
  status          PaymentStatus @default(UNPAID)
  dueDate         DateTime      @map("due_date")
  generatedAt     DateTime      @default(now()) @map("generated_at")
  createdAt       DateTime      @default(now()) @map("created_at")
  updatedAt       DateTime      @updatedAt @map("updated_at")
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

model Scholarship {
  id              String   @id @default(uuid())
  studentNis      String   @map("student_nis")
  classAcademicId String   @map("class_academic_id")
  nominal         Decimal  @db.Decimal(10, 2)
  isFullScholarship Boolean @default(false) @map("is_full_scholarship")
  createdAt       DateTime @default(now()) @map("created_at")
  updatedAt       DateTime @updatedAt @map("updated_at")
  student         Student       @relation(fields: [studentNis], references: [nis], onDelete: Cascade)
  classAcademic   ClassAcademic @relation(fields: [classAcademicId], references: [id], onDelete: Cascade)
  @@unique([studentNis, classAcademicId])
  @@index([studentNis])
  @@index([classAcademicId])
  @@map("scholarships")
}

model Payment {
  id          String   @id @default(uuid())
  tuitionId   String   @map("tuition_id")
  employeeId  String   @map("employee_id")
  amount      Decimal  @db.Decimal(10, 2)
  paymentDate DateTime @default(now()) @map("payment_date")
  notes       String?
  createdAt   DateTime @default(now()) @map("created_at")
  updatedAt   DateTime @updatedAt @map("updated_at")
  tuition     Tuition  @relation(fields: [tuitionId], references: [id], onDelete: Cascade)
  employee    Employee @relation(fields: [employeeId], references: [employeeId], onDelete: Restrict)
  @@index([tuitionId])
  @@index([employeeId])
  @@index([paymentDate])
  @@map("payments")
}
```

### 5.3 Generate Prisma Client

```bash
npx prisma generate
```

### 5.4 Push Schema to Database

```bash
npx prisma db push
```

When asked `Do you want to continue?` → Type `y` and press Enter

**Success!** You should see: `✔ Generated Prisma Client`

---

## 🌱 Step 6: Seed Database with Initial Data (3 minutes)

### 6.1 Create Seed File

Create file `prisma/seed.ts`:

```bash
# Mac/Linux
touch prisma/seed.ts

# Windows (use VS Code to create the file)
```

### 6.2 Add Seed Script

Open `prisma/seed.ts` and paste:

```typescript
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting seed...');

  // Create default password hash
  const hashedPassword = await bcrypt.hash('123456', 10);

  // Create admin
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

  // Create cashier
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

  // Create academic year
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
  console.log('✅ Created academic year:', academicYear.year);

  // Create sample student
  const student = await prisma.student.upsert({
    where: { nis: '2024001' },
    update: {},
    create: {
      nis: '2024001',
      nik: '3578123456789012',
      name: 'Ahmad Rizki',
      address: 'Jl. Merdeka No. 123',
      parentName: 'Budi Santoso',
      parentPhone: '081234567890',
      startJoinDate: new Date('2024-07-01'),
    },
  });
  console.log('✅ Created sample student:', student.name);

  console.log('🎉 Seeding complete!');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
```

### 6.3 Update package.json

Open `package.json` and add this in the `"scripts"` section:

```json
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "prisma:seed": "ts-node --compiler-options {\"module\":\"CommonJS\"} prisma/seed.ts",
    "prisma:studio": "prisma studio"
  }
}
```

### 6.4 Run Seed

```bash
npm run prisma:seed
```

**You should see:**
```
✅ Created admin: admin@school.com
✅ Created cashier: cashier@school.com
✅ Created academic year: 2024/2025
✅ Created sample student: Ahmad Rizki
🎉 Seeding complete!
```

---

## 👀 Step 7: Verify Database (2 minutes)

Open Prisma Studio to see your data:

```bash
npm run prisma:studio
```

This opens http://localhost:5555 in your browser.

**You should see:**
- ✅ 2 employees (admin & cashier)
- ✅ 1 academic year (2024/2025)
- ✅ 1 student (Ahmad Rizki)

**Leave Prisma Studio open** - it's useful for debugging!

---

## 🎨 Step 8: Configure Mantine UI (5 minutes)

### 8.1 Create PostCSS Config

Create `postcss.config.js` in project root:

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

### 8.2 Update Root Layout

Replace `src/app/layout.tsx` with:

```typescript
import '@mantine/core/styles.css';
import '@mantine/notifications/styles.css';
import '@mantine/dates/styles.css';
import 'mantine-react-table/styles.css';

import { MantineProvider, ColorSchemeScript } from '@mantine/core';
import { Notifications } from '@mantine/notifications';
import { ModalsProvider } from '@mantine/modals';

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
        <MantineProvider defaultColorScheme="light">
          <ModalsProvider>
            <Notifications position="top-right" />
            {children}
          </ModalsProvider>
        </MantineProvider>
      </body>
    </html>
  );
}
```

### 8.3 Create Simple Test Page

Replace `src/app/page.tsx` with:

```typescript
import { Title, Text, Button, Container, Stack } from '@mantine/core';

export default function HomePage() {
  return (
    <Container size="md" py="xl">
      <Stack gap="md">
        <Title order={1}>🎓 School Tuition Management System</Title>
        <Text size="lg">System is running successfully!</Text>
        <Text c="dimmed">
          Database connected ✅<br />
          Mantine UI working ✅<br />
          Ready to build features! 🚀
        </Text>
        <Button size="lg">Test Button</Button>
      </Stack>
    </Container>
  );
}
```

---

## 🚀 Step 9: Start Development Server (1 minute)

```bash
npm run dev
```

**Open browser**: http://localhost:3000

**You should see:**
- 🎓 School Tuition Management System
- "System is running successfully!"
- A blue button

**✅ SUCCESS! Your project is working!**

---

## 🎯 What You Have Now

✅ Next.js 14 project with TypeScript  
✅ Supabase PostgreSQL database  
✅ Prisma ORM configured  
✅ Database schema (7 tables)  
✅ Seed data (admin, cashier, student)  
✅ Mantine UI components  
✅ Development server running  

---

## 📋 Default Credentials

**Admin Login (for later):**
- Email: `admin@school.com`
- Password: `123456`

**Cashier Login:**
- Email: `cashier@school.com`
- Password: `123456`

---

## 🎓 Next Steps

Now you're ready to build features! Follow the **00-EXECUTION-GUIDE.md** to implement:

### Phase 2: Authentication & Layout
- Login page
- Dashboard layout
- Sidebar navigation
- Role-based access

### Phase 3-10: Core Features
- Employee management
- Student management with Excel import
- Tuition generation
- Payment processing
- Reports

**Continue with**: `00-EXECUTION-GUIDE.md` → Phase 2

---

## 🐛 Troubleshooting

### "Cannot find module '@prisma/client'"
```bash
npx prisma generate
```

### "Connection error" to database
- Check DATABASE_URL in `.env.local`
- Verify Supabase project is running
- Check password is correct

### Port 3000 already in use
```bash
# Kill process on port 3000
npx kill-port 3000

# Or use different port
npm run dev -- -p 3001
```

### Prisma Studio won't open
```bash
# Try on different port
npx prisma studio --port 5556
```

### "Module not found: @/..."
- Check `tsconfig.json` has paths configured
- Restart VS Code
- Run `npm run dev` again

---

## 📝 Quick Commands Reference

```bash
# Start development
npm run dev

# Open database viewer
npm run prisma:studio

# Reset database (careful!)
npx prisma migrate reset

# Generate Prisma Client
npx prisma generate

# View database tables
npx prisma studio
```

---

## ✅ Verification Checklist

Before moving to Phase 2:

- [ ] Project runs on http://localhost:3000
- [ ] No errors in terminal
- [ ] Test page displays correctly
- [ ] Prisma Studio shows data at http://localhost:5555
- [ ] Can see employees, students tables
- [ ] `.env.local` file exists with correct values

---

## 🎉 Congratulations!

You've successfully set up the project from scratch! 

**Next**: Open `00-EXECUTION-GUIDE.md` and start **Phase 2: Authentication & Layout**

---

## 📞 Need Help?

**Common issues solved:**
1. Database connection → Check `.env.local`
2. Prisma errors → Run `npx prisma generate`
3. Module errors → Delete `node_modules`, run `npm install`
4. Port conflicts → Use `npx kill-port 3000`

**Still stuck?** Review the error message and search in documentation files.

---

**🚀 Happy coding!**
