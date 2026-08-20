// middleware.ts
import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { ADMIN_EMAILS } from "@/lib/admin";

const isProtectedRoute = createRouteMatcher([
  "/dashboard(.*)",
  "/features(.*)",
  "/blog(.*)",
]);

const isAuthRoute = createRouteMatcher([
  "/login-agri(.*)",
  "/register-agri(.*)",
]);

// Helper to prevent open-redirect vulnerabilities and self-referential loops
function getSafeRedirectUrl(rawParam: string | null, currentPath: string, fallback = "/dashboard"): string {
  if (!rawParam) return fallback;
  
  // Clean query params to prevent self-looping like /dashboard?redirect=/dashboard
  const cleanParam = rawParam.split("?")[0];
  if (cleanParam === currentPath) return fallback;

  const safePrefixes = ["/dashboard", "/features", "/blog"];
  const isSafe = safePrefixes.some((prefix) => cleanParam.startsWith(prefix));
  return isSafe ? cleanParam : fallback;
}

export default clerkMiddleware(async (auth, req) => {
  // 🛡️ BYPASS: Let Next.js Server Actions pass through instantly
  if (req.method === "POST" && req.headers.get("next-action")) {
    return NextResponse.next();
  }

  const { userId, sessionClaims } = await auth();
  const { pathname, searchParams } = req.nextUrl;

  // Forward x-pathname header
  const requestHeaders = new Headers(req.headers);
  requestHeaders.set("x-pathname", pathname);

  const nextWithHeaders = () =>
    NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    });

  // 1. FAST ZERO-NETWORK EMAIL EXTRACTION FROM CLERK SESSION CLAIMS
  const claims = sessionClaims as Record<string, unknown> | undefined;
  const userEmail = (
    (claims?.email as string) ||
    (claims?.primaryEmail as string) ||
    (claims?.email_address as string) ||
    ((claims?.primary_email_address as Record<string, string>)?.email_address)
  )?.toLowerCase();

  // 👑 2. ADMIN CHECK & BYPASS
  const isAdmin =
    Boolean(userId) &&
    ((userEmail ? ADMIN_EMAILS.includes(userEmail) : false) ||
      (claims?.metadata as Record<string, unknown>)?.role === "admin");

  if (isAdmin) {
    if (isAuthRoute(req)) {
      const redirectTo = getSafeRedirectUrl(searchParams.get("redirect"), pathname);
      return NextResponse.redirect(new URL(redirectTo, req.url));
    }

    const hasAdminCookies =
      req.cookies.get("agri_session_verified")?.value === "true" &&
      req.cookies.get("agri_session_id")?.value === "AGRI-ADMIN-001";

    const response = nextWithHeaders();

    if (!hasAdminCookies) {
      const cookieOptions = {
        path: "/",
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax" as const,
        maxAge: 60 * 60 * 24 * 7, // 7 days
      };

      response.cookies.set("agri_session_verified", "true", cookieOptions);
      response.cookies.set("agri_session_id", "AGRI-ADMIN-001", cookieOptions);
    }

    return response;
  }

  // 3. REQUIRE CLERK LOGIN (TIER 1) - Send unauthenticated users to /unauthorized
  if (isProtectedRoute(req) && !userId) {
    const unauthorizedUrl = new URL("/unauthorized", req.url);
    if (pathname !== "/dashboard") {
      unauthorizedUrl.searchParams.set("redirect", pathname);
    }
    return NextResponse.redirect(unauthorizedUrl);
  }

  // ⚡ 3.5. PIN & REGISTRATION VERIFICATION CHECK FOR REGULAR USERS
  if (isProtectedRoute(req) && userId) {
    const agriVerified = req.cookies.get("agri_session_verified")?.value;
    const agriSessionId = req.cookies.get("agri_session_id")?.value;

    if (agriVerified === "false" && agriSessionId) {
      const loginUrl = new URL("/login-agri", req.url);
      if (pathname !== "/dashboard") {
        loginUrl.searchParams.set("redirect", pathname);
      }
      return NextResponse.redirect(loginUrl);
    }
  }

  // 4. PREVENT AUTH LOOPS FOR FULLY VERIFIED REGULAR USERS
  if (isAuthRoute(req) && userId) {
    const agriVerified = req.cookies.get("agri_session_verified")?.value;
    const agriSessionId = req.cookies.get("agri_session_id")?.value;

    if (agriVerified === "true" && agriSessionId) {
      const targetDestination = getSafeRedirectUrl(searchParams.get("redirect"), pathname);
      return NextResponse.redirect(new URL(targetDestination, req.url));
    }
  }

  // 5. CLEAR STALE SESSIONS ON LOGOUT
  if (isAuthRoute(req) && searchParams.get("invalid") === "1") {
    const response = nextWithHeaders();
    response.cookies.delete({ name: "agri_session_verified", path: "/" });
    response.cookies.delete({ name: "agri_session_id", path: "/" });
    return response;
  }

  return nextWithHeaders();
});

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    "/((?!_next/static|_next/image|favicon.ico).*)",
    "/(api|trpc)(.*)",
  ],
};