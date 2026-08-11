// app/features/NavLinks.tsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  FileSpreadsheet,
  BarChart3,
  TrendingUp,
  Target,
} from "lucide-react";

const NAV_ITEMS = [
  {
    href: "/features",
    label: "Upload Workplan & Budget",
    icon: FileSpreadsheet,
  },
  {
    href: "/features/performance",
    label: "Budget Performance",
    icon: TrendingUp,
  },
  {
    href: "/features/analysis",
    label: "Performance Analysis",
    icon: BarChart3,
  },
  {
    href: "/features/kpi",
    label: "KPI Targets & Tracking",
    icon: Target,
  },
];

export function NavLinks() {
  const pathname = usePathname();

  return (
    <nav className="space-y-2 flex-1">
      {NAV_ITEMS.map((item) => {
        const Icon = item.icon;
        
        // Match exact route for root, or startsWith for sub-routes
        const isActive =
          item.href === "/features"
            ? pathname === "/features"
            : pathname.startsWith(item.href);

        return (
          <Link
            key={item.href}
            href={item.href}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
              isActive
                ? "bg-[#16a34a]/20 text-[#16a34a] font-semibold border border-[#16a34a]/30 shadow-sm"
                : "text-slate-300 hover:bg-[#16a34a]/10 hover:text-[#16a34a]"
            }`}
          >
            <Icon className={`w-4 h-4 ${isActive ? "text-[#16a34a]" : "text-slate-400"}`} />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}