import { SignJWT, jwtVerify } from "jose";
import type { Role } from "@/generated/prisma/client";

const JWT_SECRET = new TextEncoder().encode(
  process.env.NEXTAUTH_SECRET || "default-secret-change-in-production",
);

export interface JwtPayload {
  employeeId: string;
  email: string;
  name: string;
  role: Role;
}

export async function signToken(payload: JwtPayload): Promise<string> {
  return new SignJWT(payload as unknown as Record<string, unknown>)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("8h")
    .sign(JWT_SECRET);
}

export async function verifyToken(token: string): Promise<JwtPayload | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    return payload as unknown as JwtPayload;
  } catch {
    return null;
  }
}

export function getTokenFromRequest(request: Request): string | null {
  const authHeader = request.headers.get("authorization");
  if (authHeader?.startsWith("Bearer ")) {
    return authHeader.slice(7);
  }

  const cookieHeader = request.headers.get("cookie");
  if (cookieHeader) {
    const cookies = Object.fromEntries(
      cookieHeader.split("; ").map((c) => c.split("=")),
    );
    return cookies["auth-token"] || null;
  }

  return null;
}

export async function getSessionFromRequest(
  request: Request,
): Promise<JwtPayload | null> {
  const token = getTokenFromRequest(request);
  if (!token) return null;
  return verifyToken(token);
}
