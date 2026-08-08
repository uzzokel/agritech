// middleware.ts
import { clerkMiddleware, createRouteMatcher, createClerkClient } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { ADMIN_EMAILS } from "@/lib/admin";

// Extend Clerk's SessionClaims interface
declare global {
  interface CustomSessionClaims {
    email?: string;
    primaryEmail?: string;
    email_address?: string;
    metadata?: {
      role?: string;
    };
  }
}

// Protected routes using clean single-pattern matching
const isProtectedRoute = createRouteMatcher([
  "/dashboard(.*)",
  "/features(.*)",
  "/blog(.*)",
]);

const isAuthRoute = createRouteMatcher([
  "/login-agri(.*)",
  "/register-agri(.*)",
]);

// Helper to prevent open-redirect vulnerabilities
function getSafeRedirectUrl(rawParam: string | null, fallback = "/dashboard"): string {
  if (!rawParam) return fallback;
  const safePrefixes = ["/dashboard", "/features", "/blog"];
  const isSafe = safePrefixes.some((prefix) => rawParam.startsWith(prefix));
  return isSafe ? rawParam : fallback;
}

export default clerkMiddleware(async (auth, req) => {
  // 🛡️ BYPASS: Let Next.js Server Actions pass through instantly
  if (req.method === "POST" && req.headers.get("next-action")) {
    return NextResponse.next();
  }

  const { userId, sessionClaims } = await auth();
  const { pathname, searchParams } = req.nextUrl;

  const claims = sessionClaims as unknown as CustomSessionClaims;

  // Forward x-pathname header
  const requestHeaders = new Headers(req.headers);
  requestHeaders.set("x-pathname", pathname);

  const nextWithHeaders = () =>
    NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    });

  // 1. EXTRACT USER EMAIL FROM CLAIMS
  let userEmail: string | undefined = (
    claims?.email ||
    claims?.primaryEmail ||
    claims?.email_address
  )?.toLowerCase();

  if (userId && !userEmail) {
    try {
      const clerk = createClerkClient({ secretKey: process.env.CLERK_SECRET_KEY });
      const user = await clerk.users.getUser(userId);
      userEmail = user.primaryEmailAddress?.emailAddress?.toLowerCase() ?? undefined;
    } catch (err) {
      console.error("Failed to fetch Clerk user email in middleware:", err);
    }
  }

  // 👑 2. ADMIN CHECK & BYPASS
  const isAdmin =
    Boolean(userId) &&
    ((userEmail ? ADMIN_EMAILS.includes(userEmail) : false) || claims?.metadata?.role === "admin");

  if (isAdmin) {
    // If admin lands on auth routes, redirect them cleanly to target without loop
    if (isAuthRoute(req)) {
      const redirectTo = getSafeRedirectUrl(searchParams.get("redirect"));
      return NextResponse.redirect(new URL(redirectTo, req.url));
    }

    // Check if admin already has cookies set in incoming request to avoid infinite response looping
    const hasAdminCookies =
      req.cookies.get("agri_session_verified")?.value === "true" &&
      req.cookies.get("agri_session_id")?.value === "AGRI-ADMIN-001";

    const response = nextWithHeaders();

    if (!hasAdminCookies) {
      console.log(`⚡ [ADMIN BYPASS] Auto-minting AGRI-ADMIN-001 session for ${userEmail ?? "Admin"} at ${pathname}`);
      
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

  // 3. REQUIRE CLERK LOGIN (TIER 1)
  if (isProtectedRoute(req) && !userId) {
    const unauthorizedUrl = new URL("/unauthorized", req.url);
    unauthorizedUrl.searchParams.set("redirect_url", pathname);
    return NextResponse.redirect(unauthorizedUrl);
  }

  // 4. PREVENT AUTH LOOPS FOR FULLY VERIFIED REGULAR USERS
  // If a regular user with valid cookies lands on /login-agri or /register-agri, send them to dashboard
  if (isAuthRoute(req) && userId) {
    const agriVerified = req.cookies.get("agri_session_verified")?.value;
    const agriSessionId = req.cookies.get("agri_session_id")?.value;

    if (agriVerified === "true" && agriSessionId) {
      const targetDestination = getSafeRedirectUrl(searchParams.get("redirect"));
      return NextResponse.redirect(new URL(targetDestination, req.url));
    }
  }

  // 5. CLEAR STALE SESSIONS
  if (isAuthRoute(req) && searchParams.get("invalid") === "1") {
    const response = nextWithHeaders();
    response.cookies.delete({ name: "agri_session_verified", path: "/" });
    response.cookies.delete({ name: "agri_session_id", path: "/" });
    return response;
  }

  // 6. PASS REGULAR UNVERIFIED USERS THROUGH TO LAYOUT / PAGE
  // DashboardLayout and protectAgriRoute will query Prisma to decide between /register-agri or /login-agri
  return nextWithHeaders();
});

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|json|png|jpg|jpeg|webp|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};