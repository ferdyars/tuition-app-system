# Internationalization (i18n) - Backend

## Overview

This document outlines the implementation plan for adding multi-language support to the API backend. The system will support:
- **Indonesian (id)** - Default language
- **English (en)** - Secondary language

## Approach

Unlike the frontend which uses a dedicated i18n library, the backend will use a simpler approach:
1. Custom translation utility functions
2. Accept-Language header detection
3. Centralized message constants

## File Structure

```
src/
├── lib/
│   └── i18n/
│       ├── index.ts           # Main i18n utilities
│       ├── messages/
│       │   ├── id.ts          # Indonesian messages
│       │   └── en.ts          # English messages
│       └── types.ts           # Type definitions
```

## Implementation

### Phase 1: Core Utilities

1. **Type definitions** (`src/lib/i18n/types.ts`):
```typescript
export type Locale = 'id' | 'en';

export interface Messages {
  auth: {
    invalidCredentials: string;
    unauthorized: string;
    tokenExpired: string;
    forbidden: string;
    accountLocked: string;
    passwordChanged: string;
  };
  validation: {
    required: (field: string) => string;
    invalid: (field: string) => string;
    tooShort: (field: string, min: number) => string;
    tooLong: (field: string, max: number) => string;
    mustBeNumber: (field: string) => string;
    mustBePositive: (field: string) => string;
    mustBeDate: (field: string) => string;
  };
  student: {
    notFound: string;
    alreadyExists: string;
    nisAlreadyUsed: string;
    imported: (count: number) => string;
    importFailed: (row: number, reason: string) => string;
  };
  tuition: {
    notFound: string;
    alreadyPaid: string;
    periodExists: string;
    generated: (count: number) => string;
  };
  payment: {
    notFound: string;
    alreadyVerified: string;
    expired: string;
    cancelled: string;
    activeExists: string;
    created: string;
    verified: string;
    cancelSuccess: string;
    invalidAmount: string;
    bankRequired: string;
    tuitionRequired: string;
  };
  bankAccount: {
    notFound: string;
    alreadyExists: string;
    cannotDelete: string;
  };
  rateLimit: {
    exceeded: string;
    tryAfter: (seconds: number) => string;
  };
  server: {
    internalError: string;
    serviceUnavailable: string;
    databaseError: string;
  };
  success: {
    created: string;
    updated: string;
    deleted: string;
    fetched: string;
  };
}

export type MessageKey = keyof Messages;
```

2. **Indonesian messages** (`src/lib/i18n/messages/id.ts`):
```typescript
import type { Messages } from '../types';

export const messagesId: Messages = {
  auth: {
    invalidCredentials: 'Username atau password salah',
    unauthorized: 'Anda harus login terlebih dahulu',
    tokenExpired: 'Sesi Anda telah berakhir, silakan login kembali',
    forbidden: 'Anda tidak memiliki akses ke resource ini',
    accountLocked: 'Akun Anda dikunci, hubungi administrator',
    passwordChanged: 'Password berhasil diubah',
  },
  validation: {
    required: (field) => `${field} wajib diisi`,
    invalid: (field) => `${field} tidak valid`,
    tooShort: (field, min) => `${field} minimal ${min} karakter`,
    tooLong: (field, max) => `${field} maksimal ${max} karakter`,
    mustBeNumber: (field) => `${field} harus berupa angka`,
    mustBePositive: (field) => `${field} harus lebih dari 0`,
    mustBeDate: (field) => `${field} harus berupa tanggal yang valid`,
  },
  student: {
    notFound: 'Siswa tidak ditemukan',
    alreadyExists: 'Siswa sudah terdaftar',
    nisAlreadyUsed: 'NIS sudah digunakan',
    imported: (count) => `Berhasil mengimport ${count} siswa`,
    importFailed: (row, reason) => `Baris ${row}: ${reason}`,
  },
  tuition: {
    notFound: 'Tagihan tidak ditemukan',
    alreadyPaid: 'Tagihan sudah lunas',
    periodExists: 'Tagihan untuk periode ini sudah ada',
    generated: (count) => `Berhasil membuat ${count} tagihan`,
  },
  payment: {
    notFound: 'Transaksi tidak ditemukan',
    alreadyVerified: 'Transaksi sudah diverifikasi',
    expired: 'Transaksi sudah kadaluarsa',
    cancelled: 'Transaksi sudah dibatalkan',
    activeExists: 'Anda masih memiliki transaksi yang sedang berjalan. Selesaikan atau batalkan terlebih dahulu.',
    created: 'Pembayaran berhasil dibuat',
    verified: 'Pembayaran berhasil diverifikasi',
    cancelSuccess: 'Pembayaran berhasil dibatalkan',
    invalidAmount: 'Nominal pembayaran tidak valid',
    bankRequired: 'Pilih bank tujuan transfer',
    tuitionRequired: 'Pilih minimal satu tagihan',
  },
  bankAccount: {
    notFound: 'Rekening bank tidak ditemukan',
    alreadyExists: 'Rekening dengan nomor ini sudah terdaftar',
    cannotDelete: 'Tidak dapat menghapus rekening yang sedang digunakan',
  },
  rateLimit: {
    exceeded: 'Terlalu banyak permintaan',
    tryAfter: (seconds) => `Coba lagi dalam ${seconds} detik`,
  },
  server: {
    internalError: 'Terjadi kesalahan pada server',
    serviceUnavailable: 'Layanan sedang tidak tersedia',
    databaseError: 'Terjadi kesalahan pada database',
  },
  success: {
    created: 'Data berhasil dibuat',
    updated: 'Data berhasil diperbarui',
    deleted: 'Data berhasil dihapus',
    fetched: 'Data berhasil diambil',
  },
};
```

