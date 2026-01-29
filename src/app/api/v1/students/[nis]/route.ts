import type { NextRequest } from "next/server";
import { requireRole } from "@/lib/api-auth";
import { errorResponse, successResponse } from "@/lib/api-response";
import { prisma } from "@/lib/prisma";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ nis: string }> },
) {
  const auth = await requireRole(request, ["ADMIN", "CASHIER"]);
  if (auth instanceof Response) return auth;

  const { nis } = await params;

  const student = await prisma.student.findUnique({ where: { nis } });

  if (!student) {
    return errorResponse("Student not found", "NOT_FOUND", 404);
  }

  return successResponse(student);
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ nis: string }> },
) {
  const auth = await requireRole(request, ["ADMIN"]);
  if (auth instanceof Response) return auth;

  const { nis } = await params;

  try {
    const body = await request.json();
    const existing = await prisma.student.findUnique({ where: { nis } });

    if (!existing) {
      return errorResponse("Student not found", "NOT_FOUND", 404);
    }

    if (body.nik && body.nik !== existing.nik) {
      const nikTaken = await prisma.student.findUnique({
        where: { nik: body.nik },
      });
      if (nikTaken) {
        return errorResponse("NIK already exists", "DUPLICATE_ENTRY", 409);
      }
    }

    const student = await prisma.student.update({
      where: { nis },
      data: {
        ...(body.name && { name: body.name }),
        ...(body.nik && { nik: body.nik }),
        ...(body.address && { address: body.address }),
        ...(body.parentName && { parentName: body.parentName }),
        ...(body.parentPhone && { parentPhone: body.parentPhone }),
        ...(body.startJoinDate && {
          startJoinDate: new Date(body.startJoinDate),
        }),
      },
    });

    return successResponse(student);
  } catch (error) {
    console.error("Update student error:", error);
    return errorResponse("Failed to update student", "SERVER_ERROR", 500);
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ nis: string }> },
) {
  const auth = await requireRole(request, ["ADMIN"]);
  if (auth instanceof Response) return auth;

  const { nis } = await params;

  const existing = await prisma.student.findUnique({ where: { nis } });
  if (!existing) {
    return errorResponse("Student not found", "NOT_FOUND", 404);
  }

  await prisma.student.delete({ where: { nis } });

  return successResponse({ message: "Student deleted successfully" });
}
