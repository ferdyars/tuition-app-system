import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/api-auth";
import { successResponse, errorResponse } from "@/lib/api-response";
import { readExcelBuffer } from "@/lib/excel-utils";

interface StudentRow {
  NIS: string;
  NIK: string;
  "Student Name": string;
  Address: string;
  "Parent Name": string;
  "Parent Phone": string;
  "Start Join Date": string;
}

export async function POST(request: NextRequest) {
  const auth = await requireRole(request, ["ADMIN"]);
  if (auth instanceof Response) return auth;

  try {
    const formData = await request.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return errorResponse("File is required", "VALIDATION_ERROR", 400);
    }

    const buffer = await file.arrayBuffer();
    const { data, errors: readErrors } = readExcelBuffer<StudentRow>(buffer);

    if (readErrors.length > 0) {
      return errorResponse(readErrors.join(", "), "VALIDATION_ERROR", 400);
    }

    let imported = 0;
    let updated = 0;
    const errors: Array<{ row: number; nis: string; error: string }> = [];

    for (let i = 0; i < data.length; i++) {
      const row = data[i];
      const rowNum = i + 2;

      if (!row.NIS || !row.NIK || !row["Student Name"]) {
        errors.push({
          row: rowNum,
          nis: row.NIS || "",
          error: "Missing required fields",
        });
        continue;
      }

      try {
        const existing = await prisma.student.findUnique({
          where: { nis: row.NIS },
        });

        if (existing) {
          await prisma.student.update({
            where: { nis: row.NIS },
            data: {
              nik: row.NIK,
              name: row["Student Name"],
              address: row.Address,
              parentName: row["Parent Name"],
              parentPhone: row["Parent Phone"],
              startJoinDate: new Date(row["Start Join Date"]),
            },
          });
          updated++;
        } else {
          await prisma.student.create({
            data: {
              nis: row.NIS,
              nik: row.NIK,
              name: row["Student Name"],
              address: row.Address,
              parentName: row["Parent Name"],
              parentPhone: row["Parent Phone"],
              startJoinDate: new Date(row["Start Join Date"]),
            },
          });
          imported++;
        }
      } catch (err) {
        errors.push({
          row: rowNum,
          nis: row.NIS,
          error: err instanceof Error ? err.message : "Unknown error",
        });
      }
    }

    return successResponse({ imported, updated, errors });
  } catch (error) {
    console.error("Import students error:", error);
    return errorResponse("Failed to import students", "SERVER_ERROR", 500);
  }
}
