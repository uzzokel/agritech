// app/dashboard/page.tsx
import { requireAgriUser } from "@/lib/auth-guard";
import { getFarmerRecords } from "./actions";
import DashboardClientView from "./DashboardClientView";

export default async function DashboardPage() {
  const dbUser = await requireAgriUser();

  const farmerResponse = await getFarmerRecords();
  const farmers = farmerResponse.success ? farmerResponse.data || [] : [];

  return (
    <DashboardClientView 
      user={dbUser as any} 
      initialFarmers={farmers} 
    />
  );
}