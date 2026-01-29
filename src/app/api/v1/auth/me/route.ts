import { NextRequest } from "next/server";
import { requireAuth } from "@/lib/api-auth";
import { successResponse } from "@/lib/api-response";

export async function GET(request: NextRequest) {
  const auth = await requireAuth(request);
  if (auth instanceof Response) return auth;

  return successResponse({
    employeeId: auth.employeeId,
    name: auth.name,
    email: auth.email,
    role: auth.role,
  });
}
