import type { NextRequest } from "next/server";
import { errorResponse, successResponse } from "@/lib/api-response";
import { getSessionFromRequest } from "@/lib/auth";
import {
  createStudentAccount,
  softDeleteAccount,
} from "@/lib/business-logic/student-account";

// Create account for student
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ nis: string }> },
) {
  try {
    const session = await getSessionFromRequest(request);
    if (!session) {
      return errorResponse("Unauthorized", "UNAUTHORIZED", 401);
    }

    const { nis } = await params;

    const result = await createStudentAccount({
      studentNis: nis,
      createdBy: session.employeeId,
    });

    return successResponse(result, 201);
  } catch (error) {
    console.error("Create student account error:", error);
    if (error instanceof Error) {
      return errorResponse(error.message, "VALIDATION_ERROR", 400);
    }
    return errorResponse("Internal server error", "SERVER_ERROR", 500);
  }
}

// Soft delete account
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ nis: string }> },
) {
  try {
    const session = await getSessionFromRequest(request);
    if (!session) {
      return errorResponse("Unauthorized", "UNAUTHORIZED", 401);
    }

    const { nis } = await params;
    const body = await request.json().catch(() => ({}));
    const reason = body.reason as string | undefined;

    await softDeleteAccount(nis, session.employeeId, reason);

    return successResponse({ message: "Akun berhasil dihapus" });
  } catch (error) {
    console.error("Delete student account error:", error);
    if (error instanceof Error) {
      return errorResponse(error.message, "VALIDATION_ERROR", 400);
    }
    return errorResponse("Internal server error", "SERVER_ERROR", 500);
  }
}
