import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/api-auth";
import { successResponse, errorResponse } from "@/lib/api-response";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireRole(request, ["ADMIN"]);
  if (auth instanceof Response) return auth;

  const { id } = await params;

  const employee = await prisma.employee.findUnique({
    where: { employeeId: id },
    select: {
      employeeId: true,
      name: true,
      email: true,
      role: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  if (!employee) {
    return errorResponse("Employee not found", "NOT_FOUND", 404);
  }

  return successResponse(employee);
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
    const { name, email, role } = body;

    const existing = await prisma.employee.findUnique({
      where: { employeeId: id },
    });

    if (!existing) {
      return errorResponse("Employee not found", "NOT_FOUND", 404);
    }

    if (email && email !== existing.email) {
      const emailTaken = await prisma.employee.findUnique({
        where: { email },
      });
      if (emailTaken) {
        return errorResponse("Email already exists", "DUPLICATE_ENTRY", 409);
      }
    }

    const employee = await prisma.employee.update({
      where: { employeeId: id },
      data: {
        ...(name && { name }),
        ...(email && { email }),
        ...(role && { role }),
      },
      select: {
        employeeId: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return successResponse(employee);
  } catch (error) {
    console.error("Update employee error:", error);
    return errorResponse("Failed to update employee", "SERVER_ERROR", 500);
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireRole(request, ["ADMIN"]);
  if (auth instanceof Response) return auth;

  const { id } = await params;

  const existing = await prisma.employee.findUnique({
    where: { employeeId: id },
  });

  if (!existing) {
    return errorResponse("Employee not found", "NOT_FOUND", 404);
  }

  if (auth.employeeId === id) {
    return errorResponse(
      "Cannot delete your own account",
      "VALIDATION_ERROR",
      400,
    );
  }

  await prisma.employee.delete({ where: { employeeId: id } });

  return successResponse({ message: "Employee deleted successfully" });
}
