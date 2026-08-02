// app/admin/components/AdminAnalytics.tsx
"use client";

import React, { useMemo } from "react";

interface AdminAnalyticsProps {
  farmers: any[];
}

export default function AdminAnalytics({ farmers }: AdminAnalyticsProps) {
  const analytics = useMemo(() => {
    const totalIncome = farmers.reduce(
      (sum, f) => sum + (Number(f.estimatedAnnualIncome) || 0),
      0
    );

    const avgIncome = farmers.length ? Math.round(totalIncome / farmers.length) : 0;

    // Enterprise distribution breakdown
    const enterpriseCounts: Record<string, number> = {};
    farmers.forEach((f) => {
      const ent = f.nameOfChosenEnterprise || "Unspecified";
      enterpriseCounts[ent] = (enterpriseCounts[ent] || 0) + 1;
    });

    const sortedEnterprises = Object.entries(enterpriseCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);

    // Regional (LGA) breakdown
    const lgaCounts: Record<string, number> = {};
    farmers.forEach((f) => {
      const lga = f.lga || "Unknown LGA";
      lgaCounts[lga] = (lgaCounts[lga] || 0) + 1;
    });

    const sortedLgas = Object.entries(lgaCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);

    return {
      totalIncome,
      avgIncome,
      sortedEnterprises,
      sortedLgas,
    };
  }, [farmers]);

  if (!farmers || farmers.length === 0) return null;

  return (
    <div className="space-y-6 mt-6">
      {/* Header Banner */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2">
          <span className="px-2.5 py-1 rounded-md bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-semibold uppercase tracking-wider">
            🛡️ Admin Analytics
          </span>
          <span className="text-xs text-slate-400">
            Real-time aggregate calculations across registered records
          </span>
        </div>
      </div>

      {/* Income Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="p-5 bg-slate-900/90 border border-slate-800 rounded-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-full blur-2xl pointer-events-none" />
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
            Total Portfolio Income
          </p>
          <div className="text-3xl font-extrabold text-emerald-400 font-mono mt-2">
            ₦{analytics.totalIncome.toLocaleString()}
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Across {farmers.length} registered farmers
          </p>
        </div>

        <div className="p-5 bg-slate-900/90 border border-slate-800 rounded-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 rounded-full blur-2xl pointer-events-none" />
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
            Average Income / Farmer
          </p>
          <div className="text-3xl font-extrabold text-blue-400 font-mono mt-2">
            ₦{analytics.avgIncome.toLocaleString()}
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Mean annual earnings index
          </p>
        </div>
      </div>

      {/* Enterprise & Location Distribution Bars */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="p-6 bg-slate-900/90 border border-slate-800 rounded-2xl space-y-4">
          <h4 className="font-bold text-white text-sm flex items-center justify-between">
            <span>🌾 Top Enterprises</span>
            <span className="text-xs font-normal text-slate-400">Headcount</span>
          </h4>
          <div className="space-y-3">
            {analytics.sortedEnterprises.map(([enterprise, count]) => {
              const percentage = Math.round((count / farmers.length) * 100);
              return (
                <div key={enterprise} className="space-y-1">
                  <div className="flex justify-between text-xs font-medium">
                    <span className="text-slate-200">{enterprise}</span>
                    <span className="text-slate-400">
                      {count} ({percentage}%)
                    </span>
                  </div>
                  <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="p-6 bg-slate-900/90 border border-slate-800 rounded-2xl space-y-4">
          <h4 className="font-bold text-white text-sm flex items-center justify-between">
            <span>📍 Regional Density (Top LGAs)</span>
            <span className="text-xs font-normal text-slate-400">Concentration</span>
          </h4>
          <div className="space-y-3">
            {analytics.sortedLgas.map(([lga, count]) => {
              const percentage = Math.round((count / farmers.length) * 100);
              return (
                <div key={lga} className="space-y-1">
                  <div className="flex justify-between text-xs font-medium">
                    <span className="text-slate-200">{lga}</span>
                    <span className="text-slate-400">
                      {count} farmers ({percentage}%)
                    </span>
                  </div>
                  <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-blue-500 rounded-full transition-all duration-500"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}