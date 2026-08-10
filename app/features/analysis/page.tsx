// app/features/analysis/page.tsx
import { requireAgriUser } from "@/lib/auth-guard";
import { prisma } from "@/lib/prisma";
import { BarChart3, TrendingUp, Activity } from "lucide-react";

export default async function BudgetPerformanceAnalysisPage() {
  await requireAgriUser();

  const items = await prisma.workPlan.findMany({
    include: {
      performance: true,
    },
  });

  // Aggregators for Line Graphs
  const componentTotals: Record<string, { estimated: number; disbursed: number }> = {};
  const categoryTotals: Record<string, { estimated: number; disbursed: number }> = {};

  items.forEach((item) => {
    const estimated = item.totalCostEstimate || 0;
    const disbursed = item.performance?.amountDisbursed || 0;
    const cat = item.budgetCategory || "OTHER";
    const comp = item.componentName || "Uncategorized";

    if (!componentTotals[comp]) {
      componentTotals[comp] = { estimated: 0, disbursed: 0 };
    }
    componentTotals[comp].estimated += estimated;
    componentTotals[comp].disbursed += disbursed;

    if (!categoryTotals[cat]) {
      categoryTotals[cat] = { estimated: 0, disbursed: 0 };
    }
    categoryTotals[cat].estimated += estimated;
    categoryTotals[cat].disbursed += disbursed;
  });

  const totalEstimated = items.reduce((acc, curr) => acc + (curr.totalCostEstimate || 0), 0);
  const totalDisbursed = items.reduce((acc, curr) => acc + (curr.performance?.amountDisbursed || 0), 0);
  const overallExecutionRate = totalEstimated > 0 ? Math.round((totalDisbursed / totalEstimated) * 100) : 0;

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <BarChart3 className="text-[#16a34a] w-7 h-7" /> Budget Performance & Trend Analysis
        </h1>
        <p className="text-sm text-slate-400 mt-1">
          Graphical trend comparison using line graphs mapping estimated target budgets against actual disbursements.
        </p>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Component Line Chart View */}
        <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-xl">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-lg font-semibold text-white flex items-center gap-2">
              <Activity className="w-5 h-5 text-[#16a34a]" /> Component Line Trend
            </h2>
            <div className="flex items-center gap-4 text-xs text-slate-400">
              <span className="flex items-center gap-1.5"><span className="w-3 h-0.5 bg-sky-400 inline-block"></span> Target</span>
              <span className="flex items-center gap-1.5"><span className="w-3 h-0.5 bg-[#16a34a] inline-block"></span> Actual</span>
            </div>
          </div>

          <div className="space-y-4">
            {Object.keys(componentTotals).length === 0 ? (
              <p className="text-slate-500 text-sm">No data available for components.</p>
            ) : (
              Object.entries(componentTotals).map(([name, data]) => {
                const maxVal = Math.max(data.estimated, data.disbursed, 1);
                const estWidth = Math.round((data.estimated / maxVal) * 100);
                const actWidth = Math.round((data.disbursed / maxVal) * 100);
                const pct = data.estimated > 0 ? Math.round((data.disbursed / data.estimated) * 100) : 0;

                return (
                  <div key={name} className="p-4 bg-slate-950 rounded-xl border border-slate-800">
                    <div className="flex justify-between items-center text-sm font-medium text-white mb-2">
                      <span className="truncate max-w-[220px]">{name}</span>
                      <span className="font-mono text-[#16a34a] text-xs font-semibold">{pct}% Executed</span>
                    </div>

                    <div className="space-y-2 font-mono text-xs">
                      {/* Target Line Simulator */}
                      <div>
                        <div className="flex justify-between text-slate-400 mb-1">
                          <span>Target</span>
                          <span>${data.estimated.toLocaleString()}</span>
                        </div>
                        <div className="w-full bg-slate-900 h-2 rounded-full overflow-hidden">
                          <div className="bg-sky-400 h-full rounded-full" style={{ width: `${estWidth}%` }} />
                        </div>
                      </div>

                      {/* Actual Disbursed Line Simulator */}
                      <div>
                        <div className="flex justify-between text-slate-400 mb-1">
                          <span>Actual</span>
                          <span>${data.disbursed.toLocaleString()}</span>
                        </div>
                        <div className="w-full bg-slate-900 h-2 rounded-full overflow-hidden">
                          <div className="bg-[#16a34a] h-full rounded-full" style={{ width: `${actWidth}%` }} />
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Category Line Chart View */}
        <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-xl">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-lg font-semibold text-white flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-emerald-400" /> Category Line Trend
            </h2>
            <div className="flex items-center gap-4 text-xs text-slate-400">
              <span className="flex items-center gap-1.5"><span className="w-3 h-0.5 bg-sky-400 inline-block"></span> Target</span>
              <span className="flex items-center gap-1.5"><span className="w-3 h-0.5 bg-emerald-400 inline-block"></span> Actual</span>
            </div>
          </div>

          <div className="space-y-4">
            {Object.keys(categoryTotals).length === 0 ? (
              <p className="text-slate-500 text-sm">No data available for categories.</p>
            ) : (
              Object.entries(categoryTotals).map(([cat, data]) => {
                const maxVal = Math.max(data.estimated, data.disbursed, 1);
                const estWidth = Math.round((data.estimated / maxVal) * 100);
                const actWidth = Math.round((data.disbursed / maxVal) * 100);
                const pct = data.estimated > 0 ? Math.round((data.disbursed / data.estimated) * 100) : 0;

                return (
                  <div key={cat} className="p-4 bg-slate-950 rounded-xl border border-slate-800">
                    <div className="flex justify-between items-center text-sm font-medium text-white mb-2">
                      <span className="uppercase text-xs tracking-wider font-semibold text-emerald-400">{cat}</span>
                      <span className="font-mono text-emerald-400 text-xs font-semibold">{pct}% Executed</span>
                    </div>

                    <div className="space-y-2 font-mono text-xs">
                      {/* Target Line Simulator */}
                      <div>
                        <div className="flex justify-between text-slate-400 mb-1">
                          <span>Target</span>
                          <span>${data.estimated.toLocaleString()}</span>
                        </div>
                        <div className="w-full bg-slate-900 h-2 rounded-full overflow-hidden">
                          <div className="bg-sky-400 h-full rounded-full" style={{ width: `${estWidth}%` }} />
                        </div>
                      </div>

                      {/* Actual Disbursed Line Simulator */}
                      <div>
                        <div className="flex justify-between text-slate-400 mb-1">
                          <span>Actual</span>
                          <span>${data.disbursed.toLocaleString()}</span>
                        </div>
                        <div className="w-full bg-slate-900 h-2 rounded-full overflow-hidden">
                          <div className="bg-emerald-500 h-full rounded-full" style={{ width: `${actWidth}%` }} />
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
}