// proxy.ts (or middleware.ts)
import { clerkMiddleware, createRouteMatcher, createClerkClient } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { ADMIN_EMAILS } from "@/lib/admin";

// 🛠️ 1. Extend Clerk's SessionClaims interface for custom JWT claims
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

const isProtectedRoute = createRouteMatcher([
  "/dashboard(.*)",
  "/features(.*)",
  "/blog(.*)",
]);

export default clerkMiddleware(async (auth, req) => {
  // 🛡️ BYPASS: Let Next.js Server Actions pass through instantly
  if (req.method === "POST" && req.headers.get("next-action")) {
    return NextResponse.next();
  }

  const { userId, sessionClaims } = await auth();
  const { pathname, searchParams } = req.nextUrl;

  // Safely cast claims to CustomSessionClaims
  const claims = sessionClaims as unknown as CustomSessionClaims;

  // Preserve existing request headers while forwarding x-pathname
  const requestHeaders = new Headers(req.headers);
  requestHeaders.set("x-pathname", pathname);

  // Helper for passthrough response carrying x-pathname header
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

  // 🚨 FAIL-SAFE: If Clerk userId exists but email claim is missing, fetch email via Clerk Client
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
    (
      (userEmail ? ADMIN_EMAILS.includes(userEmail) : false) ||
      claims?.metadata?.role === "admin"
    );

  if (isAdmin) {
    if (pathname.startsWith("/login-agri") || pathname.startsWith("/register-agri")) {
      const redirectTo = searchParams.get("redirect") || "/dashboard";
      return NextResponse.redirect(new URL(redirectTo, req.url));
    }

    console.log(`⚡ [ADMIN BYPASS] Auto-minting AGRI-ADMIN-001 session for ${userEmail ?? "Admin"} at ${pathname}`);

    const response = nextWithHeaders();

    // 🔑 Set cookies on response directly
    response.cookies.set("agri_session_verified", "true", { path: "/", httpOnly: false });
    response.cookies.set("agri_session_id", "AGRI-ADMIN-001", { path: "/", httpOnly: false });

    return response;
  }

  // 3. REQUIRE CLERK LOGIN: Send unauthenticated users to /unauthorized
  if (isProtectedRoute(req) && !userId) {
    const unauthorizedUrl = new URL("/unauthorized", req.url);
    unauthorizedUrl.searchParams.set("redirect_url", pathname);
    return NextResponse.redirect(unauthorizedUrl);
  }

  // 4. DELEGATE TIER-2 ROUTING FOR REGULAR USERS
  if (isProtectedRoute(req)) {
    const agriVerified = req.cookies.get("agri_session_verified")?.value;
    const agriSessionId = req.cookies.get("agri_session_id")?.value;

    if (agriVerified !== "true" || !agriSessionId) {
      console.log(`🔒 [REGULAR USER] Missing Tier-2 session for ${pathname}. Delegating routing to layout.tsx...`);
    }
  }

  // 5. PREVENT LOGIN LOOP: If already verified regular user, redirect away from auth pages
  if (
    (pathname.startsWith("/login-agri") || pathname.startsWith("/register-agri")) &&
    userId
  ) {
    const agriVerified = req.cookies.get("agri_session_verified")?.value;
    const agriSessionId = req.cookies.get("agri_session_id")?.value;

    if (agriVerified === "true" && agriSessionId) {
      // Respect 'redirect' param if user was heading somewhere specific (e.g. /features)
      const targetDestination = searchParams.get("redirect") || "/dashboard";
      return NextResponse.redirect(new URL(targetDestination, req.url));
    }
  }

  // 6. CLEAR STALE SESSIONS
  if (
    (pathname.startsWith("/login-agri") || pathname.startsWith("/register-agri")) &&
    searchParams.get("invalid") === "1"
  ) {
    const response = nextWithHeaders();
    response.cookies.delete({ name: "agri_session_verified", path: "/" });
    response.cookies.delete({ name: "agri_session_id", path: "/" });
    return response;
  }

  // Standard passthrough with custom headers attached
  return nextWithHeaders();
});

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|json|png|jpg|jpeg|webp|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};