import { jwtVerify } from "jose";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

const JWT_SECRET = new TextEncoder().encode(
  process.env.NEXTAUTH_SECRET || "default-secret-change-in-production",
);

const publicPaths = [
  "/api/v1/auth/login",
  "/api-docs",
  "/api/swagger",
  "/student-portal",
  "/api/v1/student-portal",
];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Skip middleware for static files
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon") ||
    pathname === "/api/v1/auth/logout"
  ) {
    return NextResponse.next();
  }

  // Allow public API paths
  if (publicPaths.some((path) => pathname.startsWith(path))) {
    return NextResponse.next();
  }

  const token = request.cookies.get("auth-token")?.value;

  // Handle login page - redirect to home if already authenticated
  if (pathname === "/login" || pathname.startsWith("/login")) {
    if (token) {
      try {
        await jwtVerify(token, JWT_SECRET);
        return NextResponse.redirect(new URL("/", request.url));
      } catch {
        // Token invalid, clear it and allow login page
        const response = NextResponse.next();
        response.cookies.delete("auth-token");
        return response;
      }
    }
    return NextResponse.next();
  }

  // Protected routes - require authentication
  if (!token) {
    if (pathname.startsWith("/api/")) {
      return NextResponse.json(
        {
          success: false,
          error: { message: "Not authenticated", code: "UNAUTHORIZED" },
        },
        { status: 401 },
      );
    }
    return NextResponse.redirect(new URL("/login", request.url));
  }

  try {
    await jwtVerify(token, JWT_SECRET);
    return NextResponse.next();
  } catch {
    if (pathname.startsWith("/api/")) {
      return NextResponse.json(
        {
          success: false,
          error: { message: "Invalid token", code: "UNAUTHORIZED" },
        },
        { status: 401 },
      );
    }

    const response = NextResponse.redirect(new URL("/login", request.url));
    response.cookies.delete("auth-token");
    return response;
  }
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
