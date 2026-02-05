import bcrypt from "bcryptjs";
import type { NextRequest } from "next/server";
import { requireAuth } from "@/lib/api-auth";
import { errorResponse, successResponse } from "@/lib/api-response";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  const auth = await requireAuth(request);
  if (auth instanceof Response) return auth;

  try {
    const { currentPassword, newPassword } = await request.json();

    if (!currentPassword || !newPassword) {
      return errorResponse(
        "Current password and new password are required",
        "VALIDATION_ERROR",
        400,
      );
    }

    if (newPassword.length < 6) {
      return errorResponse(
        "New password must be at least 6 characters",
        "VALIDATION_ERROR",
        400,
      );
    }

    // Get the employee
    const employee = await prisma.employee.findUnique({
      where: { employeeId: auth.employeeId },
    });

    if (!employee) {
      return errorResponse("Employee not found", "NOT_FOUND", 404);
    }

    // Verify current password
    const isValidPassword = await bcrypt.compare(
      currentPassword,
      employee.password,
    );

    if (!isValidPassword) {
      return errorResponse(
        "Current password is incorrect",
        "INVALID_PASSWORD",
        400,
      );
    }

    // Hash new password and update
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await prisma.employee.update({
      where: { employeeId: auth.employeeId },
      data: { password: hashedPassword },
    });

    return successResponse({ message: "Password changed successfully" });
  } catch (error) {
    console.error("Change password error:", error);
    return errorResponse("Failed to change password", "INTERNAL_ERROR", 500);
  }
}
