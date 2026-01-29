import * as XLSX from "xlsx";
import {
  getPeriodDisplayName,
  PERIODS,
} from "../business-logic/tuition-generator";

export interface DiscountExcelRow {
  Name: string;
  Description?: string;
  Reason?: string;
  "Discount Amount": number;
  "Target Periods": string; // Comma-separated: "JULY,AUGUST" or "Q1,Q2" or "SEM1"
  "Academic Year": string; // e.g., "2024/2025"
  Class?: string; // Optional - empty means school-wide
}

export function createDiscountTemplate(
  academicYears: Array<{ id: string; year: string }>,
  classes: Array<{
    id: string;
    className: string;
    academicYear: { year: string };
  }>,
): XLSX.WorkBook {
  const workbook = XLSX.utils.book_new();

  // Create main data sheet
  const headers = [
    "Name",
    "Description",
    "Reason",
    "Discount Amount",
    "Target Periods",
    "Academic Year",
    "Class",
  ];
  const wsData: (string | number)[][] = [headers];

  // Add sample rows
  if (academicYears.length > 0) {
    // Sample 1: School-wide discount for Q2
    wsData.push([
      "COVID Relief Q2",
      "COVID-19 tuition relief program",
      "COVID Relief",
      100000,
      "Q2",
      academicYears[0].year,
      "", // Empty = school-wide
    ]);

    // Sample 2: Class-specific discount for specific months
    if (classes.length > 0) {
      wsData.push([
        "Class Discount Jul-Aug",
        "Special discount for specific class",
        "School Support",
        50000,
        "JULY,AUGUST",
        academicYears[0].year,
        classes[0].className,
      ]);
    }
  }

  // Add empty rows for user input
  for (let i = 0; i < 98; i++) {
    wsData.push(["", "", "", "", "", "", ""]);
  }

  const worksheet = XLSX.utils.aoa_to_sheet(wsData);

  // Set column widths
  worksheet["!cols"] = [
    { wch: 25 }, // Name
    { wch: 35 }, // Description
    { wch: 20 }, // Reason
    { wch: 18 }, // Discount Amount
    { wch: 30 }, // Target Periods
    { wch: 15 }, // Academic Year
    { wch: 25 }, // Class
  ];

  XLSX.utils.book_append_sheet(workbook, worksheet, "Discounts");

  // Create reference sheet for periods
  const allPeriods = [
    ...PERIODS.MONTHLY.map((p) => ({
      period: p,
      type: "Monthly",
      display: getPeriodDisplayName(p),
    })),
    ...PERIODS.QUARTERLY.map((p) => ({
      period: p,
      type: "Quarterly",
      display: getPeriodDisplayName(p),
    })),
    ...PERIODS.SEMESTER.map((p) => ({
      period: p,
      type: "Semester",
      display: getPeriodDisplayName(p),
    })),
  ];

  const periodData: string[][] = [["Period Code", "Type", "Display Name"]];
  for (const p of allPeriods) {
    periodData.push([p.period, p.type, p.display]);
  }
  const periodSheet = XLSX.utils.aoa_to_sheet(periodData);
  periodSheet["!cols"] = [{ wch: 15 }, { wch: 12 }, { wch: 25 }];
  XLSX.utils.book_append_sheet(workbook, periodSheet, "Periods Reference");

  // Create reference sheet for academic years
  const yearData: string[][] = [["Academic Year"]];
  for (const ay of academicYears) {
    yearData.push([ay.year]);
  }
  const yearSheet = XLSX.utils.aoa_to_sheet(yearData);
  yearSheet["!cols"] = [{ wch: 15 }];
  XLSX.utils.book_append_sheet(workbook, yearSheet, "Academic Years Reference");

  // Create reference sheet for classes
  const classData: string[][] = [["Class Name", "Academic Year"]];
  for (const c of classes) {
    classData.push([c.className, c.academicYear.year]);
  }
  const classSheet = XLSX.utils.aoa_to_sheet(classData);
  classSheet["!cols"] = [{ wch: 25 }, { wch: 15 }];
  XLSX.utils.book_append_sheet(workbook, classSheet, "Classes Reference");

  return workbook;
}

export interface ValidatedDiscountRow {
  name: string;
  description: string | null;
  reason: string | null;
  discountAmount: number;
  targetPeriods: string[];
  academicYear: string;
  className: string | null; // null = school-wide
}

// All valid period codes
const ALL_VALID_PERIODS: readonly string[] = [
  ...PERIODS.MONTHLY,
  ...PERIODS.QUARTERLY,
  ...PERIODS.SEMESTER,
];

export function validateDiscountData(
  data: DiscountExcelRow[],
  validAcademicYears: string[],
  validClassNames: string[],
): {
  valid: ValidatedDiscountRow[];
  errors: Array<{ row: number; errors: string[] }>;
} {
  const valid: ValidatedDiscountRow[] = [];
  const errors: Array<{ row: number; errors: string[] }> = [];

  data.forEach((row, index) => {
    const rowErrors: string[] = [];
    const rowNum = index + 2; // +2 for header row and 0-index

    // Skip empty rows
    if (!row.Name && !row["Discount Amount"] && !row["Target Periods"]) {
      return;
    }

    // Validate Name
    const name = String(row.Name || "").trim();
    if (!name) {
      rowErrors.push("Name is required");
    }

    // Validate Discount Amount
    const discountAmount = Number(row["Discount Amount"]);
    if (!row["Discount Amount"] && row["Discount Amount"] !== 0) {
      rowErrors.push("Discount Amount is required");
    } else if (Number.isNaN(discountAmount) || discountAmount <= 0) {
      rowErrors.push("Discount Amount must be a positive number");
    }

    // Validate Target Periods
    const periodsStr = String(row["Target Periods"] || "").trim();
    if (!periodsStr) {
      rowErrors.push("Target Periods is required");
    }

    const targetPeriods: string[] = [];
    if (periodsStr) {
      const periods = periodsStr.split(",").map((p) => p.trim().toUpperCase());
      for (const period of periods) {
        if (!ALL_VALID_PERIODS.includes(period)) {
          rowErrors.push(
            `Invalid period "${period}". Valid: ${ALL_VALID_PERIODS.join(", ")}`,
          );
        } else {
          targetPeriods.push(period);
        }
      }
      if (periods.length > 0 && targetPeriods.length === 0) {
        rowErrors.push("At least one valid target period is required");
      }
    }

    // Validate Academic Year
    const academicYear = String(row["Academic Year"] || "").trim();
    if (!academicYear) {
      rowErrors.push("Academic Year is required");
    } else if (!validAcademicYears.includes(academicYear)) {
      rowErrors.push(`Academic Year "${academicYear}" not found`);
    }

    // Validate Class (optional - empty means school-wide)
    const className = String(row.Class || "").trim() || null;
    if (className && !validClassNames.includes(className)) {
      rowErrors.push(`Class "${className}" not found`);
    }

    if (rowErrors.length > 0) {
      errors.push({ row: rowNum, errors: rowErrors });
    } else {
      valid.push({
        name,
        description: String(row.Description || "").trim() || null,
        reason: String(row.Reason || "").trim() || null,
        discountAmount,
        targetPeriods,
        academicYear,
        className,
      });
    }
  });

  return { valid, errors };
}
