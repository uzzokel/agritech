// app/dashboard/predict-impact/page.tsx
import { redirect } from "next/navigation";
import { protectAgriRoute } from "../../../lib/agri-auth";
import DashboardPredictImpactView from "./DashboardPredictImpactView";

export default async function PredictImpactPage() {
  let user;
  
  try {
    user = await protectAgriRoute();
  } catch (error) {
    // protectAgriRoute might throw a NEXT_REDIRECT error which is normal, 
    // but catching and re-throwing ensures Next.js handles redirects properly.
    throw error;
  }

  // Check your Prisma schema properties for admin clearance
  const isAdmin = user?.role === "ADMIN" || user?.designation === "Admin";

  if (!isAdmin) {
    redirect("/dashboard");
  }

  return <DashboardPredictImpactView user={user} />;
}