import type { NextRequest } from "next/server";
import type { Prisma } from "@/generated/prisma/client";
import { requireRole } from "@/lib/api-auth";
import { errorResponse, successResponse } from "@/lib/api-response";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  const auth = await requireRole(request, ["ADMIN"]);
  if (auth instanceof Response) return auth;

  const searchParams = request.nextUrl.searchParams;
  const page = Number(searchParams.get("page") || "1");
  const limit = Number(searchParams.get("limit") || "10");
  const academicYearId = searchParams.get("academicYearId") || undefined;
  const classAcademicId = searchParams.get("classAcademicId") || undefined;
  const isActive = searchParams.get("isActive");

  const where: Prisma.DiscountWhereInput = {};

  if (academicYearId) {
    where.academicYearId = academicYearId;
  }

  if (classAcademicId) {
    where.classAcademicId = classAcademicId;
  } else if (classAcademicId === "null") {
    // Filter for school-wide discounts only
    where.classAcademicId = null;
  }

  if (isActive !== null && isActive !== undefined && isActive !== "") {
    where.isActive = isActive === "true";
  }

  const [discounts, total] = await Promise.all([
    prisma.discount.findMany({
      where,
      include: {
        academicYear: {
          select: { id: true, year: true },
        },
        classAcademic: {
          select: {
            id: true,
            className: true,
            grade: true,
            section: true,
          },
        },
        _count: {
          select: { tuitions: true },
        },
      },
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { createdAt: "desc" },
    }),
    prisma.discount.count({ where }),
  ]);

  return successResponse({
    discounts,
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
    const {
      name,
      description,
      reason,
      discountAmount,
      targetPeriods,
      academicYearId,
      classAcademicId,
    } = body;

    // Validation
    if (!name) {
      return errorResponse("Name is required", "VALIDATION_ERROR", 400);
    }

    if (!discountAmount || discountAmount <= 0) {
      return errorResponse(
        "Discount amount must be greater than 0",
        "VALIDATION_ERROR",
        400,
      );
    }

    if (
      !targetPeriods ||
      !Array.isArray(targetPeriods) ||
      targetPeriods.length === 0
    ) {
      return errorResponse(
        "At least one target period is required",
        "VALIDATION_ERROR",
        400,
      );
    }

    if (!academicYearId) {
      return errorResponse(
        "Academic year is required",
        "VALIDATION_ERROR",
        400,
      );
    }

    // Check if academic year exists
    const academicYear = await prisma.academicYear.findUnique({
      where: { id: academicYearId },
    });

    if (!academicYear) {
      return errorResponse("Academic year not found", "NOT_FOUND", 404);
    }

    // Check if class exists (if provided)
    if (classAcademicId) {
      const classAcademic = await prisma.classAcademic.findUnique({
        where: { id: classAcademicId },
      });

      if (!classAcademic) {
        return errorResponse("Class not found", "NOT_FOUND", 404);
      }

      // Verify class belongs to the academic year
      if (classAcademic.academicYearId !== academicYearId) {
        return errorResponse(
          "Class does not belong to the selected academic year",
          "VALIDATION_ERROR",
          400,
        );
      }
    }

    // Create discount
    const discount = await prisma.discount.create({
      data: {
        name,
        description: description || null,
        reason: reason || null,
        discountAmount,
        targetPeriods,
        academicYearId,
        classAcademicId: classAcademicId || null,
        isActive: true,
      },
      include: {
        academicYear: {
          select: { id: true, year: true },
        },
        classAcademic: {
          select: {
            id: true,
            className: true,
            grade: true,
            section: true,
          },
        },
      },
    });

    return successResponse({ discount }, 201);
  } catch (error) {
    console.error("Create discount error:", error);
    return errorResponse("Failed to create discount", "SERVER_ERROR", 500);
  }
}
