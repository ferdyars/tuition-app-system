import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/api-auth";
import { successResponse, errorResponse } from "@/lib/api-response";
import { generateTuitions } from "@/lib/business-logic/tuition-generator";

interface ClassConfig {
  classAcademicId: string;
  feeAmount: number;
  studentNisList?: string[];
}

export async function POST(request: NextRequest) {
  const auth = await requireRole(request, ["ADMIN"]);
  if (auth instanceof Response) return auth;

  try {
    const body = await request.json();
    const { classes } = body as { classes: ClassConfig[] };

    if (!classes || !Array.isArray(classes) || classes.length === 0) {
      return errorResponse(
        "At least one class configuration is required",
        "VALIDATION_ERROR",
        400
      );
    }

    const results: Array<{
      classAcademicId: string;
      className: string;
      generated: number;
      skipped: number;
      error?: string;
    }> = [];

    let totalGenerated = 0;
    let totalSkipped = 0;

    for (const classConfig of classes) {
      const { classAcademicId, feeAmount, studentNisList } = classConfig;

      if (!classAcademicId || !feeAmount) {
        results.push({
          classAcademicId: classAcademicId || "unknown",
          className: "unknown",
          generated: 0,
          skipped: 0,
          error: "Class ID and fee amount are required",
        });
        continue;
      }

      // Get class with academic year
      const classAcademic = await prisma.classAcademic.findUnique({
        where: { id: classAcademicId },
        include: { academicYear: true },
      });

      if (!classAcademic) {
        results.push({
          classAcademicId,
          className: "unknown",
          generated: 0,
          skipped: 0,
          error: "Class not found",
        });
        continue;
      }

      // Get students
      let students;
      if (studentNisList && studentNisList.length > 0) {
        students = await prisma.student.findMany({
          where: { nis: { in: studentNisList } },
          select: { nis: true, startJoinDate: true },
        });
      } else {
        students = await prisma.student.findMany({
          select: { nis: true, startJoinDate: true },
        });
      }

      if (students.length === 0) {
        results.push({
          classAcademicId,
          className: classAcademic.className,
          generated: 0,
          skipped: 0,
          error: "No students found",
        });
        continue;
      }

      // Generate tuitions
      const tuitionsToCreate = generateTuitions({
        classAcademicId,
        feeAmount,
        students: students.map((s) => ({
          nis: s.nis,
          startJoinDate: s.startJoinDate,
        })),
        academicYear: {
          startDate: classAcademic.academicYear.startDate,
          endDate: classAcademic.academicYear.endDate,
        },
      });

      // Check for existing tuitions
      const existingTuitions = await prisma.tuition.findMany({
        where: {
          classAcademicId,
          studentNis: { in: students.map((s) => s.nis) },
        },
        select: { studentNis: true, month: true, year: true },
      });

      const existingKeys = new Set(
        existingTuitions.map((t) => `${t.studentNis}-${t.month}-${t.year}`)
      );

      const newTuitions = tuitionsToCreate.filter(
        (t) => !existingKeys.has(`${t.studentNis}-${t.month}-${t.year}`)
      );

      const skippedCount = tuitionsToCreate.length - newTuitions.length;

      // Create new tuitions
      if (newTuitions.length > 0) {
        await prisma.tuition.createMany({
          data: newTuitions.map((t) => ({
            classAcademicId: t.classAcademicId,
            studentNis: t.studentNis,
            month: t.month,
            year: t.year,
            feeAmount: t.feeAmount,
            dueDate: t.dueDate,
            status: t.status,
          })),
        });
      }

      results.push({
        classAcademicId,
        className: classAcademic.className,
        generated: newTuitions.length,
        skipped: skippedCount,
      });

      totalGenerated += newTuitions.length;
      totalSkipped += skippedCount;
    }

    return successResponse({
      totalGenerated,
      totalSkipped,
      results,
    });
  } catch (error) {
    console.error("Generate bulk tuitions error:", error);
    return errorResponse(
      "Failed to generate tuitions",
      "SERVER_ERROR",
      500
    );
  }
}
