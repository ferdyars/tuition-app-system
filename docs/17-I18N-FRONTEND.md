# Internationalization (i18n) - Frontend

## Overview

This document outlines the implementation plan for adding multi-language support to the Student Portal frontend. The system will support:
- **Indonesian (id)** - Default language
- **English (en)** - Secondary language

## Recommended Approach: next-intl

`next-intl` is the recommended library for Next.js App Router internationalization.

### Installation

```bash
bun add next-intl
```

### File Structure

```
src/
├── i18n/
│   ├── request.ts          # Server-side i18n configuration
│   ├── routing.ts          # Route configuration
│   └── navigation.ts       # Localized navigation helpers
├── messages/
│   ├── id.json             # Indonesian translations
│   └── en.json             # English translations
└── app/
    └── [locale]/           # Locale-based routing
        └── (student-portal)/
            └── portal/
                └── ...
```

## Implementation Steps

### Phase 1: Setup Configuration

1. **Create i18n routing configuration** (`src/i18n/routing.ts`):
```typescript
import { defineRouting } from 'next-intl/routing';

export const routing = defineRouting({
  locales: ['id', 'en'],
  defaultLocale: 'id',
});
```

2. **Create navigation helpers** (`src/i18n/navigation.ts`):
```typescript
import { createNavigation } from 'next-intl/navigation';
import { routing } from './routing';

export const { Link, redirect, usePathname, useRouter } = createNavigation(routing);
```

3. **Create request config** (`src/i18n/request.ts`):
```typescript
import { getRequestConfig } from 'next-intl/server';
import { routing } from './routing';

export default getRequestConfig(async ({ requestLocale }) => {
  let locale = await requestLocale;
  if (!locale || !routing.locales.includes(locale as any)) {
    locale = routing.defaultLocale;
  }

  return {
    locale,
    messages: (await import(`../messages/${locale}.json`)).default,
  };
});
```

### Phase 2: Translation Files

1. **Indonesian translations** (`src/messages/id.json`):
```json
{
  "common": {
    "loading": "Memuat...",
    "error": "Terjadi kesalahan",
    "retry": "Coba Lagi",
    "back": "Kembali",
    "save": "Simpan",
    "cancel": "Batal",
    "delete": "Hapus",
    "edit": "Edit",
    "yes": "Ya",
    "no": "Tidak"
  },
  "auth": {
    "login": "Masuk",
    "logout": "Keluar",
    "username": "Nama Pengguna",
    "password": "Kata Sandi",
    "forgotPassword": "Lupa Kata Sandi?",
    "changePassword": "Ganti Password"
  },
  "portal": {
    "greeting": {
      "morning": "Selamat Pagi",
      "afternoon": "Selamat Siang",
      "evening": "Selamat Sore",
      "night": "Selamat Malam"
    },
    "title": "Portal Orang Tua",
    "subtitle": "Sistem Pembayaran SPP"
  },
  "dashboard": {
    "title": "Beranda",
    "summary": "Ringkasan Pembayaran SPP",
    "academicYear": "Tahun Ajaran {year}",
    "totalUnpaid": "Total Tagihan Belum Lunas",
    "pendingBills": "Tagihan Pending",
    "paidBills": "Sudah Lunas",
    "months": "bulan",
    "payNow": "Bayar Sekarang",
    "noBills": "Tidak ada tagihan SPP"
  },
  "tuition": {
    "list": "Daftar Tagihan SPP",
    "period": "Periode",
    "fee": "Biaya",
    "paid": "Dibayar",
    "remaining": "Sisa",
    "dueDate": "Jatuh Tempo",
    "status": {
      "unpaid": "Belum Bayar",
      "partial": "Sebagian",
      "paid": "Lunas"
    }
  },
  "payment": {
    "title": "Pembayaran",
    "waiting": "Menunggu Transfer",
    "history": "Riwayat Transaksi",
    "createPayment": "Buat Pembayaran",
    "cancelPayment": "Batalkan Pembayaran",
    "selectBill": "Pilih tagihan yang akan dibayar",
    "selectAll": "Pilih Semua",
    "deselectAll": "Batal Pilih Semua",
    "totalSelected": "Total {count} Tagihan",
    "completeIn": "Selesaikan dalam",
    "timeExpired": "Waktu pembayaran habis",
    "transferTo": "Transfer ke salah satu rekening berikut:",
    "totalTransfer": "Total Transfer",
    "uniqueCode": "kode unik",
    "copyAmount": "Salin Nominal",
    "copied": "Tersalin",
    "inProcess": "Dalam Proses",
    "waitingTransfer": "Menunggu transfer",
    "transferExact": "Transfer tepat sesuai nominal di atas ke salah satu rekening. Pembayaran akan diverifikasi otomatis setelah transfer diterima.",
    "status": {
      "pending": "Menunggu",
      "verified": "Berhasil",
      "expired": "Kadaluarsa",
      "cancelled": "Dibatalkan",
      "failed": "Gagal"
    },
    "allPaid": {
      "title": "Selamat! Semua tagihan sudah lunas",
      "message": "Terima kasih telah melakukan pembayaran tepat waktu"
    },
    "noHistory": "Belum ada riwayat transaksi",
    "downloadReceipt": "Unduh Bukti Pembayaran (PDF)"
  },
  "nav": {
    "home": "Beranda",
    "payment": "Pembayaran",
    "changePassword": "Ganti Password",
    "admin": "Halaman Admin"
  },
  "error": {
    "title": "Terjadi Kesalahan",
    "message": "Terjadi kesalahan yang tidak terduga. Silakan coba lagi atau hubungi administrator jika masalah berlanjut.",
    "goHome": "Ke Beranda"
  },
  "months": {
    "JANUARY": "Januari",
    "FEBRUARY": "Februari",
    "MARCH": "Maret",
    "APRIL": "April",
    "MAY": "Mei",
    "JUNE": "Juni",
    "JULY": "Juli",
    "AUGUST": "Agustus",
    "SEPTEMBER": "September",
    "OCTOBER": "Oktober",
    "NOVEMBER": "November",
    "DECEMBER": "Desember"
  },
  "periods": {
    "Q1": "Kuartal 1",
    "Q2": "Kuartal 2",
    "Q3": "Kuartal 3",
    "Q4": "Kuartal 4",
    "SEM1": "Semester 1",
    "SEM2": "Semester 2"
  }
}
```

