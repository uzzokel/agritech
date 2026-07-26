import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

// 1. Routes that require BOTH Clerk sign-in and AGRI ID/PIN verification
const isProtectedAgriRoute = createRouteMatcher([
  "/dashboard(.*)",
  "/features(.*)",
  "/blog(.*)",
]);

// 2. Auth routes that logged-in AGRI members shouldn't need to re-visit
const isAgriAuthRoute = createRouteMatcher([
  "/login-agri(.*)",
  "/register-agri(.*)",
]);

export default clerkMiddleware(async (auth, req) => {
  const { userId } = await auth(); // Check Clerk authentication state
  const agriSession = req.cookies.get("agri_session_id"); // Check AGRI PIN verification

  // CHECK 1: Protecting /dashboard, /features, /blog
  if (isProtectedAgriRoute(req)) {
    // A. User is NOT signed into Clerk -> force Clerk Sign-In / Register first
    if (!userId) {
      console.log(`🔒 Clerk user missing! Redirecting ${req.nextUrl.pathname} to /register-agri`);
      const registerUrl = new URL("/register-agri", req.url);
      registerUrl.searchParams.set("redirect", req.nextUrl.pathname);
      return NextResponse.redirect(registerUrl);
    }

    // B. User IS signed into Clerk, BUT hasn't submitted their AGRI-ID & PIN yet -> send to /login-agri
    if (!agriSession) {
      console.log(`🔑 AGRI PIN missing! Redirecting ${req.nextUrl.pathname} to /login-agri`);
      const loginUrl = new URL("/login-agri", req.url);
      loginUrl.searchParams.set("redirect", req.nextUrl.pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  // CHECK 2: User with an active AGRI session visiting /login-agri or /register-agri -> send straight to /dashboard
  if (isAgriAuthRoute(req) && agriSession && userId) {
    console.log(`⚡ Active Clerk + AGRI session detected! Redirecting away from ${req.nextUrl.pathname} to /dashboard`);
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }
});

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|json|png|jpg|jpeg|webp|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};