import {
  type JwtPayload,
  getTokenFromRequest,
  verifyToken,
} from "@/lib/auth";
import { errorResponse } from "@/lib/api-response";
import { isTokenBlacklisted } from "@/lib/token-blacklist";
import type { Role } from "@/generated/prisma/client";

export async function requireAuth(
  request: Request,
): Promise<JwtPayload | Response> {
  const token = getTokenFromRequest(request);

  if (!token) {
    return errorResponse("Not authenticated", "UNAUTHORIZED", 401);
  }

  if (isTokenBlacklisted(token)) {
    return errorResponse("Token has been revoked", "UNAUTHORIZED", 401);
  }

  const session = await verifyToken(token);
  if (!session) {
    return errorResponse("Invalid token", "UNAUTHORIZED", 401);
  }

  return session;
}

export async function requireRole(
  request: Request,
  allowedRoles: Role[],
): Promise<JwtPayload | Response> {
  const result = await requireAuth(request);
  if (result instanceof Response) return result;

  if (!allowedRoles.includes(result.role)) {
    return errorResponse("Forbidden", "FORBIDDEN", 403);
  }
  return result;
}
