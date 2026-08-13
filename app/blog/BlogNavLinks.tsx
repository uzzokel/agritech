// app/blog/BlogNavLinks.tsx
"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  Newspaper,
  ShieldAlert,
  FileText,
  Cpu,
  ShoppingBag,
} from "lucide-react";

const BLOG_NAV_ITEMS = [
  {
    category: "insights",
    label: "Field Insights",
    icon: Newspaper,
  },
  {
    category: "advisories",
    label: "Advisories & Alerts",
    icon: ShieldAlert,
  },
  {
    category: "policy",
    label: "Policy Briefs",
    icon: FileText,
  },
  {
    category: "tech",
    label: "Tech Updates",
    icon: Cpu,
  },
  {
    category: "market",
    label: "Market Insights",
    icon: ShoppingBag,
  },
];

export function BlogNavLinks() {
  const searchParams = useSearchParams();
  const activeCategory = searchParams.get("category") || "insights";

  return (
    <nav className="space-y-2 flex-1">
      {BLOG_NAV_ITEMS.map((item) => {
        const Icon = item.icon;
        const isActive = activeCategory === item.category;

        return (
          <Link
            key={item.category}
            href={`/blog?category=${item.category}`}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
              isActive
                ? "bg-[#16a34a]/20 text-[#16a34a] font-semibold border border-[#16a34a]/30 shadow-sm"
                : "text-slate-300 hover:bg-[#16a34a]/10 hover:text-[#16a34a]"
            }`}
          >
            <Icon
              className={`w-4 h-4 ${
                isActive ? "text-[#16a34a]" : "text-slate-400"
              }`}
            />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}