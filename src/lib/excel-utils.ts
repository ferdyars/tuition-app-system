import * as XLSX from "xlsx";

export interface ExcelColumn {
  header: string;
  key: string;
  width?: number;
}

export interface ExcelTemplate {
  sheetName: string;
  columns: ExcelColumn[];
  data?: Record<string, unknown>[];
}

export function createExcelTemplate(template: ExcelTemplate): XLSX.WorkBook {
  const workbook = XLSX.utils.book_new();
  const wsData: unknown[][] = [];

  const headers = template.columns.map((col) => col.header);
  wsData.push(headers);

  if (template.data && template.data.length > 0) {
    for (const row of template.data) {
      const rowData = template.columns.map((col) => row[col.key] || "");
      wsData.push(rowData);
    }
  }

  const worksheet = XLSX.utils.aoa_to_sheet(wsData);

  worksheet["!cols"] = template.columns.map((col) => ({
    wch: col.width || 20,
  }));

  XLSX.utils.book_append_sheet(workbook, worksheet, template.sheetName);
  return workbook;
}

export function downloadExcel(workbook: XLSX.WorkBook, filename: string) {
  XLSX.writeFile(workbook, filename);
}

export function readExcelBuffer<T = Record<string, unknown>>(
  buffer: ArrayBuffer,
): { data: T[]; errors: string[] } {
  const workbook = XLSX.read(buffer, { type: "array" });
  const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
  const jsonData = XLSX.utils.sheet_to_json<T>(firstSheet, {
    raw: false,
    defval: "",
  });

  const errors: string[] = [];
  if (jsonData.length === 0) {
    errors.push("Excel file is empty");
  }

  return { data: jsonData, errors };
}

export function exportToExcel<T extends Record<string, unknown>>(
  data: T[],
  filename: string,
  sheetName = "Sheet1",
) {
  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
  XLSX.writeFile(workbook, filename);
}

export function workbookToBuffer(workbook: XLSX.WorkBook): ArrayBuffer {
  const uint8 = XLSX.write(workbook, {
    type: "array",
    bookType: "xlsx",
  }) as ArrayBuffer;
  return uint8;
}
