// app/dashboard/layout.tsx
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { auth, currentUser } from "@clerk/nextjs/server";
import { isAdminUser } from "@/lib/admin";
import { ensureAdminUserRecord } from "@/lib/admin-server";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { userId: clerkUserId } = await auth();

  if (!clerkUserId) {
    redirect("/unauthorized");
  }

  const clerkUser = await currentUser();

  // 👑 1. ADMIN BYPASS & AUTO-PROVISIONING
  if (isAdminUser(clerkUser)) {
    await ensureAdminUserRecord();

    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
        <main className="flex-1">{children}</main>
      </div>
    );
  }

  // 🔒 2. REGULAR USER CHECKS
  const cookieStore = await cookies();
  const agriVerified = cookieStore.get("agri_session_verified")?.value;
  const agriSessionId = cookieStore.get("agri_session_id")?.value;

  if (agriVerified !== "true" || !agriSessionId) {
    const email = clerkUser?.emailAddresses?.[0]?.emailAddress;

    const dbUser = await prisma.user.findFirst({
      where: {
        OR: [
          { clerkUserId },
          ...(email ? [{ email }] : [])
        ]
      },
      select: { id: true, status: true }
    });

    if (!dbUser) {
      redirect("/register-agri");
    }

    if (dbUser.status === "PENDING") {
      redirect("/register-agri?pending=1");
    }

    if (dbUser.status === "APPROVED") {
      redirect("/login-agri?redirectTo=/dashboard");
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      <main className="flex-1">{children}</main>
    </div>
  );
}