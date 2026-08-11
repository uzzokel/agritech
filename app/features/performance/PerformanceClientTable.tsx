"use client";

import { useState, useMemo } from "react";
import { updatePerformanceItem } from "../actions";
import { Loader2, Download, Save, ChevronLeft, ChevronRight, Filter } from "lucide-react";

export default function PerformanceClientTable({ initialItems }: { initialItems: any[] }) {
  const [items, setItems] = useState(initialItems);
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");

  // Filter State (Category filter removed)
  const [selectedComponent, setSelectedComponent] = useState<string>("ALL");

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const [formEdits, setFormEdits] = useState<Record<string, any>>(() => {
    const initial: Record<string, any> = {};
    initialItems.forEach((item) => {
      const perfId = item.performance?.id || item.id;
      initial[perfId] = {
        amountDisbursed: item.performance?.amountDisbursed || 0,
        actualOutput: item.performance?.actualOutput || "",
        statusFlag: item.performance?.statusFlag || "GREEN",
      };
    });
    return initial;
  });

  // Unique list of components for filter dropdown
  const uniqueComponents = useMemo(() => {
    const set = new Set<string>();
    items.forEach((item) => {
      if (item.componentName) set.add(item.componentName);
    });
    return Array.from(set).sort();
  }, [items]);

  // Filtered items based on component selection
  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      return selectedComponent === "ALL" || item.componentName === selectedComponent;
    });
  }, [items, selectedComponent]);

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

  const handleDownloadCSV = () => {
    const headers = [
      "Component",
      "Activity Code",
      "Description",
      "Estimated Cost",
      "Currency",
      "Time Frame",
      "Disbursed Actual",
      "Variance",
      "Performance %",
      "Result Progress",
      "Status Flag",
    ];
    const rows = filteredItems.map((item) => {
      const perfId = item.performance?.id || item.id;
      const currentEdit = formEdits[perfId] || {};
      const estimated = item.totalCostEstimate || 0;
      const disbursed = parseFloat(currentEdit.amountDisbursed) || 0;
      const variance = estimated - disbursed;
      const percent = estimated > 0 ? Math.round((disbursed / estimated) * 100) : 0;
      const flag = currentEdit.statusFlag || calculateAutomaticFlag(percent);

      return [
        `"${item.componentName || ""}"`,
        `"${item.activityCode || item.code || item.id || ""}"`,
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
    link.setAttribute(
      "download",
      `budget_performance_report_${new Date().toISOString().split("T")[0]}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getFlagBadge = (flag: string) => {
    switch (flag) {
      case "GREEN":
        return (
          <span className="text-xs px-2.5 py-1 rounded-full bg-emerald-950 text-emerald-400 border border-emerald-800 font-medium">
            🟢 Green (&gt;80%)
          </span>
        );
      case "AMBER":
        return (
          <span className="text-xs px-2.5 py-1 rounded-full bg-amber-950 text-amber-400 border border-amber-800 font-medium">
            🟡 Amber (50%-80%)
          </span>
        );
      case "RED":
        return (
          <span className="text-xs px-2.5 py-1 rounded-full bg-red-950 text-red-400 border border-red-800 font-medium">
            🔴 Red (&lt;50%)
          </span>
        );
      default:
        return (
          <span className="text-xs px-2.5 py-1 rounded-full bg-slate-950 text-slate-300 border border-slate-800 font-medium">
            🟢 Green
          </span>
        );
    }
  };

  const totalPages = Math.ceil(filteredItems.length / itemsPerPage) || 1;
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentItems = filteredItems.slice(startIndex, endIndex);

  return (
    <div>
      {/* Top Action Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
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

      {/* Filter Bar */}
      <div className="flex flex-wrap items-center gap-4 p-4 mb-6 bg-slate-900/90 border border-slate-800 rounded-2xl shadow-md">
        <div className="flex items-center gap-2 text-slate-400 text-xs font-semibold uppercase tracking-wider">
          <Filter className="w-4 h-4 text-[#16a34a]" />
          <span>Filters:</span>
        </div>

        {/* Component Filter */}
        <div className="flex items-center gap-2">
          <label htmlFor="component-filter" className="text-xs text-slate-300 font-medium">
            Component:
          </label>
          <select
            id="component-filter"
            value={selectedComponent}
            onChange={(e) => {
              setSelectedComponent(e.target.value);
              setCurrentPage(1);
            }}
            className="px-3 py-1.5 bg-slate-950 border border-slate-700 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-[#16a34a]"
          >
            <option value="ALL">All Components</option>
            {uniqueComponents.map((comp) => (
              <option key={comp} value={comp}>
                {comp}
              </option>
            ))}
          </select>
        </div>

        {/* Reset Filter button */}
        {selectedComponent !== "ALL" && (
          <button
            onClick={() => {
              setSelectedComponent("ALL");
              setCurrentPage(1);
            }}
            className="text-xs text-slate-400 hover:text-red-400 underline transition cursor-pointer ml-auto"
          >
            Reset Filters
          </button>
        )}
      </div>

      {/* Table Container */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-950/80 border-b border-slate-800 text-xs font-semibold text-slate-400">
                <th className="p-4">Component</th>
                <th className="p-4">Activity Code</th>
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
              {filteredItems.length === 0 ? (
                <tr>
                  <td colSpan={10} className="p-8 text-center text-slate-500">
                    {items.length === 0
                      ? "No workplan items found for referencing. Upload a workplan first."
                      : "No items match the selected filter criteria."}
                  </td>
                </tr>
              ) : (
                currentItems.map((item) => {
                  const perfId = item.performance?.id || item.id;
                  const currentEdit = formEdits[perfId] || {
                    amountDisbursed: item.performance?.amountDisbursed || 0,
                    actualOutput: item.performance?.actualOutput || "",
                    statusFlag: item.performance?.statusFlag || "GREEN",
                  };

                  const estimated = item.totalCostEstimate || 0;
                  const disbursed = parseFloat(currentEdit.amountDisbursed) || 0;
                  const variance = estimated - disbursed;
                  const percent = estimated > 0 ? Math.round((disbursed / estimated) * 100) : 0;
                  const automatedFlag = calculateAutomaticFlag(percent);
                  const activityCode = item.activityCode || item.code || item.id;

                  return (
                    <tr key={item.id} className="hover:bg-slate-800/40 transition">
                      <td className="p-4 font-medium text-white max-w-[160px] truncate">
                        {item.componentName}
                      </td>
                      <td className="p-4 font-mono text-xs text-slate-400 max-w-[120px] truncate">
                        {activityCode || "-"}
                      </td>
                      <td
                        className="p-4 text-slate-300 max-w-[200px] truncate"
                        title={item.description}
                      >
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
                          onChange={(e) =>
                            handleChange(perfId, "amountDisbursed", e.target.value, estimated)
                          }
                          className="w-28 px-3 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-[#16a34a]"
                        />
                      </td>

                      {/* Variance */}
                      <td
                        className={`p-4 font-mono ${
                          variance < 0 ? "text-red-400 font-semibold" : "text-slate-300"
                        }`}
                      >
                        ${variance.toLocaleString()}
                      </td>

                      {/* Performance percentage */}
                      <td className="p-4 font-semibold text-[#16a34a]">{percent}%</td>

                      {/* Result Progress Input */}
                      <td className="p-4 text-slate-300">
                        <input
                          type="text"
                          value={currentEdit.actualOutput}
                          onChange={(e) =>
                            handleChange(perfId, "actualOutput", e.target.value, estimated)
                          }
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

        {/* Pagination Footer Controls */}
        {filteredItems.length > 0 && (
          <div className="flex items-center justify-between px-6 py-4 bg-slate-950/80 border-t border-slate-800 text-xs text-slate-400">
            <div>
              Showing <span className="font-semibold text-slate-200">{startIndex + 1}</span> to{" "}
              <span className="font-semibold text-slate-200">
                {Math.min(endIndex, filteredItems.length)}
              </span>{" "}
              of <span className="font-semibold text-slate-200">{filteredItems.length}</span> entries
            </div>

            <div className="flex items-center gap-4">
              <span className="font-medium text-slate-300">
                Page <span className="text-white font-semibold">{currentPage}</span> of{" "}
                <span className="text-white font-semibold">{totalPages}</span>
              </span>

              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                  className="p-1.5 bg-slate-900 border border-slate-700 rounded-lg hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed transition text-slate-200 cursor-pointer"
                  title="Previous Page"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>

                <button
                  type="button"
                  onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                  className="p-1.5 bg-slate-900 border border-slate-700 rounded-lg hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed transition text-slate-200 cursor-pointer"
                  title="Next Page"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}