2. **English translations** (`src/messages/en.json`):
```json
{
  "common": {
    "loading": "Loading...",
    "error": "An error occurred",
    "retry": "Try Again",
    "back": "Back",
    "save": "Save",
    "cancel": "Cancel",
    "delete": "Delete",
    "edit": "Edit",
    "yes": "Yes",
    "no": "No"
  },
  "auth": {
    "login": "Login",
    "logout": "Logout",
    "username": "Username",
    "password": "Password",
    "forgotPassword": "Forgot Password?",
    "changePassword": "Change Password"
  },
  "portal": {
    "greeting": {
      "morning": "Good Morning",
      "afternoon": "Good Afternoon",
      "evening": "Good Evening",
      "night": "Good Night"
    },
    "title": "Parent Portal",
    "subtitle": "School Fee Payment System"
  },
  "dashboard": {
    "title": "Dashboard",
    "summary": "School Fee Payment Summary",
    "academicYear": "Academic Year {year}",
    "totalUnpaid": "Total Unpaid Bills",
    "pendingBills": "Pending Bills",
    "paidBills": "Paid Bills",
    "months": "months",
    "payNow": "Pay Now",
    "noBills": "No school fee bills"
  },
  "tuition": {
    "list": "School Fee List",
    "period": "Period",
    "fee": "Fee",
    "paid": "Paid",
    "remaining": "Remaining",
    "dueDate": "Due Date",
    "status": {
      "unpaid": "Unpaid",
      "partial": "Partial",
      "paid": "Paid"
    }
  },
  "payment": {
    "title": "Payment",
    "waiting": "Waiting for Transfer",
    "history": "Transaction History",
    "createPayment": "Create Payment",
    "cancelPayment": "Cancel Payment",
    "selectBill": "Select bills to pay",
    "selectAll": "Select All",
    "deselectAll": "Deselect All",
    "totalSelected": "Total {count} Bills",
    "completeIn": "Complete within",
    "timeExpired": "Payment time expired",
    "transferTo": "Transfer to one of the following accounts:",
    "totalTransfer": "Total Transfer",
    "uniqueCode": "unique code",
    "copyAmount": "Copy Amount",
    "copied": "Copied",
    "inProcess": "In Process",
    "waitingTransfer": "Waiting for transfer",
    "transferExact": "Transfer the exact amount above to one of the accounts. Payment will be verified automatically after transfer is received.",
    "status": {
      "pending": "Pending",
      "verified": "Success",
      "expired": "Expired",
      "cancelled": "Cancelled",
      "failed": "Failed"
    },
    "allPaid": {
      "title": "Congratulations! All bills are paid",
      "message": "Thank you for making payments on time"
    },
    "noHistory": "No transaction history yet",
    "downloadReceipt": "Download Payment Receipt (PDF)"
  },
  "nav": {
    "home": "Home",
    "payment": "Payment",
    "changePassword": "Change Password",
    "admin": "Admin Page"
  },
  "error": {
    "title": "An Error Occurred",
    "message": "An unexpected error occurred. Please try again or contact administrator if the problem persists.",
    "goHome": "Go Home"
  },
  "months": {
    "JANUARY": "January",
    "FEBRUARY": "February",
    "MARCH": "March",
    "APRIL": "April",
    "MAY": "May",
    "JUNE": "June",
    "JULY": "July",
    "AUGUST": "August",
    "SEPTEMBER": "September",
    "OCTOBER": "October",
    "NOVEMBER": "November",
    "DECEMBER": "December"
  },
  "periods": {
    "Q1": "Quarter 1",
    "Q2": "Quarter 2",
    "Q3": "Quarter 3",
    "Q4": "Quarter 4",
    "SEM1": "Semester 1",
    "SEM2": "Semester 2"
  }
}
```

