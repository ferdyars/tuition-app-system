import { NextRequest } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { signToken } from "@/lib/auth";
import { successResponse, errorResponse } from "@/lib/api-response";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password } = body;

    if (!email || !password) {
      return errorResponse(
        "Email and password are required",
        "VALIDATION_ERROR",
        400,
      );
    }

    const employee = await prisma.employee.findUnique({
      where: { email },
    });

    if (!employee) {
      return errorResponse("Invalid email or password", "UNAUTHORIZED", 401);
    }

    const isPasswordValid = await bcrypt.compare(password, employee.password);
    if (!isPasswordValid) {
      return errorResponse("Invalid email or password", "UNAUTHORIZED", 401);
    }

    const token = await signToken({
      employeeId: employee.employeeId,
      email: employee.email,
      name: employee.name,
      role: employee.role,
    });

    const response = successResponse({ message: "Login successful" });

    response.headers.set(
      "Set-Cookie",
      `auth-token=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${8 * 60 * 60}`,
    );

    return response;
  } catch (error) {
    console.error("Login error:", error);
    return errorResponse("Internal server error", "SERVER_ERROR", 500);
  }
}
