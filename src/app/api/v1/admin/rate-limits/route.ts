import type { NextRequest } from "next/server";
import { requireRole } from "@/lib/api-auth";
import { errorResponse, successResponse } from "@/lib/api-response";
import {
  getRateLimitHistory,
  resetRateLimit,
} from "@/lib/services/rate-limit-service";

export async function GET(request: NextRequest) {
  const auth = await requireRole(request, ["ADMIN"]);
  if (auth instanceof Response) return auth;

  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get("action") || undefined;
    const identifier = searchParams.get("identifier") || undefined;
    const limit = Number.parseInt(searchParams.get("limit") || "100", 10);

    const records = await getRateLimitHistory(action, identifier, limit);

    return successResponse({ records });
  } catch (error) {
    console.error("Get rate limit history error:", error);
    return errorResponse("Internal server error", "SERVER_ERROR", 500);
  }
}

export async function POST(request: NextRequest) {
  const auth = await requireRole(request, ["ADMIN"]);
  if (auth instanceof Response) return auth;

  try {
    const body = await request.json();
    const { action, identifier } = body;

    if (!action || !identifier) {
      return errorResponse(
        "action and identifier are required",
        "VALIDATION_ERROR",
        400,
      );
    }

    await resetRateLimit(action, identifier);

    return successResponse({ message: "Rate limit reset successfully" });
  } catch (error) {
    console.error("Reset rate limit error:", error);
    return errorResponse("Internal server error", "SERVER_ERROR", 500);
  }
}
