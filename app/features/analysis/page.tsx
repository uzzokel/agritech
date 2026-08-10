// app/features/analysis/page.tsx
import { requireAgriUser } from "@/lib/auth-guard";
import { prisma } from "@/lib/prisma";
import { BarChart3, TrendingUp, Activity } from "lucide-react";
import PerformanceLineGraph from "./PerformanceLineGraph";

export default async function BudgetPerformanceAnalysisPage() {
  await requireAgriUser();

  const items = await prisma.workPlan.findMany({
    include: {
      performance: true,
    },
  });

  // Aggregators for Line Graphs (Mapping to array format required by Recharts)
  const componentMap: Record<string, { category: string; Target: number; Actual: number }> = {};
  const categoryMap: Record<string, { category: string; Target: number; Actual: number }> = {};

  items.forEach((item) => {
    const estimated = item.totalCostEstimate || 0;
    const disbursed = item.performance?.amountDisbursed || 0;
    const cat = item.budgetCategory || "OTHER";
    const comp = item.componentName || "Uncategorized";

    // Aggregate by Component
    if (!componentMap[comp]) {
      componentMap[comp] = { category: comp, Target: 0, Actual: 0 };
    }
    componentMap[comp].Target += estimated;
    componentMap[comp].Actual += disbursed;

    // Aggregate by Category
    if (!categoryMap[cat]) {
      categoryMap[cat] = { category: cat, Target: 0, Actual: 0 };
    }
    categoryMap[cat].Target += estimated;
    categoryMap[cat].Actual += disbursed;
  });

  const componentChartData = Object.values(componentMap);
  const categoryChartData = Object.values(categoryMap);

  const totalEstimated = items.reduce((acc, curr) => acc + (curr.totalCostEstimate || 0), 0);
  const totalDisbursed = items.reduce((acc, curr) => acc + (curr.performance?.amountDisbursed || 0), 0);
  const overallExecutionRate = totalEstimated > 0 ? Math.round((totalDisbursed / totalEstimated) * 100) : 0;

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <BarChart3 className="text-[#16a34a] w-7 h-7" /> Budget Performance & Trend Analysis
        </h1>
        <p className="text-sm text-slate-400 mt-1">
          Graphical trend comparison using axis-based line charts mapping estimated target budgets against actual disbursements.
        </p>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-xl">
          <span className="text-xs text-slate-400 uppercase tracking-wider font-semibold">Total Target Budget</span>
          <div className="text-3xl font-bold text-white mt-2 font-mono">
            ${totalEstimated.toLocaleString()}
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-xl">
          <span className="text-xs text-slate-400 uppercase tracking-wider font-semibold">Total Actual Disbursed</span>
          <div className="text-3xl font-bold text-[#16a34a] mt-2 font-mono">
            ${totalDisbursed.toLocaleString()}
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-xl">
          <span className="text-xs text-slate-400 uppercase tracking-wider font-semibold">Overall Execution Rate</span>
          <div className="text-3xl font-bold text-amber-400 mt-2 font-mono flex items-center gap-2">
            <TrendingUp className="w-6 h-6" /> {overallExecutionRate}%
          </div>
        </div>
      </div>

      {/* Dual Line Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Component Line Chart */}
        <PerformanceLineGraph 
          title="Component Line Trend" 
          icon={<Activity className="w-5 h-5 text-[#16a34a]" />}
          data={componentChartData} 
        />

        {/* Category Line Chart */}
        <PerformanceLineGraph 
          title="Category Line Trend" 
          icon={<TrendingUp className="w-5 h-5 text-emerald-400" />}
          data={categoryChartData} 
        />
      </div>
    </div>
  );
}