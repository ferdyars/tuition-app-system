import type { NextRequest } from "next/server";
import { errorResponse, successResponse } from "@/lib/api-response";
import { cancelPaymentRequest } from "@/lib/business-logic/payment-request";
import { getStudentSessionFromRequest } from "@/lib/student-auth";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await getStudentSessionFromRequest(request);
    if (!session) {
      return errorResponse("Unauthorized", "UNAUTHORIZED", 401);
    }

    const { id } = await params;
    const result = await cancelPaymentRequest(id, session.studentNis);

    return successResponse(result);
  } catch (error) {
    console.error("Cancel payment request error:", error);
    if (error instanceof Error) {
      return errorResponse(error.message, "VALIDATION_ERROR", 400);
    }
    return errorResponse("Internal server error", "SERVER_ERROR", 500);
  }
}
