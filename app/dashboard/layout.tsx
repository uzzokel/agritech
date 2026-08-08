// app/dashboard/layout.tsx
import { requireAgriUser } from "@/lib/auth-guard";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Executes entire 2-tier security flow and returns verified user object if valid
  await requireAgriUser();

  return <div className="min-h-screen bg-slate-950 text-white">{children}</div>;
}