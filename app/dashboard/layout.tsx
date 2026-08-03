// app/dashboard/layout.tsx
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { auth, currentUser } from "@clerk/nextjs/server";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const cookieStore = await cookies();
  const agriVerified = cookieStore.get("agri_session_verified")?.value;
  const agriSessionId = cookieStore.get("agri_session_id")?.value;

  // 1. If cookies are completely missing, check if the Clerk user has a registered profile in Prisma
  if (agriVerified !== "true" || !agriSessionId) {
    const { userId: clerkUserId } = await auth();
    
    if (clerkUserId) {
      const clerkUser = await currentUser();
      const email = clerkUser?.emailAddresses?.[0]?.emailAddress;

      // Check database for existing profile
      const dbUser = await prisma.user.findFirst({
        where: {
          OR: [
            { clerkUserId },
            ...(email ? [{ email }] : [])
          ]
        },
        select: { id: true, status: true }
      });

      // Scenario A: User has NEVER registered via Form A (/register-agri)
      if (!dbUser) {
        redirect("/register-agri");
      }

      // Scenario B: User registered, but status is still PENDING
      if (dbUser.status === "PENDING") {
        redirect("/register-agri?pending=1"); // or a dedicated pending notice page
      }

      // Scenario C: User is APPROVED, but hasn't entered their ID & PIN yet on /login-agri
      if (dbUser.status === "APPROVED") {
        redirect("/login-agri?redirect_url=/dashboard");
      }
    } else {
      redirect("/unauthorized");
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      <main className="flex-1">{children}</main>
    </div>
  );
}