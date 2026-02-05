import type { NextRequest } from "next/server";
import { requireRole } from "@/lib/api-auth";
import { errorResponse, successResponse } from "@/lib/api-response";
import {
  getNotificationLogs,
  resendNotification,
} from "@/lib/services/notification-service";

export async function GET(request: NextRequest) {
  const auth = await requireRole(request, ["ADMIN"]);
  if (auth instanceof Response) return auth;

  try {
    const { searchParams } = new URL(request.url);
    const page = Number.parseInt(searchParams.get("page") || "1", 10);
    const limit = Number.parseInt(searchParams.get("limit") || "10", 10);
    const status = searchParams.get("status") || undefined;
    const messageType = searchParams.get("messageType") || undefined;

    const result = await getNotificationLogs({
      page,
      limit,
      status,
      messageType,
    });

    return successResponse(result);
  } catch (error) {
    console.error("Get notification logs error:", error);
    return errorResponse("Internal server error", "SERVER_ERROR", 500);
  }
}

export async function POST(request: NextRequest) {
  const auth = await requireRole(request, ["ADMIN"]);
  if (auth instanceof Response) return auth;

  try {
    const body = await request.json();
    const { action, logId } = body;

    if (action === "resend" && logId) {
      const result = await resendNotification(logId);
      return successResponse(result);
    }

    return errorResponse("Invalid action", "VALIDATION_ERROR", 400);
  } catch (error) {
    console.error("Notification action error:", error);
    if (error instanceof Error) {
      return errorResponse(error.message, "VALIDATION_ERROR", 400);
    }
    return errorResponse("Internal server error", "SERVER_ERROR", 500);
  }
}
