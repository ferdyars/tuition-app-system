import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/api-auth";
import { successResponse, errorResponse } from "@/lib/api-response";
import { Prisma } from "@/generated/prisma/client";
import {
  applyScholarship,
  getClassFeeAmount,
} from "@/lib/business-logic/scholarship-processor";

export async function GET(request: NextRequest) {
  const auth = await requireRole(request, ["ADMIN"]);
  if (auth instanceof Response) return auth;

  const searchParams = request.nextUrl.searchParams;
  const page = Number(searchParams.get("page") || "1");
  const limit = Number(searchParams.get("limit") || "10");
  const classAcademicId = searchParams.get("classAcademicId") || undefined;
  const studentNis = searchParams.get("studentNis") || undefined;
  const isFullScholarship = searchParams.get("isFullScholarship");

  const where: Prisma.ScholarshipWhereInput = {};

  if (classAcademicId) {
    where.classAcademicId = classAcademicId;
  }

  if (studentNis) {
    where.studentNis = studentNis;
  }

  if (isFullScholarship !== null && isFullScholarship !== undefined && isFullScholarship !== "") {
    where.isFullScholarship = isFullScholarship === "true";
  }

  const [scholarships, total] = await Promise.all([
    prisma.scholarship.findMany({
      where,
      include: {
        student: {
          select: { nis: true, name: true, parentPhone: true },
        },
        classAcademic: {
          select: {
            className: true,
            grade: true,
            section: true,
            academicYear: { select: { year: true } },
          },
        },
      },
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { createdAt: "desc" },
    }),
    prisma.scholarship.count({ where }),
  ]);

  return successResponse({
    scholarships,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  });
}

export async function POST(request: NextRequest) {
  const auth = await requireRole(request, ["ADMIN"]);
  if (auth instanceof Response) return auth;

  try {
    const body = await request.json();
    const { studentNis, classAcademicId, nominal } = body;

    if (!studentNis || !classAcademicId || nominal === undefined) {
      return errorResponse(
        "Student NIS, class, and nominal are required",
        "VALIDATION_ERROR",
        400
      );
    }

    if (nominal < 0) {
      return errorResponse(
        "Nominal must be a positive number",
        "VALIDATION_ERROR",
        400
      );
    }

    // Check if student exists
    const student = await prisma.student.findUnique({
      where: { nis: studentNis },
    });

    if (!student) {
      return errorResponse("Student not found", "NOT_FOUND", 404);
    }

    // Check if class exists
    const classAcademic = await prisma.classAcademic.findUnique({
      where: { id: classAcademicId },
    });

    if (!classAcademic) {
      return errorResponse("Class not found", "NOT_FOUND", 404);
    }

    // Check if scholarship already exists
    const existing = await prisma.scholarship.findUnique({
      where: {
        studentNis_classAcademicId: {
          studentNis,
          classAcademicId,
        },
      },
    });

    if (existing) {
      return errorResponse(
        "Scholarship already exists for this student in this class",
        "DUPLICATE_ENTRY",
        409
      );
    }

    // Get fee amount from existing tuitions
    const feeAmount = await getClassFeeAmount(classAcademicId, prisma);
    const monthlyFee = feeAmount || nominal; // Use nominal as fallback

    // Determine if full scholarship
    const isFullScholarship = nominal >= monthlyFee;

    // Create scholarship
    const scholarship = await prisma.scholarship.create({
      data: {
        studentNis,
        classAcademicId,
        nominal,
        isFullScholarship,
      },
      include: {
        student: { select: { nis: true, name: true } },
        classAcademic: { select: { className: true } },
      },
    });

    // Apply scholarship (auto-pay tuitions if full scholarship)
    let applicationResult = null;
    if (isFullScholarship && feeAmount) {
      // Get admin employee for system payment
      const adminEmployee = await prisma.employee.findFirst({
        where: { role: "ADMIN" },
      });

      if (adminEmployee) {
        applicationResult = await applyScholarship(
          {
            studentNis,
            classAcademicId,
            nominal,
            monthlyFee,
          },
          prisma,
          adminEmployee.employeeId
        );
      }
    }

    return successResponse(
      {
        scholarship,
        applicationResult,
      },
      201
    );
  } catch (error) {
    console.error("Create scholarship error:", error);
    return errorResponse("Failed to create scholarship", "SERVER_ERROR", 500);
  }
}
