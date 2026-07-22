import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

// 1. Define routes that require a valid AGRI session
const isProtectedAgriRoute = createRouteMatcher([
  "/dashboard(.*)",
  "/features(.*)",
  "/blog(.*)",
]);

export default clerkMiddleware(async (auth, req) => {
  // 2. Intercept requests to protected routes
  if (isProtectedAgriRoute(req)) {
    const agriSession = req.cookies.get("agri_session_id");

    console.log("🛡️ PROXY CHECK:", req.nextUrl.pathname, "| Cookie found:", !!agriSession);

    // 3. If no AGRI session cookie, redirect to /register-agri
    if (!agriSession) {
      console.log("🚫 No AGRI session! Redirecting to /register-agri...");
      const registerUrl = new URL("/register-agri", req.url);
      return NextResponse.redirect(registerUrl);
    }
  }
});

export const config = {
  matcher: [
    // Skip Next.js internals and all static files
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|json|png|jpg|jpeg|webp|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    // Always run for API routes
    "/(api|trpc)(.*)",
  ],
};