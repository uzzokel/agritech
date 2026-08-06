// proxy.ts (or middleware.ts)
import { clerkMiddleware, createRouteMatcher, createClerkClient } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { ADMIN_EMAILS } from "@/lib/admin";

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

  const requestHeaders = new Headers(req.headers);
  requestHeaders.set("x-pathname", pathname);

  // 1. EXTRACT USER EMAIL FROM CLAIMS
  let userEmail = (
    (sessionClaims?.email as string) ||
    (sessionClaims?.primaryEmail as string) ||
    (sessionClaims?.email_address as string)
  )?.toLowerCase();

  // 🚨 FAIL-SAFE: If Clerk userId exists but email claim is missing, fetch email via Clerk Client
  if (userId && !userEmail) {
    try {
      const clerk = createClerkClient({ secretKey: process.env.CLERK_SECRET_KEY });
      const user = await clerk.users.getUser(userId);
      userEmail = user.primaryEmailAddress?.emailAddress?.toLowerCase();
    } catch (err) {
      console.error("Failed to fetch Clerk user email in middleware:", err);
    }
  }

  // 👑 2. ADMIN CHECK & BYPASS
  const isAdmin =
    Boolean(userId) &&
    (
      (userEmail ? ADMIN_EMAILS.includes(userEmail) : false) ||
      sessionClaims?.metadata?.role === "admin"
    );

  if (isAdmin) {
    // Prevent Admins from ever visiting login or registration pages
    if (pathname.startsWith("/login-agri") || pathname.startsWith("/register-agri")) {
      return NextResponse.redirect(new URL("/dashboard", req.url));
    }

    console.log(`⚡ [ADMIN BYPASS] Auto-minting AGRI-ADMIN-001 session for ${userEmail} at ${pathname}`);

    const response = NextResponse.next({
      request: { headers: requestHeaders },
    });

    // 🔑 Auto-set cookies so client components recognize admin session as AGRI-ADMIN-001
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

  // 4. AGRI TIER-2 CHECK for regular non-admin users
  if (isProtectedRoute(req)) {
    const agriVerified = req.cookies.get("agri_session_verified")?.value;
    const agriSessionId = req.cookies.get("agri_session_id")?.value;

    if (agriVerified !== "true" || !agriSessionId) {
      console.log(`🔒 [REGULAR USER] Missing Agri Session. Redirecting ${pathname} to /login-agri`);
      const loginUrl = new URL("/login-agri", req.url);
      loginUrl.searchParams.set("redirectTo", pathname);
      return NextResponse.redirect(loginUrl);
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
      return NextResponse.redirect(new URL("/dashboard", req.url));
    }
  }

  // 6. CLEAR STALE SESSIONS
  if (
    (pathname.startsWith("/login-agri") || pathname.startsWith("/register-agri")) &&
    searchParams.get("invalid") === "1"
  ) {
    const response = NextResponse.next({
      request: { headers: requestHeaders },
    });
    response.cookies.delete({ name: "agri_session_verified", path: "/" });
    response.cookies.delete({ name: "agri_session_id", path: "/" });
    return response;
  }

  return NextResponse.next({
    request: { headers: requestHeaders },
  });
});

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|json|png|jpg|jpeg|webp|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};