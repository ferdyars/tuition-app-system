import type { NextRequest } from "next/server";
import { requireRole } from "@/lib/api-auth";
import { errorResponse, successResponse } from "@/lib/api-response";
import { prisma } from "@/lib/prisma";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireRole(request, ["ADMIN"]);
  if (auth instanceof Response) return auth;

  const { id } = await params;

  const academicYear = await prisma.academicYear.findUnique({
    where: { id },
    include: {
      _count: {
        select: { classAcademics: true },
      },
    },
  });

  if (!academicYear) {
    return errorResponse("Academic year not found", "NOT_FOUND", 404);
  }

  return successResponse(academicYear);
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireRole(request, ["ADMIN"]);
  if (auth instanceof Response) return auth;

  const { id } = await params;

  try {
    const body = await request.json();
    const existing = await prisma.academicYear.findUnique({ where: { id } });

    if (!existing) {
      return errorResponse("Academic year not found", "NOT_FOUND", 404);
    }

    if (body.year && body.year !== existing.year) {
      const yearTaken = await prisma.academicYear.findUnique({
        where: { year: body.year },
      });
      if (yearTaken) {
        return errorResponse(
          "Academic year already exists",
          "DUPLICATE_ENTRY",
          409,
        );
      }
    }

    const academicYear = await prisma.academicYear.update({
      where: { id },
      data: {
        ...(body.year && { year: body.year }),
        ...(body.startDate && { startDate: new Date(body.startDate) }),
        ...(body.endDate && { endDate: new Date(body.endDate) }),
        ...(body.isActive !== undefined && { isActive: body.isActive }),
      },
    });

    return successResponse(academicYear);
  } catch (error) {
    console.error("Update academic year error:", error);
    return errorResponse("Failed to update academic year", "SERVER_ERROR", 500);
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireRole(request, ["ADMIN"]);
  if (auth instanceof Response) return auth;

  const { id } = await params;

  const existing = await prisma.academicYear.findUnique({
    where: { id },
    include: { _count: { select: { classAcademics: true } } },
  });

  if (!existing) {
    return errorResponse("Academic year not found", "NOT_FOUND", 404);
  }

  if (existing._count.classAcademics > 0) {
    return errorResponse(
      "Cannot delete academic year with existing classes. Delete classes first.",
      "VALIDATION_ERROR",
      400,
    );
  }

  await prisma.academicYear.delete({ where: { id } });

  return successResponse({ message: "Academic year deleted successfully" });
}
