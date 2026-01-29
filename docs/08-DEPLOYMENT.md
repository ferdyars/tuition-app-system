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
