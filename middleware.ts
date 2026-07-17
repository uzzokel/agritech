// middleware.ts
import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

const isProtectedRoute = createRouteMatcher(["/features(.*)"]); 

export default clerkMiddleware(async (auth, req) => {
  if (isProtectedRoute(req)) {
    // ✅ No parentheses after 'auth' inside clerkMiddleware!
    await auth.protect(); 
  }
});

export const config = {
  matcher: [
    '/((?!_next|[^?]*\\.[\\w]+$).*)',
    '/(api|trpc)(.*)',
  ],
};