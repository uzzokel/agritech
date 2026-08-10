// app/features/performance/PerformanceClientTable.tsx
"use client";

import { useState } from "react";
import { updatePerformanceItem } from "../actions";
import { Loader2, Download, Save } from "lucide-react";

export default function PerformanceClientTable({ initialItems }: { initialItems: any[] }) {
  const [items, setItems] = useState(initialItems);
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");

  const [formEdits, setFormEdits] = useState<Record<string, any>>(() => {
    const initial: Record<string, any> = {};
    initialItems.forEach((item) => {
      if (item.performance) {
        initial[item.performance.id] = {
          amountDisbursed: item.performance.amountDisbursed || 0,
          actualOutput: item.performance.actualOutput || "",
          statusFlag: item.performance.statusFlag || "GREEN",
        };
      }
    });
    return initial;
  });

  // Calculate automated flag based on performance percentage
  const calculateAutomaticFlag = (percent: number) => {
    if (percent < 50) return "RED";
    if (percent <= 80) return "AMBER";
    return "GREEN";
  };

  const handleChange = (perfId: string, field: string, value: any, estimatedCost: number) => {
    setFormEdits((prev) => {
      const updatedEntry = {
        ...prev[perfId],
        [field]: value,
      };

      // If amountDisbursed changes, automatically update the status flag
      if (field === "amountDisbursed") {
        const disbursed = parseFloat(value) || 0;
        const percent = estimatedCost > 0 ? Math.round((disbursed / estimatedCost) * 100) : 0;
        updatedEntry.statusFlag = calculateAutomaticFlag(percent);
      }

      return {
        ...prev,
        [perfId]: updatedEntry,
      };
    });
  };

  const handleSaveAll = async () => {
    setLoading(true);
    setSuccessMsg("");
    try {
      for (const [perfId, edits] of Object.entries(formEdits)) {
        await updatePerformanceItem(perfId, {
          amountDisbursed: parseFloat(edits.amountDisbursed) || 0,
          actualOutput: edits.actualOutput,
          statusFlag: edits.statusFlag,
        });
      }
      setSuccessMsg("All budget performance records uploaded and saved successfully!");
      setTimeout(() => setSuccessMsg(""), 4000);
    } catch (err) {
      console.error("Failed to save updates", err);
    } finally {
      setLoading(false);
    }
  };

  // Download complete table as CSV
  const handleDownloadCSV = () => {
    const headers = ["Component", "Description", "Estimated Cost", "Currency", "Time Frame", "Disbursed Actual", "Variance", "Performance %", "Result Progress", "Status Flag"];
    const rows = items.map((item) => {
      const perf = item.performance || {};
      const perfId = perf.id;
      const currentEdit = formEdits[perfId] || {};
      const estimated = item.totalCostEstimate || 0;
      const disbursed = parseFloat(currentEdit.amountDisbursed) || 0;
      const variance = estimated - disbursed;
      const percent = estimated > 0 ? Math.round((disbursed / estimated) * 100) : 0;
      const flag = currentEdit.statusFlag || calculateAutomaticFlag(percent);

      return [
        `"${item.componentName || ""}"`,
        `"${(item.description || "").replace(/"/g, '""')}"`,
        estimated,
        `"${item.currency || "USD"}"`,
        `"${item.timeFrame || ""}"`,
        disbursed,
        variance,
        `${percent}%`,
        `"${(currentEdit.actualOutput || "").replace(/"/g, '""')}"`,
        flag,
      ].join(",");
    });

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `budget_performance_report_${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getFlagBadge = (flag: string) => {
    switch (flag) {
      case "GREEN":
        return <span className="text-xs px-2.5 py-1 rounded-full bg-emerald-950 text-emerald-400 border border-emerald-800 font-medium">🟢 Green (&gt;80%)</span>;
      case "AMBER":
        return <span className="text-xs px-2.5 py-1 rounded-full bg-amber-950 text-amber-400 border border-amber-800 font-medium">🟡 Amber (50%-80%)</span>;
      case "RED":
        return <span className="text-xs px-2.5 py-1 rounded-full bg-red-950 text-red-400 border border-red-800 font-medium">🔴 Red (&lt;50%)</span>;
      default:
        return <span className="text-xs px-2.5 py-1 rounded-full bg-slate-950 text-slate-300 border border-slate-800 font-medium">🟢 Green</span>;
    }
  };

  return (
    <div>
      {/* Top Action Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div>
          {successMsg && (
            <span className="text-sm font-medium text-[#16a34a] bg-[#16a34a]/10 px-4 py-2 rounded-xl border border-[#16a34a]/30">
              {successMsg}
            </span>
          )}
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleDownloadCSV}
            className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium rounded-xl text-sm flex items-center gap-2 transition cursor-pointer"
          >
            <Download className="w-4 h-4 text-[#16a34a]" /> Download Report (CSV)
          </button>

          <button
            onClick={handleSaveAll}
            disabled={loading}
            className="px-5 py-2.5 bg-[#16a34a] hover:bg-[#15803d] text-white font-medium rounded-xl text-sm flex items-center gap-2 transition shadow-lg shadow-[#16a34a]/20 cursor-pointer"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Upload / Save Table
          </button>
        </div>
      </div>

      {/* Table Container */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-950/80 border-b border-slate-800 text-xs font-semibold text-slate-400">
                <th className="p-4">Component</th>
                <th className="p-4">Activity Description</th>
                <th className="p-4">Estimated Cost</th>
                <th className="p-4">Time Frame</th>
                <th className="p-4">Disbursed (Actual)</th>
                <th className="p-4">Variance</th>
                <th className="p-4">Performance (%)</th>
                <th className="p-4">Result Progress</th>
                <th className="p-4">Flag</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 text-sm">
              {items.length === 0 ? (
                <tr>
                  <td colSpan={9} className="p-8 text-center text-slate-500">
                    No workplan items found for referencing. Upload a workplan first.
                  </td>
                </tr>
              ) : (
                items.map((item) => {
                  const perf = item.performance || {};
                  const perfId = perf.id;
                  const currentEdit = formEdits[perfId] || {
                    amountDisbursed: perf.amountDisbursed || 0,
                    actualOutput: perf.actualOutput || "",
                    statusFlag: perf.statusFlag || "GREEN",
                  };

                  const estimated = item.totalCostEstimate || 0;
                  const disbursed = parseFloat(currentEdit.amountDisbursed) || 0;
                  const variance = estimated - disbursed;
                  const percent = estimated > 0 ? Math.round((disbursed / estimated) * 100) : 0;
                  const automatedFlag = calculateAutomaticFlag(percent);

                  return (
                    <tr key={item.id} className="hover:bg-slate-800/40 transition">
                      <td className="p-4 font-medium text-white max-w-[160px] truncate">{item.componentName}</td>
                      <td className="p-4 text-slate-300 max-w-[200px] truncate" title={item.description}>
                        {item.description}
                      </td>
                      <td className="p-4 font-mono text-emerald-400">
                        {item.currency} {estimated.toLocaleString()}
                      </td>
                      <td className="p-4 text-xs text-slate-400">{item.timeFrame}</td>

                      {/* Actual Disbursed Input */}
                      <td className="p-4 font-mono">
                        <input
                          type="number"
                          step="0.01"
                          value={currentEdit.amountDisbursed}
                          onChange={(e) => handleChange(perfId, "amountDisbursed", e.target.value, estimated)}
                          className="w-28 px-3 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-[#16a34a]"
                        />
                      </td>

                      {/* Variance */}
                      <td className={`p-4 font-mono ${variance < 0 ? "text-red-400 font-semibold" : "text-slate-300"}`}>
                        ${variance.toLocaleString()}
                      </td>

                      {/* Performance percentage */}
                      <td className="p-4 font-semibold text-[#16a34a]">
                        {percent}%
                      </td>

                      {/* Result Progress Input */}
                      <td className="p-4 text-slate-300">
                        <input
                          type="text"
                          value={currentEdit.actualOutput}
                          onChange={(e) => handleChange(perfId, "actualOutput", e.target.value, estimated)}
                          className="w-full px-3 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-white text-xs focus:outline-none focus:border-[#16a34a]"
                          placeholder="Progress notes..."
                        />
                      </td>

                      {/* Status Flag Badge (Automated) */}
                      <td className="p-4 whitespace-nowrap">
                        {getFlagBadge(automatedFlag)}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}