3. **English messages** (`src/lib/i18n/messages/en.ts`):
```typescript
import type { Messages } from '../types';

export const messagesEn: Messages = {
  auth: {
    invalidCredentials: 'Invalid username or password',
    unauthorized: 'Please login first',
    tokenExpired: 'Your session has expired, please login again',
    forbidden: 'You do not have access to this resource',
    accountLocked: 'Your account is locked, contact administrator',
    passwordChanged: 'Password changed successfully',
  },
  validation: {
    required: (field) => `${field} is required`,
    invalid: (field) => `${field} is invalid`,
    tooShort: (field, min) => `${field} must be at least ${min} characters`,
    tooLong: (field, max) => `${field} must be at most ${max} characters`,
    mustBeNumber: (field) => `${field} must be a number`,
    mustBePositive: (field) => `${field} must be greater than 0`,
    mustBeDate: (field) => `${field} must be a valid date`,
  },
  student: {
    notFound: 'Student not found',
    alreadyExists: 'Student already exists',
    nisAlreadyUsed: 'NIS is already in use',
    imported: (count) => `Successfully imported ${count} students`,
    importFailed: (row, reason) => `Row ${row}: ${reason}`,
  },
  tuition: {
    notFound: 'Tuition record not found',
    alreadyPaid: 'Tuition is already paid',
    periodExists: 'Tuition for this period already exists',
    generated: (count) => `Successfully generated ${count} tuition records`,
  },
  payment: {
    notFound: 'Transaction not found',
    alreadyVerified: 'Transaction is already verified',
    expired: 'Transaction has expired',
    cancelled: 'Transaction has been cancelled',
    activeExists: 'You already have an ongoing transaction. Please complete or cancel it first.',
    created: 'Payment created successfully',
    verified: 'Payment verified successfully',
    cancelSuccess: 'Payment cancelled successfully',
    invalidAmount: 'Invalid payment amount',
    bankRequired: 'Please select a bank account',
    tuitionRequired: 'Please select at least one tuition',
  },
  bankAccount: {
    notFound: 'Bank account not found',
    alreadyExists: 'Account with this number already exists',
    cannotDelete: 'Cannot delete account that is currently in use',
  },
  rateLimit: {
    exceeded: 'Too many requests',
    tryAfter: (seconds) => `Try again in ${seconds} seconds`,
  },
  server: {
    internalError: 'Internal server error',
    serviceUnavailable: 'Service temporarily unavailable',
    databaseError: 'Database error occurred',
  },
  success: {
    created: 'Data created successfully',
    updated: 'Data updated successfully',
    deleted: 'Data deleted successfully',
    fetched: 'Data fetched successfully',
  },
};
```

