// app/features/performance/page.tsx
import { requireAgriUser } from "@/lib/auth-guard";
import { prisma } from "@/lib/prisma";
import PerformanceClientTable from "./PerformanceClientTable";

export default async function BudgetPerformancePage() {
  await requireAgriUser();

  // Fetch workplans alongside their linked performance data
  const items = await prisma.workPlan.findMany({
    include: {
      performance: true,
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white">Budget Performance Tracker</h1>
        <p className="text-sm text-slate-400 mt-1">
          Referencing data uploaded from the Workplan table to monitor actual disbursement versus estimates.
        </p>
      </div>

      <PerformanceClientTable initialItems={items} />
    </div>
  );
}