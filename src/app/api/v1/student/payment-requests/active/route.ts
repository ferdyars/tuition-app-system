import type { NextRequest } from "next/server";
import { errorResponse, successResponse } from "@/lib/api-response";
import { getActivePaymentRequest } from "@/lib/business-logic/payment-request";
import { getStudentSessionFromRequest } from "@/lib/student-auth";

export async function GET(request: NextRequest) {
  try {
    const session = await getStudentSessionFromRequest(request);
    if (!session) {
      return errorResponse("Unauthorized", "UNAUTHORIZED", 401);
    }

    const result = await getActivePaymentRequest(session.studentNis);

    return successResponse(result);
  } catch (error) {
    console.error("Get active payment request error:", error);
    return errorResponse("Internal server error", "SERVER_ERROR", 500);
  }
}