4. **Main i18n utility** (`src/lib/i18n/index.ts`):
```typescript
import { messagesId } from './messages/id';
import { messagesEn } from './messages/en';
import type { Locale, Messages } from './types';

const messages: Record<Locale, Messages> = {
  id: messagesId,
  en: messagesEn,
};

const DEFAULT_LOCALE: Locale = 'id';

/**
 * Get locale from Accept-Language header
 */
export function getLocaleFromHeader(acceptLanguage?: string | null): Locale {
  if (!acceptLanguage) return DEFAULT_LOCALE;

  // Parse Accept-Language header
  const languages = acceptLanguage
    .split(',')
    .map((lang) => {
      const [code, priority] = lang.trim().split(';q=');
      return {
        code: code.split('-')[0].toLowerCase(),
        priority: priority ? parseFloat(priority) : 1,
      };
    })
    .sort((a, b) => b.priority - a.priority);

  // Find first supported locale
  for (const lang of languages) {
    if (lang.code === 'id' || lang.code === 'en') {
      return lang.code as Locale;
    }
  }

  return DEFAULT_LOCALE;
}

/**
 * Get locale from Next.js request
 */
export function getLocaleFromRequest(request: Request): Locale {
  return getLocaleFromHeader(request.headers.get('Accept-Language'));
}

/**
 * Get messages for a specific locale
 */
export function getMessages(locale: Locale = DEFAULT_LOCALE): Messages {
  return messages[locale] || messages[DEFAULT_LOCALE];
}

/**
 * Create a translation function for a specific locale
 */
export function createT(locale: Locale = DEFAULT_LOCALE) {
  const m = getMessages(locale);
  return m;
}

// Re-export types
export type { Locale, Messages } from './types';
```

### Phase 2: API Integration

1. **Update API response helper** (`src/lib/api-response.ts`):
```typescript
import { getLocaleFromRequest, createT, type Locale } from './i18n';

interface ErrorResponseOptions {
  locale?: Locale;
  request?: Request;
}

export function errorResponse(
  message: string,
  code: string = 'ERROR',
  status: number = 400,
  options?: ErrorResponseOptions
) {
  // Get locale from options or use default
  const locale = options?.locale ||
    (options?.request ? getLocaleFromRequest(options.request) : 'id');

  return Response.json(
    {
      success: false,
      error: { message, code },
    },
    { status }
  );
}

// Helper to create localized error response
export function localizedErrorResponse(
  getMessage: (t: ReturnType<typeof createT>) => string,
  code: string = 'ERROR',
  status: number = 400,
  request?: Request
) {
  const locale = request ? getLocaleFromRequest(request) : 'id';
  const t = createT(locale);
  const message = getMessage(t);

  return Response.json(
    {
      success: false,
      error: { message, code },
    },
    { status }
  );
}
```

2. **Usage in API routes**:
```typescript
// Before
return errorResponse('Siswa tidak ditemukan', 'STUDENT_NOT_FOUND', 404);

// After
import { localizedErrorResponse } from '@/lib/api-response';
import { getLocaleFromRequest, createT } from '@/lib/i18n';

export async function GET(request: Request) {
  const t = createT(getLocaleFromRequest(request));

  const student = await findStudent(id);
  if (!student) {
    return localizedErrorResponse(
      (t) => t.student.notFound,
      'STUDENT_NOT_FOUND',
      404,
      request
    );
  }

  // Or simpler approach
  if (!student) {
    return errorResponse(t.student.notFound, 'STUDENT_NOT_FOUND', 404);
  }
}
```

### Phase 3: Validation Messages

1. **Create validation helper with i18n**:
```typescript
import { createT, type Locale } from '@/lib/i18n';

export function validateWithLocale<T>(
  data: unknown,
  schema: z.ZodSchema<T>,
  locale: Locale = 'id'
): { success: true; data: T } | { success: false; errors: string[] } {
  const t = createT(locale);

  try {
    const result = schema.parse(data);
    return { success: true, data: result };
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errors = error.errors.map((e) => {
        const field = e.path.join('.');
        switch (e.code) {
          case 'invalid_type':
            if (e.expected === 'number') return t.validation.mustBeNumber(field);
            return t.validation.invalid(field);
          case 'too_small':
            if (e.type === 'string') return t.validation.tooShort(field, e.minimum as number);
            return t.validation.mustBePositive(field);
          case 'too_big':
            return t.validation.tooLong(field, e.maximum as number);
          default:
            return t.validation.invalid(field);
        }
      });
      return { success: false, errors };
    }
    throw error;
  }
}
```

