// app/dashboard/page.tsx
import React from "react";
import { protectAgriRoute } from "@/lib/protect-route";
import DashboardClientView from "./DashboardClientView";

export default async function DashboardPage() {
  // Enforces Clerk auth + DB registration + approval status + PIN session
  const dbUser = await protectAgriRoute();

  // Renders the full dashboard view with sidebar, overview metrics, and form toggles
  return <DashboardClientView user={dbUser} />;
}