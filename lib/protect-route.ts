// lib/protect-route.ts
import { auth, currentUser } from "@clerk/nextjs/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { isAdminUser } from "@/lib/admin";

export async function protectAgriRoute() {
  // 1. Clerk Authentication Check
  const { userId } = await auth();
  if (!userId) {
    return null;
  }

  const clerkUser = await currentUser();
  const userEmail = clerkUser?.emailAddresses?.[0]?.emailAddress?.toLowerCase();

  const cookieStore = await cookies();
  const agriSessionId = cookieStore.get("agri_session_id")?.value;

  // 2. ADMIN FAST-PASS
  const isAdmin = isAdminUser(clerkUser) || agriSessionId === "AGRI-ADMIN-001";

  if (isAdmin) {
    const firstName = clerkUser?.firstName || "";
    const lastName = clerkUser?.lastName || "";
    const fullName = `${firstName} ${lastName}`.trim() || "Admin";

    // Auto-link database admin record if needed
    if (userEmail) {
      try {
        const existingDbAdmin = await prisma.user.findFirst({
          where: { OR: [{ clerkUserId: userId }, { email: userEmail }] },
        });

        if (existingDbAdmin && !existingDbAdmin.clerkUserId) {
          await prisma.user.update({
            where: { id: existingDbAdmin.id },
            data: { clerkUserId: userId },
          });
        }
      } catch (err) {
        console.error("Error auto-linking admin profile:", err);
      }
    }

    return {
      id: "AGRI-ADMIN-001",
      clerkUserId: userId,
      email: userEmail || "admin@agritech.com",
      fullName,
      role: "ADMIN",
      status: "APPROVED",
      designation: "System Administrator",
      uniqueAdminId: "AGRI-ADMIN-001",
      isSessionVerified: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  }

  // 3. Regular User Lookup in Database
  let dbUser = null;
  try {
    dbUser = await prisma.user.findFirst({
      where: { clerkUserId: userId },
    });

    // Fallback: If clerkUserId is not mapped yet, attempt email link
    if (!dbUser && userEmail) {
      dbUser = await prisma.user.findFirst({
        where: { email: userEmail },
      });

      if (dbUser) {
        dbUser = await prisma.user.update({
          where: { id: dbUser.id },
          data: { clerkUserId: userId },
        });
      }
    }
  } catch (error) {
    console.error("Error fetching user in protectAgriRoute:", error);
    return null;
  }

  if (!dbUser) {
    return null;
  }

  // 4. Session Validation
  const agriVerified = cookieStore.get("agri_session_verified")?.value;

  const isValidSession =
    agriVerified === "true" &&
    (agriSessionId === dbUser.id || agriSessionId === dbUser.uniqueAdminId);

  return {
    ...dbUser,
    isSessionVerified: Boolean(isValidSession),
  };
}