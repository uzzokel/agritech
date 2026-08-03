// proxy.ts (or middleware.ts)
import { clerkMiddleware } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

const protectedPaths = ["/dashboard", "/dashboard/reports", "/features", "/blog"];
const ADMIN_EMAIL = "uzzokel@gmail.com";

export default clerkMiddleware(async (auth, req) => {
  // 🛡️ BYPASS: Let Next.js Server Actions pass through instantly without redirection traps
  if (req.method === "POST" && req.headers.get("next-action")) {
    return NextResponse.next();
  }

  const { userId, sessionClaims } = await auth();
  const { pathname, searchParams } = req.nextUrl;

  const requestHeaders = new Headers(req.headers);
  requestHeaders.set("x-pathname", pathname);

  const isProtectedAgriRoute = protectedPaths.some((path) =>
    pathname.startsWith(path)
  );

  // 1. Require Clerk login for protected routes -> Redirect to /unauthorized with return URL
  if (isProtectedAgriRoute && !userId) {
    console.log(`🔒 Clerk user missing! Redirecting ${pathname} to /unauthorized`);
    const unauthorizedUrl = new URL("/unauthorized", req.url);
    unauthorizedUrl.searchParams.set("redirect_url", pathname);
    return NextResponse.redirect(unauthorizedUrl);
  }

  // 2. ADMIN BYPASS: If authenticated via Clerk as admin, grant direct access
  const userEmail =
    (sessionClaims?.email as string) ||
    (sessionClaims?.primaryEmail as string) ||
    (sessionClaims?.email_address as string);

  if (userId && userEmail === ADMIN_EMAIL) {
    return NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    });
  }

  // 3. PREVENT LOGIN LOOP: If user is already verified and hits /login-agri, send them to dashboard
  if (pathname.startsWith("/login-agri") && userId) {
    const agriVerified = req.cookies.get("agri_session_verified")?.value;
    const agriSessionId = req.cookies.get("agri_session_id")?.value;

    if (agriVerified === "true" && agriSessionId) {
      return NextResponse.redirect(new URL("/dashboard", req.url));
    }
  }

  // 4. Clean up stale session if redirected with ?invalid=1
  if (pathname.startsWith("/login-agri") && searchParams.get("invalid") === "1") {
    console.log("🧹 Clearing stale AGRI cookie due to session mismatch.");
    const response = NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    });
    response.cookies.delete({
      name: "agri_session_verified",
      path: "/",
    });
    return response;
  }

  // Default: proceed with modified request headers
  return NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });
});

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|json|png|jpg|jpeg|webp|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};