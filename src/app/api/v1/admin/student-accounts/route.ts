import type { NextRequest } from "next/server";
import { errorResponse, successResponse } from "@/lib/api-response";
import { getSessionFromRequest } from "@/lib/auth";
import { listStudentsWithAccounts } from "@/lib/business-logic/student-account";

export async function GET(request: NextRequest) {
  try {
    const session = await getSessionFromRequest(request);
    if (!session) {
      return errorResponse("Unauthorized", "UNAUTHORIZED", 401);
    }

    const { searchParams } = new URL(request.url);
    const page = Number.parseInt(searchParams.get("page") || "1", 10);
    const limit = Number.parseInt(searchParams.get("limit") || "10", 10);
    const includeDeleted = searchParams.get("includeDeleted") === "true";
    const search = searchParams.get("search") || undefined;

    const result = await listStudentsWithAccounts({
      page,
      limit,
      includeDeleted,
      search,
    });

    return successResponse(result);
  } catch (error) {
    console.error("List student accounts error:", error);
    return errorResponse("Internal server error", "SERVER_ERROR", 500);
  }
}
