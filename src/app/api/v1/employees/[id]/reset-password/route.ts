import { NextRequest } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/api-auth";
import { successResponse, errorResponse } from "@/lib/api-response";

export async function POST(
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

  const hashedPassword = await bcrypt.hash("123456", 10);

  await prisma.employee.update({
    where: { employeeId: id },
    data: { password: hashedPassword },
  });

  return successResponse({ message: "Password reset to default (123456)" });
}
