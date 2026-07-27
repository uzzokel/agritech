// lib/protect-route.ts
import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";

export async function protectAgriRoute() {
  // 1. Check if user is authenticated with Clerk
  const clerkUser = await currentUser();
  if (!clerkUser) {
    console.log("[AgriAuth] ❌ No Clerk session found. Redirecting to /sign-in");
    redirect("/sign-in");
  }

  const primaryEmail = clerkUser.emailAddresses[0]?.emailAddress?.toLowerCase().trim();
  if (!primaryEmail) {
    console.log("[AgriAuth] ❌ No primary email on Clerk account. Redirecting to /sign-in");
    redirect("/sign-in");
  }

  // 2. Query Prisma by clerkUserId OR email (Case-insensitive check)
  let dbUser = await prisma.user.findFirst({
    where: {
      OR: [
        { clerkUserId: clerkUser.id },
        { email: { equals: primaryEmail, mode: "insensitive" } },
      ],
    },
  });

  // STATE 1: No record found in DB -> Brand new user must complete application form
  if (!dbUser) {
    console.log(`[AgriAuth] ❌ User '${primaryEmail}' (Clerk ID: ${clerkUser.id}) has no DB record. Redirecting to /register-agri`);
    redirect("/register-agri");
  }

  // Auto-link clerkUserId if it was missing from the DB record
  if (!dbUser.clerkUserId) {
    await prisma.user.update({
      where: { id: dbUser.id },
      data: { clerkUserId: clerkUser.id },
    });
  }

  // STATE 2: User record exists, but status is PENDING or DENIED
  if (dbUser.status !== "APPROVED") {
    console.log(`[AgriAuth] ⚠️ User '${primaryEmail}' status is '${dbUser.status}'. Redirecting to /pending-approval`);
    redirect("/pending-approval");
  }

  // STATE 3: Check AGRI-ID & PIN session cookie
  const cookieStore = await cookies();
  const agriSession = cookieStore.get("agri_session_verified")?.value;

  // Validate that the session cookie exists AND matches this user's uniqueAdminId
  if (!agriSession || agriSession !== dbUser.uniqueAdminId) {
    console.log(`[AgriAuth] 🔒 User '${primaryEmail}' missing/invalid PIN cookie (Expected: ${dbUser.uniqueAdminId}, Got: ${agriSession}). Redirecting to /login-agri`);
    redirect("/login-agri");
  }

  // STATE 4: All security checks passed! Return verified user
  return dbUser;
}