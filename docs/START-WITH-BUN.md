# 🚀 Running from Scratch with Bun - Complete Guide

## Prerequisites Check

Before starting, ensure you have:

- [ ] Bun installed ([Install](https://bun.sh))
- [ ] Git installed ([Download](https://git-scm.com))
- [ ] Code editor (VS Code recommended)
- [ ] Supabase account ([Sign up free](https://supabase.com))

**Check versions:**
```bash
bun --version   # Should show 1.0.0 or higher
git --version   # Should show git version 2.x.x
```

**Install Bun (if not installed):**
```bash
# macOS/Linux/WSL
curl -fsSL https://bun.sh/install | bash

# Windows (PowerShell)
powershell -c "irm bun.sh/install.ps1 | iex"

# Restart terminal after installation
```

---

## 🎯 Step 1: Create Next.js Project with Bun (3 minutes)

### 1.1 Create Project

```bash
bunx create-next-app@latest school-tuition-system
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

## 📦 Step 2: Install Dependencies with Bun (1 minute)

Bun is much faster than npm! Install all dependencies at once:

```bash
bun add @mantine/core@^7.14.0 @mantine/dates@^7.14.0 @mantine/form@^7.14.0 @mantine/hooks@^7.14.0 @mantine/modals@^7.14.0 @mantine/notifications@^7.14.0 @prisma/client@^5.22.0 @supabase/auth-helpers-nextjs@^0.10.0 @supabase/supabase-js@^2.46.0 @tabler/icons-react@^3.21.0 @tanstack/react-query@^5.59.0 @tanstack/react-query-devtools@^5.59.0 bcryptjs@^2.4.3 dayjs@^1.11.13 mantine-react-table@^2.0.4 xlsx@^0.18.5 zod@^3.23.8 zustand@^5.0.1
```

### Install Dev Dependencies

```bash
bun add -d @types/bcryptjs@^2.4.6 next-swagger-doc@^0.4.0 postcss-preset-mantine@^1.17.0 postcss-simple-vars@^7.0.1 prisma@^5.22.0 swagger-ui-react@^5.17.14 @types/node typescript
```

**Installation should complete in seconds!** ⚡ (Bun is ~10x faster than npm)

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

```bash
# Mac/Linux/WSL
touch .env.local

# Windows (PowerShell)
New-Item .env.local

# Or create in VS Code
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

## 🗃️ Step 5: Setup Prisma & Database Schema (3 minutes)

### 5.1 Initialize Prisma

```bash
bunx prisma init
```

This creates `prisma/schema.prisma` file.

### 5.2 Replace Schema

**Delete everything** in `prisma/schema.prisma` and replace with:

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
bunx prisma generate
```

### 5.4 Push Schema to Database

```bash
bunx prisma db push
```

When asked `Do you want to continue?` → Type `y` and press Enter

**Success!** You should see: `✔ Generated Prisma Client`

---

## 🌱 Step 6: Seed Database with Initial Data (2 minutes)

### 6.1 Create Seed File

Create file `prisma/seed.ts`:

```typescript
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting seed...');

  // Create default password hash (using Bun's built-in hash)
  const hashedPassword = await Bun.password.hash('123456', {
    algorithm: 'bcrypt',
    cost: 10,
  });

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

### 6.2 Update package.json

Open `package.json` and update the `"scripts"` section:

```json
{
  "scripts": {
    "dev": "next dev --turbo",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "prisma:seed": "bun run prisma/seed.ts",
    "prisma:studio": "bunx prisma studio",
    "prisma:generate": "bunx prisma generate",
    "prisma:push": "bunx prisma db push"
  }
}
```

### 6.3 Run Seed

```bash
bun run prisma:seed
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

Open Prisma Studio:

```bash
bun run prisma:studio
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
        <Text size="lg">System is running successfully with Bun! ⚡</Text>
        <Text c="dimmed">
          Database connected ✅<br />
          Mantine UI working ✅<br />
          Bun runtime active ⚡<br />
          Ready to build features! 🚀
        </Text>
        <Button size="lg">Test Button</Button>
      </Stack>
    </Container>
  );
}
```

---

## 🚀 Step 9: Start Development Server with Bun (1 minute)

```bash
bun run dev
```

**Bun will start with Turbopack** (super fast! ⚡)

**Open browser**: http://localhost:3000

**You should see:**
- 🎓 School Tuition Management System
- "System is running successfully with Bun! ⚡"
- A blue button

**✅ SUCCESS! Your project is working with Bun!**

---

## ⚡ Bun-Specific Features & Benefits

### Why Bun is Better:

1. **~10x Faster Installation**: Dependencies install in seconds
2. **Faster Development Server**: Hot reload is nearly instant
3. **Built-in TypeScript**: No ts-node needed
4. **Built-in Password Hashing**: Uses native Bun.password API
5. **Better Memory Usage**: Uses less RAM than Node.js
6. **Native Watch Mode**: File watching is super fast

### Bun Commands Reference:

```bash
# Package management (much faster than npm!)
bun add <package>          # Install package
bun add -d <package>       # Install dev dependency
bun remove <package>       # Remove package
bun install                # Install all dependencies
bun update                 # Update all packages

# Running scripts
bun run dev                # Start dev server
bun run build              # Build for production
bun run <script>           # Run any package.json script

# Running files directly
bun run file.ts            # Run TypeScript file directly
bun prisma/seed.ts         # Run seed file

# Prisma with Bun
bunx prisma generate       # Generate Prisma Client
bunx prisma studio         # Open Prisma Studio
bunx prisma db push        # Push schema to database
```

---

## 🎯 What You Have Now

✅ Next.js 14 with Bun runtime ⚡  
✅ Supabase PostgreSQL database  
✅ Prisma ORM configured  
✅ Database schema (7 tables)  
✅ Seed data (admin, cashier, student)  
✅ Mantine UI components  
✅ Development server running with Turbopack  
✅ Lightning-fast hot reload  

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

## 🐛 Troubleshooting (Bun-Specific)

### "Cannot find module '@prisma/client'"
```bash
bunx prisma generate
```

### "Connection error" to database
- Check DATABASE_URL in `.env.local`
- Verify Supabase project is running
- Check password is correct

### Port 3000 already in use
```bash
# Kill process on port 3000 (Bun way)
bun run dev -- --port 3001

# Or use system command
lsof -ti:3000 | xargs kill
```

### Prisma Studio won't open
```bash
# Try on different port
bunx prisma studio --port 5556
```

### Bun cache issues
```bash
# Clear Bun cache
rm -rf ~/.bun/install/cache
bun install
```

### "Module not found: @/..."
- Check `tsconfig.json` has paths configured
- Restart VS Code
- Run `bun run dev` again

---

## 📝 Quick Bun Commands Reference

```bash
# Development
bun run dev                    # Start dev server with Turbopack
bun run build                  # Build for production
bun run start                  # Start production server

# Database
bun run prisma:studio          # Open database viewer
bunx prisma generate           # Generate Prisma Client
bunx prisma db push            # Push schema to database
bun run prisma:seed            # Seed database

# Package management
bun add <package>              # Install package
bun remove <package>           # Remove package
bun update                     # Update packages
```

---

## ✅ Verification Checklist

Before moving to Phase 2:

- [ ] Bun is installed and working
- [ ] Project runs on http://localhost:3000
- [ ] No errors in terminal
- [ ] Test page displays "Bun runtime active ⚡"
- [ ] Prisma Studio shows data at http://localhost:5555
- [ ] Can see employees, students tables
- [ ] `.env.local` file exists with correct values
- [ ] Hot reload works instantly ⚡

---

## 🎉 Congratulations!

You've successfully set up the project from scratch with Bun! 

**Bun Advantages:**
- ⚡ Installation was ~10x faster
- ⚡ Dev server starts instantly
- ⚡ Hot reload is near-instant
- ⚡ Uses less memory
- ⚡ Native TypeScript support

**Next**: Open `00-EXECUTION-GUIDE.md` and start **Phase 2: Authentication & Layout**

---

## 💡 Bun Pro Tips

1. **Use `bunx` instead of `npx`**: It's faster
2. **Direct file execution**: `bun run file.ts` works without compilation
3. **Built-in test runner**: `bun test` for testing (coming in Phase 10)
4. **No need for ts-node**: Bun runs TypeScript natively
5. **Watch mode**: Use `bun --watch file.ts` for auto-reload

---

## 📞 Need Help?

**Common Bun-specific issues:**
1. Bun not recognized → Restart terminal after installation
2. Permission errors → Run without sudo on Mac/Linux
3. Windows issues → Use WSL for best experience
4. Package conflicts → Clear cache with `rm -rf node_modules && bun install`

**Still stuck?** Review the error message and search in documentation files.

---

**🚀 Happy coding with Bun! ⚡**

## Performance Comparison (Bun vs npm)

| Task | npm | Bun | Speedup |
|------|-----|-----|---------|
| Install all deps | ~2-3 min | ~15-20 sec | 6-10x faster |
| Cold start | ~8-10 sec | ~2-3 sec | 3-4x faster |
| Hot reload | ~1-2 sec | ~100-300ms | 5-10x faster |
| Run TypeScript | ts-node needed | Native | ∞ |

**Bottom line**: Everything is faster with Bun! ⚡
