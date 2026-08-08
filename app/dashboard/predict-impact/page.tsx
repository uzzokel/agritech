// app/dashboard/predict-impact/page.tsx
import { redirect } from "next/navigation";
import { currentUser } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { isAdminUser } from "@/lib/admin";
import DashboardPredictImpactView from "./DashboardPredictImpactView";

export default async function PredictImpactPage() {
  const clerkUser = await currentUser();

  if (!clerkUser) {
    redirect("/login-agri");
  }

  // Fetch full user record from Prisma
  const user = await prisma.user.findFirst({
    where: {
      OR: [
        { clerkUserId: clerkUser.id },
        { email: clerkUser.emailAddresses[0]?.emailAddress?.toLowerCase() },
      ],
    },
  });

  // Verify Admin access via lib/admin helper or Prisma record
  const isAdmin = isAdminUser(clerkUser) || user?.role === "ADMIN" || user?.designation === "Admin";

  if (!isAdmin) {
    redirect("/dashboard");
  }

  return <DashboardPredictImpactView user={user} />;
}