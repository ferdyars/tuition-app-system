import type { NextRequest } from "next/server";
import { errorResponse, successResponse } from "@/lib/api-response";
import { getSessionFromRequest } from "@/lib/auth";
import { restoreAccount } from "@/lib/business-logic/student-account";

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

    await restoreAccount(nis);

    return successResponse({ message: "Akun berhasil dipulihkan" });
  } catch (error) {
    console.error("Restore student account error:", error);
    if (error instanceof Error) {
      return errorResponse(error.message, "VALIDATION_ERROR", 400);
    }
    return errorResponse("Internal server error", "SERVER_ERROR", 500);
  }
}
