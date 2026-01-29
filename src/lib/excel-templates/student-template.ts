import { createExcelTemplate } from "../excel-utils";

export function createStudentTemplate() {
  return createExcelTemplate({
    sheetName: "Students",
    columns: [
      { header: "NIS", key: "NIS", width: 15 },
      { header: "NIK", key: "NIK", width: 20 },
      { header: "Student Name", key: "Student Name", width: 25 },
      { header: "Address", key: "Address", width: 40 },
      { header: "Parent Name", key: "Parent Name", width: 25 },
      { header: "Parent Phone", key: "Parent Phone", width: 15 },
      { header: "Start Join Date", key: "Start Join Date", width: 15 },
    ],
    data: [
      {
        NIS: "2024001",
        NIK: "3578123456789012",
        "Student Name": "Ahmad Rizki",
        Address: "Jl. Merdeka No. 123",
        "Parent Name": "Budi Santoso",
        "Parent Phone": "081234567890",
        "Start Join Date": "2024-07-01",
      },
    ],
  });
}
