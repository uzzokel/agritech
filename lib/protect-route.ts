// lib/protect-route.ts
import { auth, currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { cookies, headers } from "next/headers";
import { prisma } from "@/lib/prisma";

const ADMIN_EMAILS = ["uzzokel@gmail.com"];

export async function protectAgriRoute(fallbackPath?: string) {
  // Get current pathname from incoming headers for seamless redirect targeting
  const headersList = await headers();
  const currentPath =
    fallbackPath ||
    headersList.get("x-pathname") ||
    headersList.get("next-url") ||
    "/dashboard";

  // 1. Clerk Authentication Check
  const { userId } = await auth();
  if (!userId) {
    redirect(`/login-agri?redirect=${encodeURIComponent(currentPath)}`);
  }

  // 2. ADMIN FAST-PASS: Check primary email via currentUser()
  const clerkUser = await currentUser();
  const userEmail = clerkUser?.emailAddresses?.[0]?.emailAddress;

  if (userEmail && ADMIN_EMAILS.includes(userEmail)) {
    const firstName = clerkUser?.firstName || "";
    const lastName = clerkUser?.lastName || "";
    const fullName = `${firstName} ${lastName}`.trim() || "Admin";

    // Admins bypass registration, approval status, and PIN checks completely
    return {
      id: "AGRI-ADMIN-001",
      clerkUserId: userId,
      email: userEmail,
      fullName,
      role: "ADMIN",
      status: "APPROVED",
      agriId: "AGRI-ADMIN-001",
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  }

  // 3. Query Prisma User Status (For regular users)
  let dbUser = null;
  try {
    dbUser = await prisma.user.findFirst({
      where: { clerkUserId: userId },
    });
  } catch (error) {
    console.error("Error fetching user in protectAgriRoute:", error);
  }

  // 4. User hasn't completed registration form
  if (!dbUser) {
    redirect("/register-agri");
  }

  // 5. User registered BUT NOT YET APPROVED
  if (dbUser.status !== "APPROVED") {
    redirect("/pending-approval");
  }

  // 6. User IS APPROVED -> Check active Security PIN session (Regular users only)
  const cookieStore = await cookies();
  const agriVerified = cookieStore.get("agri_session_verified")?.value;
  const agriSessionId = cookieStore.get("agri_session_id")?.value;

  // ✅ FIX: Check that the session is verified AND matches dbUser.id OR dbUser.uniqueAdminId
  const isValidSession =
    agriVerified === "true" &&
    (agriSessionId === dbUser.id || agriSessionId === dbUser.uniqueAdminId);

  if (!isValidSession) {
    // Pass the destination target back to /login-agri
    redirect(`/login-agri?redirect=${encodeURIComponent(currentPath)}`);
  }

  return dbUser;
}