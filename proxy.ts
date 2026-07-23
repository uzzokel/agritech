import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

// Define protected routes (Features, Blog, Dashboard)
const isProtectedAgriRoute = createRouteMatcher([
  "/dashboard(.*)",
  "/features(.*)",
  "/blog(.*)",
]);

export default clerkMiddleware(async (auth, req) => {
  if (isProtectedAgriRoute(req)) {
    const agriSession = req.cookies.get("agri_session_id");

    console.log("🛡️ PROXY CHECK:", req.nextUrl.pathname, "| Cookie found:", !!agriSession);

    // If no AGRI session cookie, redirect to /verify-id with the original destination
    if (!agriSession) {
      console.log(`🔒 Session missing! Redirecting from ${req.nextUrl.pathname} to /verify-id...`);
      
      const verifyUrl = new URL("/verify-id", req.url);
      // Store where the user wanted to go so we can return them there after verification
      verifyUrl.searchParams.set("redirect", req.nextUrl.pathname);
      
      return NextResponse.redirect(verifyUrl);
    }
  }
});

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|json|png|jpg|jpeg|webp|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};