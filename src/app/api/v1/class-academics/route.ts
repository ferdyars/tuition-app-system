import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/api-auth";
import { successResponse, errorResponse } from "@/lib/api-response";
import { generateClassName } from "@/lib/business-logic/class-name-generator";

export async function GET(request: NextRequest) {
  const auth = await requireRole(request, ["ADMIN"]);
  if (auth instanceof Response) return auth;

  const searchParams = request.nextUrl.searchParams;
  const page = Number(searchParams.get("page") || "1");
  const limit = Number(searchParams.get("limit") || "10");
  const academicYearId = searchParams.get("academicYearId") || undefined;
  const grade = searchParams.get("grade")
    ? Number(searchParams.get("grade"))
    : undefined;
  const search = searchParams.get("search") || undefined;

  const where: Record<string, unknown> = {};

  if (academicYearId) {
    where.academicYearId = academicYearId;
  }

  if (grade) {
    where.grade = grade;
  }

  if (search) {
    where.className = { contains: search, mode: "insensitive" };
  }

  const [classes, total] = await Promise.all([
    prisma.classAcademic.findMany({
      where,
      include: {
        academicYear: {
          select: { year: true, isActive: true },
        },
        _count: {
          select: { tuitions: true, scholarships: true, studentClasses: true },
        },
      },
      skip: (page - 1) * limit,
      take: limit,
      orderBy: [{ academicYear: { year: "desc" } }, { grade: "asc" }, { section: "asc" }],
    }),
    prisma.classAcademic.count({ where }),
  ]);

  return successResponse({
    classes,
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
    const { academicYearId, grade, section } = body;

    if (!academicYearId || !grade || !section) {
      return errorResponse(
        "Academic year, grade, and section are required",
        "VALIDATION_ERROR",
        400,
      );
    }

    if (grade < 1 || grade > 12) {
      return errorResponse(
        "Grade must be between 1 and 12",
        "VALIDATION_ERROR",
        400,
      );
    }

    const academicYear = await prisma.academicYear.findUnique({
      where: { id: academicYearId },
    });

    if (!academicYear) {
      return errorResponse("Academic year not found", "NOT_FOUND", 404);
    }

    const existing = await prisma.classAcademic.findUnique({
      where: {
        academicYearId_grade_section: {
          academicYearId,
          grade,
          section,
        },
      },
    });

    if (existing) {
      return errorResponse(
        "Class already exists for this academic year, grade, and section",
        "DUPLICATE_ENTRY",
        409,
      );
    }

    const className = generateClassName(grade, section, academicYear.year);

    const classAcademic = await prisma.classAcademic.create({
      data: {
        academicYearId,
        grade,
        section,
        className,
      },
      include: {
        academicYear: { select: { year: true } },
      },
    });

    return successResponse(classAcademic, 201);
  } catch (error) {
    console.error("Create class error:", error);
    return errorResponse("Failed to create class", "SERVER_ERROR", 500);
  }
}
