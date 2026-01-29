import type { Month } from "@/generated/prisma/client";

export interface TuitionGenerationParams {
  classAcademicId: string;
  feeAmount: number;
  students: Array<{
    nis: string;
    startJoinDate: Date;
  }>;
  academicYear: {
    startDate: Date;
    endDate: Date;
  };
}

export interface GeneratedTuition {
  classAcademicId: string;
  studentNis: string;
  month: Month;
  year: number;
  feeAmount: number;
  dueDate: Date;
  status: "UNPAID";
}

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

const NUMBER_TO_MONTH: Record<number, Month> = {
  1: "JANUARY",
  2: "FEBRUARY",
  3: "MARCH",
  4: "APRIL",
  5: "MAY",
  6: "JUNE",
  7: "JULY",
  8: "AUGUST",
  9: "SEPTEMBER",
  10: "OCTOBER",
  11: "NOVEMBER",
  12: "DECEMBER",
};

/**
 * Generate tuitions for students based on their join date
 */
export function generateTuitions(
  params: TuitionGenerationParams,
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
  const {
    classAcademicId,
    feeAmount,
    studentNis,
    startJoinDate,
    academicYear,
  } = params;

  const tuitions: GeneratedTuition[] = [];

  const monthsToGenerate = getMonthsToGenerate(
    startJoinDate,
    academicYear.startDate,
    academicYear.endDate,
  );

  monthsToGenerate.forEach(({ month, year }) => {
    tuitions.push({
      classAcademicId,
      studentNis,
      month,
      year,
      feeAmount,
      dueDate: getDueDate(month, year),
      status: "UNPAID",
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
 */
function getMonthsToGenerate(
  startJoinDate: Date,
  academicStart: Date,
  academicEnd: Date,
): Array<{ month: Month; year: number }> {
  // If student joined before academic year starts, include all months
  if (startJoinDate <= academicStart) {
    return generateAllAcademicMonths(academicStart, academicEnd);
  }

  // If student joined after academic year ends, no tuitions
  if (startJoinDate > academicEnd) {
    return [];
  }

  // Student joined mid-year - generate from join month to end of academic year
  const months: Array<{ month: Month; year: number }> = [];
  const currentDate = new Date(
    startJoinDate.getFullYear(),
    startJoinDate.getMonth(),
    1,
  );
  const endDate = new Date(academicEnd);

  while (currentDate <= endDate) {
    const monthNumber = currentDate.getMonth() + 1;
    const month = NUMBER_TO_MONTH[monthNumber];
    const year = currentDate.getFullYear();

    months.push({ month, year });

    currentDate.setMonth(currentDate.getMonth() + 1);
  }

  return months;
}

/**
 * Generate all months in an academic year (July - June)
 */
function generateAllAcademicMonths(
  academicStart: Date,
  academicEnd: Date,
): Array<{ month: Month; year: number }> {
  const months: Array<{ month: Month; year: number }> = [];
  const currentDate = new Date(academicStart);

  while (currentDate <= academicEnd) {
    const monthNumber = currentDate.getMonth() + 1;
    const month = NUMBER_TO_MONTH[monthNumber];
    const year = currentDate.getFullYear();

    months.push({ month, year });

    currentDate.setMonth(currentDate.getMonth() + 1);
  }

  return months;
}

/**
 * Get due date for tuition (10th of each month)
 */
function getDueDate(month: Month, year: number): Date {
  const monthNumber = MONTH_TO_NUMBER[month];
  return new Date(year, monthNumber - 1, 10);
}

/**
 * Calculate total tuition for a student in an academic year
 */
export function calculateTotalTuition(
  feeAmount: number,
  startJoinDate: Date,
  academicYear: { startDate: Date; endDate: Date },
): { total: number; months: number } {
  const months = getMonthsToGenerate(
    startJoinDate,
    academicYear.startDate,
    academicYear.endDate,
  );

  return {
    total: feeAmount * months.length,
    months: months.length,
  };
}

/**
 * Get month display name
 */
export function getMonthDisplayName(month: Month): string {
  const displayNames: Record<Month, string> = {
    JANUARY: "January",
    FEBRUARY: "February",
    MARCH: "March",
    APRIL: "April",
    MAY: "May",
    JUNE: "June",
    JULY: "July",
    AUGUST: "August",
    SEPTEMBER: "September",
    OCTOBER: "October",
    NOVEMBER: "November",
    DECEMBER: "December",
  };
  return displayNames[month];
}

/**
 * Academic year month order (July to June)
 */
export const ACADEMIC_MONTH_ORDER: Month[] = [
  "JULY",
  "AUGUST",
  "SEPTEMBER",
  "OCTOBER",
  "NOVEMBER",
  "DECEMBER",
  "JANUARY",
  "FEBRUARY",
  "MARCH",
  "APRIL",
  "MAY",
  "JUNE",
];
