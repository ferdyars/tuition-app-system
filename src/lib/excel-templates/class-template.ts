import { createExcelTemplate } from "../excel-utils";

export function createClassTemplate(academicYears: string[]) {
  return createExcelTemplate({
    sheetName: "Classes",
    columns: [
      { header: "Academic Year", key: "Academic Year", width: 20 },
      { header: "Grade", key: "Grade", width: 10 },
      { header: "Section", key: "Section", width: 15 },
    ],
    data: [
      {
        "Academic Year": academicYears[0] || "2024/2025",
        Grade: 12,
        Section: "IPA",
      },
      {
        "Academic Year": academicYears[0] || "2024/2025",
        Grade: 12,
        Section: "IPS",
      },
    ],
  });
}
