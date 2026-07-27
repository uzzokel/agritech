// proxy.ts (or middleware.ts)
import { clerkMiddleware } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

const protectedPaths = ["/dashboard", "/features", "/blog"];
const authPaths = ["/login-agri", "/register-agri"];

export default clerkMiddleware(async (auth, req) => {
  const { userId } = await auth();
  const { pathname } = req.nextUrl;
  
  // Use the exact cookie name set by loginAgriUser
  const agriSession = req.cookies.get("agri_session_verified");

  const isProtectedAgriRoute = protectedPaths.some((path) =>
    pathname.startsWith(path)
  );
  const isAgriAuthRoute = authPaths.some((path) =>
    pathname.startsWith(path)
  );

  // CHECK 1: Protect /dashboard, /features, /blog
  if (isProtectedAgriRoute) {
    if (!userId) {
      console.log(`🔒 Clerk user missing! Redirecting ${pathname} to /sign-in`);
      const signInUrl = new URL("/sign-in", req.url);
      signInUrl.searchParams.set("redirect_url", req.url);
      return NextResponse.redirect(signInUrl);
    }
    // Signed-in Clerk users proceed to page components where protectAgriRoute() checks Prisma!
  }

  // CHECK 2: Prevent users with an active AGRI PIN session from visiting auth pages
  if (isAgriAuthRoute && agriSession && userId) {
    console.log(`⚡ Active Clerk + AGRI session detected! Redirecting away from ${pathname} to /dashboard`);
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }
});

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|json|png|jpg|jpeg|webp|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};