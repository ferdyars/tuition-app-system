const ROMAN_MAP: Record<number, string> = {
  1: "I",
  2: "II",
  3: "III",
  4: "IV",
  5: "V",
  6: "VI",
  7: "VII",
  8: "VIII",
  9: "IX",
  10: "X",
  11: "XI",
  12: "XII",
};

/**
 * Generate class name pattern: GRADE-SECTION-YEAR
 * Examples:
 * - Grade 1, Section A, Year 2024/2025 → I-A-2024/2025
 * - Grade 12, Section IPA, Year 2024/2025 → XII-IPA-2024/2025
 */
export function generateClassName(
  grade: number,
  section: string,
  academicYear: string,
): string {
  const romanGrade = ROMAN_MAP[grade] || String(grade);
  return `${romanGrade}-${section}-${academicYear}`;
}