### Phase 4: Email/WhatsApp Templates

1. **Localized notification templates**:
```typescript
// src/lib/services/whatsapp-templates.ts
import type { Locale } from '@/lib/i18n/types';

interface PaymentVerifiedParams {
  studentName: string;
  period: string;
  year: number;
  amount: number;
}

const templates: Record<Locale, {
  paymentVerified: (params: PaymentVerifiedParams) => string;
  paymentReminder: (params: PaymentReminderParams) => string;
}> = {
  id: {
    paymentVerified: ({ studentName, period, year, amount }) =>
      `*PEMBAYARAN BERHASIL*\n\n` +
      `Pembayaran SPP untuk:\n` +
      `Nama: ${studentName}\n` +
      `Periode: ${period} ${year}\n` +
      `Nominal: Rp ${amount.toLocaleString('id-ID')}\n\n` +
      `Terima kasih atas pembayaran Anda.`,
    paymentReminder: ({ studentName, period, dueDate, amount }) =>
      `*PENGINGAT PEMBAYARAN SPP*\n\n` +
      `Yth. Orang Tua/Wali ${studentName}\n\n` +
      `Pembayaran SPP periode ${period} akan jatuh tempo pada ${dueDate}.\n` +
      `Nominal: Rp ${amount.toLocaleString('id-ID')}\n\n` +
      `Mohon segera lakukan pembayaran. Terima kasih.`,
  },
  en: {
    paymentVerified: ({ studentName, period, year, amount }) =>
      `*PAYMENT SUCCESSFUL*\n\n` +
      `School fee payment for:\n` +
      `Name: ${studentName}\n` +
      `Period: ${period} ${year}\n` +
      `Amount: Rp ${amount.toLocaleString('id-ID')}\n\n` +
      `Thank you for your payment.`,
    paymentReminder: ({ studentName, period, dueDate, amount }) =>
      `*SCHOOL FEE REMINDER*\n\n` +
      `Dear Parent/Guardian of ${studentName}\n\n` +
      `School fee payment for ${period} is due on ${dueDate}.\n` +
      `Amount: Rp ${amount.toLocaleString('id-ID')}\n\n` +
      `Please make the payment soon. Thank you.`,
  },
};

export function getWhatsAppTemplate(
  locale: Locale,
  template: keyof typeof templates['id']
) {
  return templates[locale]?.[template] || templates['id'][template];
}
```

## Date and Number Formatting

1. **Localized formatters**:
```typescript
// src/lib/i18n/formatters.ts
import type { Locale } from './types';

const localeMap: Record<Locale, string> = {
  id: 'id-ID',
  en: 'en-US',
};

export function formatCurrency(amount: number, locale: Locale = 'id'): string {
  return new Intl.NumberFormat(localeMap[locale], {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatDate(
  date: Date | string,
  locale: Locale = 'id',
  options?: Intl.DateTimeFormatOptions
): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return dateObj.toLocaleDateString(localeMap[locale], {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    ...options,
  });
}

export function formatDateTime(
  date: Date | string,
  locale: Locale = 'id'
): string {
  return formatDate(date, locale, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}
```

## Migration Checklist

1. [ ] Create i18n directory structure
2. [ ] Implement type definitions
3. [ ] Create Indonesian message constants
4. [ ] Create English message constants
5. [ ] Implement locale detection from headers
6. [ ] Update errorResponse helper for i18n
7. [ ] Migrate hardcoded strings in API routes
8. [ ] Update validation error messages
9. [ ] Localize WhatsApp notification templates
10. [ ] Add date/number formatters
11. [ ] Update PDF generation for both languages
12. [ ] Test all API endpoints with Accept-Language header

## Testing

Test API responses with different Accept-Language headers:

```bash
# Indonesian (default)
curl -H "Accept-Language: id" /api/v1/student/tuitions

# English
curl -H "Accept-Language: en" /api/v1/student/tuitions

# Mixed (should use first supported)
curl -H "Accept-Language: fr,en;q=0.9,id;q=0.8" /api/v1/student/tuitions
```

## Notes

- Currency is always in IDR regardless of locale
- Dates follow locale-specific formatting
- Error codes remain constant across locales (for debugging)
- Consider storing user's preferred locale in database for notifications
