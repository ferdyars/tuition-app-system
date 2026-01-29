import type { NextRequest } from "next/server";
import { requireRole } from "@/lib/api-auth";
import { errorResponse, successResponse } from "@/lib/api-response";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  const auth = await requireRole(request, ["ADMIN"]);
  if (auth instanceof Response) return auth;

  const searchParams = request.nextUrl.searchParams;
  const page = Number(searchParams.get("page") || "1");
  const limit = Number(searchParams.get("limit") || "10");
  const isActive = searchParams.get("isActive");

  const where: Record<string, unknown> = {};

  if (isActive !== null && isActive !== undefined && isActive !== "") {
    where.isActive = isActive === "true";
  }

  const [academicYears, total] = await Promise.all([
    prisma.academicYear.findMany({
      where,
      include: {
        _count: {
          select: { classAcademics: true },
        },
      },
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { year: "desc" },
    }),
    prisma.academicYear.count({ where }),
  ]);

  return successResponse({
    academicYears,
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
    const { year, startDate, endDate, isActive } = body;

    if (!year || !startDate || !endDate) {
      return errorResponse(
        "Year, start date, and end date are required",
        "VALIDATION_ERROR",
        400,
      );
    }

    const yearRegex = /^\d{4}\/\d{4}$/;
    if (!yearRegex.test(year)) {
      return errorResponse(
        "Year must be in format YYYY/YYYY (e.g., 2024/2025)",
        "VALIDATION_ERROR",
        400,
      );
    }

    const existing = await prisma.academicYear.findUnique({ where: { year } });
    if (existing) {
      return errorResponse(
        "Academic year already exists",
        "DUPLICATE_ENTRY",
        409,
      );
    }

    // If setting as active, deactivate all others
    if (isActive) {
      await prisma.academicYear.updateMany({
        data: { isActive: false },
      });
    }

    const academicYear = await prisma.academicYear.create({
      data: {
        year,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        isActive: isActive || false,
      },
    });

    return successResponse(academicYear, 201);
  } catch (error) {
    console.error("Create academic year error:", error);
    return errorResponse("Failed to create academic year", "SERVER_ERROR", 500);
  }
}
