// app/features/layout.tsx
import { requireAgriUser } from "@/lib/auth-guard";
import Link from "next/link";
import { FileSpreadsheet, BarChart3, TrendingUp, LayoutDashboard } from "lucide-react";

export default async function FeaturesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireAgriUser(); // Secure entire /features route group

  return (
    <div className="min-h-screen bg-[#0f172a] text-slate-100 flex py-30">
      {/* Sidebar Navigation */}
      <aside className="w-72 bg-slate-900 border-r border-slate-800 flex flex-col p-6 shrink-0">
        <div className="flex items-center gap-3 mb-8 px-2">
          <div className="w-9 h-9 rounded-xl bg-[#16a34a]/20 border border-[#16a34a]/30 flex items-center justify-center text-[#16a34a]">
            <LayoutDashboard className="w-5 h-5" />
          </div>
          <div>
            <h2 className="font-bold text-base tracking-wide text-white">AgriTech M&E</h2>
            <p className="text-xs text-slate-400">Workplan & Budgets</p>
          </div>
        </div>

        <nav className="space-y-2 flex-1">
          <Link
            href="/features"
            className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-slate-300 hover:bg-[#16a34a]/10 hover:text-[#16a34a] transition-all"
          >
            <FileSpreadsheet className="w-4 h-4 text-[#16a34a]" />
            Upload Workplan & Budget
          </Link>

          <Link
            href="/features/performance"
            className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-slate-300 hover:bg-[#16a34a]/10 hover:text-[#16a34a] transition-all"
          >
            <TrendingUp className="w-4 h-4 text-[#16a34a]" />
            Budget Performance
          </Link>

          <Link
            href="/features/analysis"
            className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-slate-300 hover:bg-[#16a34a]/10 hover:text-[#16a34a] transition-all"
          >
            <BarChart3 className="w-4 h-4 text-[#16a34a]" />
            Performance Analysis
          </Link>
        </nav>

        <div className="pt-6 border-t border-slate-800">
          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 text-xs text-slate-400">
            <span className="block font-semibold text-[#16a34a] mb-1">5 Core Components</span>
            Capacity, Agribusiness, Grants, M&E, Project Management
          </div>
        </div>
      </aside>

      {/* Main Content Pane */}
      <main className="flex-1 overflow-y-auto bg-[#0f172a] p-8">
        <div className="max-w-7xl mx-auto">{children}</div>
      </main>
    </div>
  );
}