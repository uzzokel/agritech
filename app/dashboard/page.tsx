// app/dashboard/page.tsx
import React from "react";
import { protectAgriRoute } from "@/lib/protect-route";
import { getFarmerRecords } from "./actions";
import DashboardClientView from "./DashboardClientView";
import { redirect } from "next/navigation";

export default async function DashboardPage() {
  const dbUser = await protectAgriRoute();

  // Redirect if no authenticated user session is found
  if (!dbUser) {
    redirect("/sign-in");
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