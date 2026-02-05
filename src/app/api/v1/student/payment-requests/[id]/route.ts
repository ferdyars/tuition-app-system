import type { NextRequest } from "next/server";
import { errorResponse, successResponse } from "@/lib/api-response";
import { getPaymentRequest } from "@/lib/business-logic/payment-request";
import { getStudentSessionFromRequest } from "@/lib/student-auth";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await getStudentSessionFromRequest(request);
    if (!session) {
      return errorResponse("Unauthorized", "UNAUTHORIZED", 401);
    }

    const { id } = await params;
    const result = await getPaymentRequest(id, session.studentNis);

    return successResponse(result);
  } catch (error) {
    console.error("Get payment request error:", error);
    if (error instanceof Error) {
      return errorResponse(error.message, "NOT_FOUND", 404);
    }
    return errorResponse("Internal server error", "SERVER_ERROR", 500);
  }
}
