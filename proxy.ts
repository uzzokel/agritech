import { clerkMiddleware } from "@clerk/nextjs/server";

// ✅ Next.js 16 uses the default export of clerkMiddleware inside proxy.ts
export default clerkMiddleware();

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    '/((?!_next|[^?]*\\.[\\w]+$).*)',
    // Always run for API routes
    '/(api|trpc)(.*)',
  ],
};