// app/dashboard/page.tsx
import { redirect } from "next/navigation";
import { protectAgriRoute } from "@/lib/protect-route";
import { getFarmerRecords } from "./actions";
import DashboardClientView from "./DashboardClientView";

export default async function DashboardPage() {
  const dbUser = await protectAgriRoute();

  // If protectAgriRoute returns null, redirect to /register-agri instead of /sign-in
  // to stay aligned with your middleware's Tier-2 verification flow.
  if (!dbUser) {
    redirect("/register-agri");
  }

  const farmerResponse = await getFarmerRecords();
  const farmers = farmerResponse.success ? farmerResponse.data || [] : [];

  return (
    <DashboardClientView 
      user={dbUser as any} 
      initialFarmers={farmers} 
    />
  );
}