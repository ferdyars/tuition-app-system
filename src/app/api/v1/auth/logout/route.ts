import type { NextRequest } from "next/server";
import { successResponse } from "@/lib/api-response";
import { getTokenFromRequest } from "@/lib/auth";
import { blacklistToken } from "@/lib/token-blacklist";

export async function POST(request: NextRequest) {
  const token = getTokenFromRequest(request);

  if (token) {
    blacklistToken(token);
  }

  const response = successResponse({ message: "Logged out successfully" });

  response.headers.set(
    "Set-Cookie",
    "auth-token=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0",
  );

  return response;
}