### Phase 3: Middleware Setup

Update Next.js middleware to handle locale detection:

```typescript
// src/middleware.ts
import createMiddleware from 'next-intl/middleware';
import { routing } from './i18n/routing';

export default createMiddleware(routing);

export const config = {
  matcher: ['/', '/(id|en)/:path*']
};
```

### Phase 4: Layout Integration

1. **Update root layout** for locale handling:
```typescript
// src/app/[locale]/layout.tsx
import { NextIntlClientProvider } from 'next-intl';
import { getMessages } from 'next-intl/server';

export default async function LocaleLayout({
  children,
  params: { locale }
}: {
  children: React.ReactNode;
  params: { locale: string };
}) {
  const messages = await getMessages();

  return (
    <NextIntlClientProvider messages={messages}>
      {children}
    </NextIntlClientProvider>
  );
}
```

### Phase 5: Component Updates

Update components to use translations:

```typescript
// Before
<Text>Memuat data...</Text>

// After
import { useTranslations } from 'next-intl';

function Component() {
  const t = useTranslations('common');
  return <Text>{t('loading')}</Text>;
}
```

### Phase 6: Language Switcher

Create a language switcher component:

```typescript
'use client';

import { useLocale } from 'next-intl';
import { useRouter, usePathname } from '@/i18n/navigation';
import { ActionIcon, Menu } from '@mantine/core';
import { IconLanguage } from '@tabler/icons-react';

export function LanguageSwitcher() {
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();

  const handleLocaleChange = (newLocale: string) => {
    router.replace(pathname, { locale: newLocale });
  };

  return (
    <Menu shadow="md" width={120}>
      <Menu.Target>
        <ActionIcon variant="subtle" size="lg">
          <IconLanguage size={20} />
        </ActionIcon>
      </Menu.Target>
      <Menu.Dropdown>
        <Menu.Item
          onClick={() => handleLocaleChange('id')}
          fw={locale === 'id' ? 700 : 400}
        >
          Indonesia
        </Menu.Item>
        <Menu.Item
          onClick={() => handleLocaleChange('en')}
          fw={locale === 'en' ? 700 : 400}
        >
          English
        </Menu.Item>
      </Menu.Dropdown>
    </Menu>
  );
}
```

## URL Structure

After implementation, URLs will be structured as:
- Indonesian: `/id/portal`, `/id/portal/payment`
- English: `/en/portal`, `/en/portal/payment`
- Default (Indonesian): `/portal` → redirects to `/id/portal`

## User Preference Storage

Store user language preference in:
1. Cookie (for server-side rendering)
2. LocalStorage (for persistence across sessions)

## Migration Checklist

1. [ ] Install `next-intl` package
2. [ ] Create i18n configuration files
3. [ ] Create translation JSON files
4. [ ] Update middleware for locale routing
5. [ ] Migrate route structure to `[locale]` pattern
6. [ ] Update all components to use `useTranslations`
7. [ ] Add language switcher to header
8. [ ] Test all pages in both languages
9. [ ] Update API error messages for i18n
10. [ ] Update date/number formatting

## Testing Considerations

- Test language switching without page reload
- Verify SEO tags update with locale
- Check right-to-left (RTL) support if needed in future
- Validate all translation keys are present
- Test deep links with locale prefix
