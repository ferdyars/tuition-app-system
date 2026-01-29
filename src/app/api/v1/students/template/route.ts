import { requireRole } from "@/lib/api-auth";
import { createStudentTemplate } from "@/lib/excel-templates/student-template";
import { workbookToBuffer } from "@/lib/excel-utils";
import { NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  const auth = await requireRole(request, ["ADMIN"]);
  if (auth instanceof Response) return auth;

  const workbook = createStudentTemplate();
  const buffer = workbookToBuffer(workbook);

  return new Response(buffer, {
    headers: {
      "Content-Type":
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition":
        'attachment; filename="student-import-template.xlsx"',
    },
  });
}
