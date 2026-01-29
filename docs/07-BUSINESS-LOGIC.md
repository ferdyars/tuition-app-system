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
