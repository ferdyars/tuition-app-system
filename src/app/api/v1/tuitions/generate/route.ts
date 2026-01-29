import type { NextRequest } from "next/server";
import { requireRole } from "@/lib/api-auth";
import { errorResponse, successResponse } from "@/lib/api-response";
import { generateTuitions } from "@/lib/business-logic/tuition-generator";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  const auth = await requireRole(request, ["ADMIN"]);
  if (auth instanceof Response) return auth;

  try {
    const body = await request.json();
    const { classAcademicId, feeAmount, studentNisList } = body;

    if (!classAcademicId || !feeAmount) {
      return errorResponse(
        "Class and fee amount are required",
        "VALIDATION_ERROR",
        400,
      );
    }

    if (feeAmount <= 0) {
      return errorResponse(
        "Fee amount must be greater than 0",
        "VALIDATION_ERROR",
        400,
      );
    }

    // Get class with academic year
    const classAcademic = await prisma.classAcademic.findUnique({
      where: { id: classAcademicId },
      include: {
        academicYear: true,
      },
    });

    if (!classAcademic) {
      return errorResponse("Class not found", "NOT_FOUND", 404);
    }

    // Get students - either specified ones or all students
    // Note: In a real app, you'd have a student-class relationship
    // For now, we'll get students from existing tuitions or all students
    let students;
    if (studentNisList && studentNisList.length > 0) {
      students = await prisma.student.findMany({
        where: { nis: { in: studentNisList } },
        select: { nis: true, startJoinDate: true },
      });
    } else {
      // Get all students (you might want to filter by some criteria)
      students = await prisma.student.findMany({
        select: { nis: true, startJoinDate: true },
      });
    }

    if (students.length === 0) {
      return errorResponse(
        "No students found to generate tuitions for",
        "VALIDATION_ERROR",
        400,
      );
    }

    // Generate tuition records
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

    // Check for existing tuitions to avoid duplicates
    const existingTuitions = await prisma.tuition.findMany({
      where: {
        classAcademicId,
        studentNis: { in: students.map((s) => s.nis) },
      },
      select: {
        studentNis: true,
        month: true,
        year: true,
      },
    });

    const existingKeys = new Set(
      existingTuitions.map((t) => `${t.studentNis}-${t.month}-${t.year}`),
    );

    const newTuitions = tuitionsToCreate.filter(
      (t) => !existingKeys.has(`${t.studentNis}-${t.month}-${t.year}`),
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

    // Calculate statistics
    const studentsWithFullYear = students.filter(
      (s) => s.startJoinDate <= classAcademic.academicYear.startDate,
    ).length;
    const studentsWithPartialYear = students.length - studentsWithFullYear;

    return successResponse({
      generated: newTuitions.length,
      skipped: skippedCount,
      details: {
        totalStudents: students.length,
        studentsWithFullYear,
        studentsWithPartialYear,
        className: classAcademic.className,
        academicYear: classAcademic.academicYear.year,
      },
    });
  } catch (error) {
    console.error("Generate tuitions error:", error);
    return errorResponse("Failed to generate tuitions", "SERVER_ERROR", 500);
  }
}
