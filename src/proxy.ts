import { jwtVerify } from "jose";
import { type NextRequest, NextResponse } from "next/server";

const JWT_SECRET = new TextEncoder().encode(
  process.env.NEXTAUTH_SECRET || "default-secret-change-in-production",
);

// ===== PUBLIC ROUTES =====
const PUBLIC_PATHS = [
  "/admin/login",
  "/portal/login",
  "/api/v1/auth/login",
  "/api/v1/auth/logout",
  "/api/v1/student-auth/login",
  "/api/v1/student-auth/logout",
  "/api-docs",
  "/api/swagger",
];

// ===== HELPERS =====
const isPublicPath = (pathname: string) =>
  PUBLIC_PATHS.some((path) => pathname === path);

const isApiRoute = (pathname: string) => pathname.startsWith("/api/");
const isAdminRoute = (pathname: string) =>
  pathname.startsWith("/admin") && pathname !== "/admin/login";

const isPortalRoute = (pathname: string) =>
  pathname.startsWith("/portal") && pathname !== "/portal/login";

// ===== MIDDLEWARE =====
export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 1️⃣ Skip static
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon") ||
    pathname.endsWith(".ico")
  ) {
    return NextResponse.next();
  }

  const adminToken = request.cookies.get("auth-token")?.value;
  const studentToken = request.cookies.get("student-token")?.value;

  // =====================================================
  // 2️⃣ REDIRECT AUTHENTICATED USERS AWAY FROM LOGIN
  // =====================================================
  if (pathname === "/admin/login" && adminToken) {
    try {
      await jwtVerify(adminToken, JWT_SECRET);
      return NextResponse.redirect(new URL("/admin", request.url));
    } catch {
      const res = NextResponse.next();
      res.cookies.delete("auth-token");
      return res;
    }
  }

  if (pathname === "/portal/login" && studentToken) {
    try {
      await jwtVerify(studentToken, JWT_SECRET);
      return NextResponse.redirect(new URL("/portal", request.url));
    } catch {
      const res = NextResponse.next();
      res.cookies.delete("student-token");
      return res;
    }
  }

  // =====================================================
  // 3️⃣ PUBLIC ROUTES — MUST EXIT
  // =====================================================
  if (isPublicPath(pathname)) {
    return NextResponse.next();
  }

  // =====================================================
  // 4️⃣ ADMIN ROUTES
  // =====================================================
  if (isAdminRoute(pathname)) {
    if (!adminToken) {
      if (isApiRoute(pathname)) {
        return NextResponse.json(
          { success: false, error: { message: "Unauthorized" } },
          { status: 401 },
        );
      }
      return NextResponse.redirect(new URL("/admin/login", request.url));
    }

    try {
      await jwtVerify(adminToken, JWT_SECRET);
      return NextResponse.next();
    } catch {
      const res = NextResponse.redirect(new URL("/admin/login", request.url));
      res.cookies.delete("auth-token");
      return res;
    }
  }

  // =====================================================
  // 5️⃣ PORTAL ROUTES
  // =====================================================
  if (isPortalRoute(pathname)) {
    if (!studentToken) {
      if (isApiRoute(pathname)) {
        return NextResponse.json(
          { success: false, error: { message: "Unauthorized" } },
          { status: 401 },
        );
      }
      return NextResponse.redirect(new URL("/portal/login", request.url));
    }

    try {
      await jwtVerify(studentToken, JWT_SECRET);
      return NextResponse.next();
    } catch {
      const res = NextResponse.redirect(new URL("/portal/login", request.url));
      res.cookies.delete("student-token");
      return res;
    }
  }

  return NextResponse.next();
}

// ===== MATCHER =====
export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
