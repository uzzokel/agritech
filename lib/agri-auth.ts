// lib/agri-auth.ts
import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";

// Define your admin emails here
const ADMIN_EMAILS = [
  "uzzokel@gmail.com",
];

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

  // BYPASS FOR ADMINS: If the email is in the admin list, skip DB record / PIN cookie checks!
  if (ADMIN_EMAILS.includes(primaryEmail)) {
    // Return a mock or minimal admin user object so components checking user.role or properties don't crash
    return {
      id: "admin-user-id",
      clerkUserId: clerkUser.id,
      email: primaryEmail,
      fullName: clerkUser.firstName || "Admin",
      role: "ADMIN",
      designation: "Admin",
      status: "APPROVED",
      phoneNumber: null,
      uniqueAdminId: "ADMIN-01",
      securityPin: "",
      lga: "",
      state: "",
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  }

  // 2. Query user in PostgreSQL using your prisma instance for regular users
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

  // STATE 3: User is APPROVED in DB, check AGRI-ID & PIN session cookie
  const cookieStore = await cookies();
  const agriSession = cookieStore.get("agri_session_id")?.value;

  if (!agriSession || agriSession !== dbUser.id) {
    console.log(`[AgriAuth] User ${primaryEmail} missing or invalid AGRI session cookie. Redirecting to /login-agri`);
    
    if (agriSession) {
      cookieStore.delete("agri_session_id");
    }

    redirect("/login-agri");
  }

  // STATE 4: All security checks passed! Return verified user
  return dbUser;
}