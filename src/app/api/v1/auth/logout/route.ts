import { NextRequest } from "next/server";
import { getTokenFromRequest } from "@/lib/auth";
import { blacklistToken } from "@/lib/token-blacklist";
import { successResponse } from "@/lib/api-response";

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
