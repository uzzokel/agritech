import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
export async function protectAgriRoute() {
  // 1. Check if user is authenticated with Clerk
  const clerkUser = await currentUser();
  if (!clerkUser) {
    redirect("/register-agri");
  }

  const primaryEmail = clerkUser.emailAddresses[0]?.emailAddress;
  if (!primaryEmail) {
    redirect("/register-agri");
  }

  // 2. Query user in PostgreSQL using your prisma instance
  const dbUser = await prisma.user.findUnique({
    where: { email: primaryEmail },
  });

  // STATE 1: No record found in DB -> User must complete application form
  if (!dbUser) {
    console.log(`[AgriAuth] User ${primaryEmail} has no DB record. Redirecting to /register-agri`);
    redirect("/register-agri");
  }

  // STATE 2: User record exists, but status is PENDING or DENIED
  if (dbUser.status !== "APPROVED") {
    console.log(`[AgriAuth] User ${primaryEmail} status is '${dbUser.status}'. Redirecting to /pending-approval`);
    redirect("/pending-approval");
  }

  // STATE 3: User is APPROVED in DB, but has not entered AGRI-ID & PIN for this session
  const cookieStore = await cookies();
  const agriSession = cookieStore.get("agri_session_id")?.value;

  if (!agriSession) {
    console.log(`[AgriAuth] User ${primaryEmail} missing AGRI cookie session. Redirecting to /login-agri`);
    redirect("/login-agri");
  }

  // STATE 4: All security checks passed! Return verified user
  return dbUser;
}