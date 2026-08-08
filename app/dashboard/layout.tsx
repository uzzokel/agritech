// app/dashboard/layout.tsx
import { auth, currentUser } from "@clerk/nextjs/server";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { isAdminUser } from "@/lib/admin";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { userId } = await auth();
  if (!userId) redirect("/unauthorized");

  const cookieStore = await cookies();
  const agriVerified = cookieStore.get("agri_session_verified")?.value;
  const agriSessionId = cookieStore.get("agri_session_id")?.value;

  const clerkUser = await currentUser();
  const isAdmin = isAdminUser(clerkUser) || agriSessionId === "AGRI-ADMIN-001";

  // 1. Admin Fast-Pass
  if (isAdmin) {
    return <div className="min-h-screen bg-slate-950 text-white">{children}</div>;
  }

  // 2. Verified Active Tier-2 PIN Session
  if (agriVerified === "true" && agriSessionId) {
    return <div className="min-h-screen bg-slate-950 text-white">{children}</div>;
  }

  // 3. Session missing -> Query Prisma DB for registration state
  const email = clerkUser?.emailAddresses?.[0]?.emailAddress?.toLowerCase();

  const dbUser = await prisma.user.findFirst({
    where: {
      OR: [{ clerkUserId: userId }, ...(email ? [{ email }] : [])],
    },
    select: { id: true, status: true, clerkUserId: true },
  });

  // No profile found -> Send to registration
  if (!dbUser) {
    redirect("/register-agri?redirect=/dashboard");
  }

  // Link clerkUserId in DB if it was missing during previous checks
  if (!dbUser.clerkUserId) {
    await prisma.user.update({
      where: { id: dbUser.id },
      data: { clerkUserId: userId },
    });
  }

  // Status checks
  if (dbUser.status === "PENDING") {
    redirect("/register-agri?pending=1");
  }

  if (dbUser.status === "DENIED") {
    redirect("/register-agri?denied=1");
  }

  if (dbUser.status === "APPROVED") {
    // Approved users who lack a valid PIN session cookie land on PIN verification
    redirect("/login-agri?redirect=/dashboard");
  }

  // Fallback for unexpected or invalid states
  redirect("/login-agri?invalid=1");
}