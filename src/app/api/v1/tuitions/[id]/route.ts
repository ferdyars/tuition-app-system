import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/api-auth";
import { successResponse, errorResponse } from "@/lib/api-response";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireRole(request, ["ADMIN"]);
  if (auth instanceof Response) return auth;

  const { id } = await params;

  const tuition = await prisma.tuition.findUnique({
    where: { id },
    include: {
      student: {
        select: { nis: true, name: true, parentName: true, parentPhone: true },
      },
      classAcademic: {
        select: {
          className: true,
          grade: true,
          section: true,
          academicYear: { select: { year: true } },
        },
      },
      payments: {
        include: {
          employee: { select: { name: true } },
        },
        orderBy: { paymentDate: "desc" },
      },
    },
  });

  if (!tuition) {
    return errorResponse("Tuition not found", "NOT_FOUND", 404);
  }

  return successResponse(tuition);
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireRole(request, ["ADMIN"]);
  if (auth instanceof Response) return auth;

  const { id } = await params;

  try {
    const body = await request.json();
    const { feeAmount, dueDate, status } = body;

    const tuition = await prisma.tuition.findUnique({ where: { id } });
    if (!tuition) {
      return errorResponse("Tuition not found", "NOT_FOUND", 404);
    }

    const updateData: Record<string, unknown> = {};

    if (feeAmount !== undefined) {
      updateData.feeAmount = feeAmount;
    }

    if (dueDate !== undefined) {
      updateData.dueDate = new Date(dueDate);
    }

    if (status !== undefined) {
      updateData.status = status;
    }

    const updatedTuition = await prisma.tuition.update({
      where: { id },
      data: updateData,
      include: {
        student: { select: { nis: true, name: true } },
        classAcademic: { select: { className: true } },
      },
    });

    return successResponse(updatedTuition);
  } catch (error) {
    console.error("Update tuition error:", error);
    return errorResponse("Failed to update tuition", "SERVER_ERROR", 500);
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireRole(request, ["ADMIN"]);
  if (auth instanceof Response) return auth;

  const { id } = await params;

  try {
    const tuition = await prisma.tuition.findUnique({
      where: { id },
      include: { _count: { select: { payments: true } } },
    });

    if (!tuition) {
      return errorResponse("Tuition not found", "NOT_FOUND", 404);
    }

    if (tuition._count.payments > 0) {
      return errorResponse(
        "Cannot delete tuition with existing payments",
        "VALIDATION_ERROR",
        400
      );
    }

    await prisma.tuition.delete({ where: { id } });

    return successResponse({ message: "Tuition deleted successfully" });
  } catch (error) {
    console.error("Delete tuition error:", error);
    return errorResponse("Failed to delete tuition", "SERVER_ERROR", 500);
  }
}
