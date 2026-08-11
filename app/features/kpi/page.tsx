"use client";

import { useState, useEffect } from "react";
import {
  createPerformanceTarget,
  getPerformanceTargets,
  createOrUpdatePerformanceActual,
  getPerformanceMonitoringData,
} from "../actions";
import {
  Loader2,
  CheckCircle2,
  ShieldAlert,
  PlusCircle,
  Target,
  TrendingUp,
} from "lucide-react";

const COMPONENTS = [
  "Component 1: Capacity building",
  "Component 2: Agribusiness investment",
  "Component 3: Grants and supports",
  "Component 4: Monitoring and evaluation",
  "Component 5: Project Management",
] as const;

interface TargetItem {
  id: string;
  componentName: string;
  expectedOutcomes: string;
  targetPercentage: number;
  baselineValue: number;
  meansOfVerification: string;
  timeFrame: string;
  responsiblePerson: string;
}

interface MonitoringItem extends TargetItem {
  actuals?: {
    actualValue: number;
    remarks?: string | null;
  }[];
}

export default function KPITrackingPage() {
  const [activeSubTab, setActiveSubTab] = useState<"targets" | "monitoring">("targets");

  // Common States
  const [loading, setLoading] = useState(false);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [fetching, setFetching] = useState(true);
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  // Targets State
  const [targets, setTargets] = useState<TargetItem[]>([]);
  const [targetForm, setTargetForm] = useState({
    componentName: COMPONENTS[0],
    expectedOutcomes: "",
    targetPercentage: "",
    baselineValue: "",
    meansOfVerification: "",
    timeFrame: "",
    responsiblePerson: "",
  });

  // Monitoring State
  const [monitoringData, setMonitoringData] = useState<MonitoringItem[]>([]);
  const [actualsInput, setActualsInput] = useState<
    Record<string, { actualValue: string; remarks: string }>
  >({});

  useEffect(() => {
    if (activeSubTab === "targets") fetchTargets();
    if (activeSubTab === "monitoring") fetchMonitoringData();
  }, [activeSubTab]);

  const fetchTargets = async () => {
    setFetching(true);
    try {
      const res = await getPerformanceTargets();
      if (res.success && res.data) setTargets(res.data);
    } catch {
      setErrorMsg("Failed to load target indicators.");
    } finally {
      setFetching(false);
    }
  };

  const fetchMonitoringData = async () => {
    setFetching(true);
    try {
      const res = await getPerformanceMonitoringData();
      if (res.success && res.data) {
        setMonitoringData(res.data);
        const initialMap: Record<string, { actualValue: string; remarks: string }> = {};
        res.data.forEach((item) => {
          const latest = item.actuals?.[0];
          initialMap[item.id] = {
            actualValue: latest ? String(latest.actualValue) : "",
            remarks: latest?.remarks || "",
          };
        });
        setActualsInput(initialMap);
      }
    } catch {
      setErrorMsg("Failed to load monitoring data.");
    } finally {
      setFetching(false);
    }
  };

  const handleSaveTarget = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg("");
    setSuccessMsg("");

    try {
      const res = await createPerformanceTarget({
        ...targetForm,
        targetPercentage: parseFloat(targetForm.targetPercentage) || 0,
        baselineValue: parseFloat(targetForm.baselineValue) || 0,
      });

      if (res.success) {
        setSuccessMsg("KPI Target saved successfully!");
        setTargetForm({
          componentName: COMPONENTS[0],
          expectedOutcomes: "",
          targetPercentage: "",
          baselineValue: "",
          meansOfVerification: "",
          timeFrame: "",
          responsiblePerson: "",
        });
        fetchTargets();
      } else {
        setErrorMsg(res.error || "Failed to save target.");
      }
    } catch {
      setErrorMsg("An unexpected error occurred while saving.");
    } finally {
      setLoading(false);
    }
  };

  const computeProgress = (targetPct: number, baseline: number, actual: number) => {
    if (targetPct === baseline) {
      return actual >= targetPct ? 100 : 0;
    }
    return ((actual - baseline) / (targetPct - baseline)) * 100;
  };

  const computeRAG = (progress: number) => {
    if (progress >= 80) {
      return { text: "GREEN", cls: "bg-[#16a34a]/20 text-[#16a34a] border-[#16a34a]/30" };
    }
    if (progress >= 50) {
      return { text: "AMBER", cls: "bg-amber-500/20 text-amber-400 border-amber-500/30" };
    }
    return { text: "RED", cls: "bg-red-500/20 text-red-400 border-red-500/30" };
  };

  const handleSaveActual = async (targetId: string) => {
    const input = actualsInput[targetId];
    if (!input || input.actualValue === "") return;

    setSavingId(targetId);
    setSuccessMsg("");
    setErrorMsg("");

    try {
      const res = await createOrUpdatePerformanceActual({
        targetId,
        actualValue: parseFloat(input.actualValue) || 0,
        remarks: input.remarks,
      });

      if (res.success) {
        setSuccessMsg("KPI actual progress updated!");
        fetchMonitoringData();
      } else {
        setErrorMsg(res.error || "Failed to update performance actuals.");
      }
    } catch {
      setErrorMsg("An error occurred while updating actual progress.");
    } finally {
      setSavingId(null);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-3">
          <Target className="text-[#16a34a] w-7 h-7" /> Key Performance Indicators (KPI)
        </h1>
        <p className="text-slate-400 text-sm mt-1">
          Manage targets and record real-time monitoring progress for core components.
        </p>
      </div>

      {/* Sub-tabs */}
      <div className="flex border-b border-slate-800 gap-2">
        <button
          onClick={() => {
            setActiveSubTab("targets");
            setSuccessMsg("");
            setErrorMsg("");
          }}
          className={`flex items-center gap-2 px-5 py-3 font-semibold text-sm rounded-t-xl transition ${
            activeSubTab === "targets"
              ? "bg-slate-900 border-t border-x border-slate-800 text-[#16a34a]"
              : "text-slate-400 hover:text-slate-200"
          }`}
        >
          <Target className="w-4 h-4" /> KPI Planning (Targets)
        </button>
        <button
          onClick={() => {
            setActiveSubTab("monitoring");
            setSuccessMsg("");
            setErrorMsg("");
          }}
          className={`flex items-center gap-2 px-5 py-3 font-semibold text-sm rounded-t-xl transition ${
            activeSubTab === "monitoring"
              ? "bg-slate-900 border-t border-x border-slate-800 text-[#16a34a]"
              : "text-slate-400 hover:text-slate-200"
          }`}
        >
          <TrendingUp className="w-4 h-4" /> KPI Progress & RAG Flags
        </button>
      </div>

      {successMsg && (
        <div className="p-4 bg-[#16a34a]/10 border border-[#16a34a]/30 text-[#16a34a] rounded-xl flex items-center gap-3 text-sm">
          <CheckCircle2 className="w-5 h-5 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div className="p-4 bg-red-500/10 border border-red-500/30 text-red-400 rounded-xl flex items-center gap-3 text-sm">
          <ShieldAlert className="w-5 h-5 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* TAB 1: TARGET SETTING */}
      {activeSubTab === "targets" && (
        <div className="space-y-6">
          <form
            onSubmit={handleSaveTarget}
            className="bg-slate-900 border border-slate-800 p-8 rounded-2xl space-y-6"
          >
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-2">
                Project Component *
              </label>
              <select
                value={targetForm.componentName}
                onChange={(e) =>
                  setTargetForm({ ...targetForm, componentName: e.target.value })
                }
                className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-white text-sm focus:outline-none focus:border-[#16a34a]"
              >
                {COMPONENTS.map((comp) => (
                  <option key={comp} value={comp}>
                    {comp}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-2">
                Expected Outcome / KPI Indicator *
              </label>
              <textarea
                rows={2}
                value={targetForm.expectedOutcomes}
                onChange={(e) =>
                  setTargetForm({ ...targetForm, expectedOutcomes: e.target.value })
                }
                placeholder="Describe the target outcome or measurable indicator..."
                className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-white text-sm focus:outline-none focus:border-[#16a34a]"
                required
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-2">
                  Baseline Value (%) *
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={targetForm.baselineValue}
                  onChange={(e) =>
                    setTargetForm({ ...targetForm, baselineValue: e.target.value })
                  }
                  placeholder="0.0"
                  className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-white text-sm focus:outline-none focus:border-[#16a34a]"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-2">
                  Target Percentage (%) *
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={targetForm.targetPercentage}
                  onChange={(e) =>
                    setTargetForm({ ...targetForm, targetPercentage: e.target.value })
                  }
                  placeholder="100.0"
                  className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-white text-sm focus:outline-none focus:border-[#16a34a]"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-2">
                  Means of Verification *
                </label>
                <input
                  type="text"
                  value={targetForm.meansOfVerification}
                  onChange={(e) =>
                    setTargetForm({
                      ...targetForm,
                      meansOfVerification: e.target.value,
                    })
                  }
                  placeholder="e.g. Audit Reports, Field Surveys"
                  className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-white text-sm focus:outline-none focus:border-[#16a34a]"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-2">
                  Time Frame *
                </label>
                <input
                  type="text"
                  value={targetForm.timeFrame}
                  onChange={(e) =>
                    setTargetForm({ ...targetForm, timeFrame: e.target.value })
                  }
                  placeholder="e.g. Q4 2026, Bi-Annually"
                  className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-white text-sm focus:outline-none focus:border-[#16a34a]"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-2">
                  Responsible Person *
                </label>
                <input
                  type="text"
                  value={targetForm.responsiblePerson}
                  onChange={(e) =>
                    setTargetForm({
                      ...targetForm,
                      responsiblePerson: e.target.value,
                    })
                  }
                  placeholder="e.g. Lead M&E Officer"
                  className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-white text-sm focus:outline-none focus:border-[#16a34a]"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 bg-[#16a34a] hover:bg-[#15803d] disabled:opacity-50 text-white font-semibold rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer"
            >
              {loading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <PlusCircle className="w-5 h-5" />
              )}{" "}
              Save Target Indicator
            </button>
          </form>

          <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl">
            <h2 className="text-sm font-semibold text-slate-300 mb-4">
              Registered Target Indicators ({targets.length})
            </h2>
            {fetching ? (
              <div className="flex justify-center py-8 text-slate-500">
                <Loader2 className="w-6 h-6 animate-spin" />
              </div>
            ) : (
              <div className="max-h-80 overflow-y-auto">
                <table className="w-full text-left text-xs text-slate-300">
                  <thead className="sticky top-0 bg-slate-900 text-slate-400 border-b border-slate-800">
                    <tr>
                      <th className="p-3">Component</th>
                      <th className="p-3">Indicator</th>
                      <th className="p-3">Baseline</th>
                      <th className="p-3">Target</th>
                      <th className="p-3">Responsible</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800">
                    {targets.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="text-center py-6 text-slate-500">
                          No indicators registered yet.
                        </td>
                      </tr>
                    ) : (
                      targets.map((t) => (
                        <tr key={t.id}>
                          <td className="p-3 text-white font-medium">
                            {t.componentName}
                          </td>
                          <td className="p-3 truncate max-w-xs">
                            {t.expectedOutcomes}
                          </td>
                          <td className="p-3 font-mono">{t.baselineValue}%</td>
                          <td className="p-3 font-mono text-[#16a34a] font-bold">
                            {t.targetPercentage}%
                          </td>
                          <td className="p-3">{t.responsiblePerson}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: PROGRESS & RAG MONITORING */}
      {activeSubTab === "monitoring" && (
        <div className="bg-slate-900 border border-slate-800 p-8 rounded-2xl space-y-6">
          {fetching ? (
            <div className="flex justify-center py-12 text-slate-500">
              <Loader2 className="w-8 h-8 animate-spin text-[#16a34a]" />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-300 border border-slate-800 rounded-xl overflow-hidden">
                <thead className="bg-slate-950 text-slate-400 border-b border-slate-800">
                  <tr>
                    <th className="p-3">Component / Indicator</th>
                    <th className="p-3">Baseline</th>
                    <th className="p-3">Target</th>
                    <th className="p-3">Actual Achieved (%)</th>
                    <th className="p-3">Progress (%)</th>
                    <th className="p-3">Dynamic Flag</th>
                    <th className="p-3">Remarks / Narration</th>
                    <th className="p-3">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {monitoringData.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="text-center py-8 text-slate-500">
                        No indicators registered yet. Please add target indicators first.
                      </td>
                    </tr>
                  ) : (
                    monitoringData.map((item) => {
                      const currentActualStr =
                        actualsInput[item.id]?.actualValue ?? "";
                      const currentActualNum = parseFloat(currentActualStr);

                      const hasValidActual =
                        currentActualStr !== "" && !isNaN(currentActualNum);

                      const progressVal = hasValidActual
                        ? computeProgress(
                            item.targetPercentage,
                            item.baselineValue,
                            currentActualNum
                          )
                        : null;

                      const flag = progressVal !== null ? computeRAG(progressVal) : null;
                      const isSaving = savingId === item.id;

                      return (
                        <tr
                          key={item.id}
                          className="hover:bg-slate-800/30 transition-colors"
                        >
                          <td className="p-3">
                            <div className="font-semibold text-white">
                              {item.componentName}
                            </div>
                            <div className="text-slate-400 truncate max-w-xs">
                              {item.expectedOutcomes}
                            </div>
                          </td>
                          <td className="p-3 font-mono">{item.baselineValue}%</td>
                          <td className="p-3 font-mono text-[#16a34a] font-semibold">
                            {item.targetPercentage}%
                          </td>
                          <td className="p-3">
                            <input
                              type="number"
                              step="0.1"
                              placeholder="e.g. 75"
                              value={currentActualStr}
                              onChange={(e) =>
                                setActualsInput((prev) => ({
                                  ...prev,
                                  [item.id]: {
                                    actualValue: e.target.value,
                                    remarks: prev[item.id]?.remarks || "",
                                  },
                                }))
                              }
                              className="w-24 px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-white text-xs focus:outline-none focus:border-[#16a34a]"
                            />
                          </td>
                          {/* Computed Progress Column */}
                          <td className="p-3 font-mono font-bold text-slate-200">
                            {progressVal !== null ? (
                              `${progressVal.toFixed(1)}%`
                            ) : (
                              <span className="text-slate-600">—</span>
                            )}
                          </td>
                          <td className="p-3">
                            {flag ? (
                              <span
                                className={`px-2.5 py-1 rounded-full text-[10px] font-bold border ${flag.cls}`}
                              >
                                {flag.text}
                              </span>
                            ) : (
                              <span className="text-slate-600">—</span>
                            )}
                          </td>
                          <td className="p-3">
                            <input
                              type="text"
                              placeholder="Add remarks..."
                              value={actualsInput[item.id]?.remarks || ""}
                              onChange={(e) =>
                                setActualsInput((prev) => ({
                                  ...prev,
                                  [item.id]: {
                                    actualValue: prev[item.id]?.actualValue || "",
                                    remarks: e.target.value,
                                  },
                                }))
                              }
                              className="w-full px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-white text-xs focus:outline-none focus:border-[#16a34a]"
                            />
                          </td>
                          <td className="p-3">
                            <button
                              type="button"
                              onClick={() => handleSaveActual(item.id)}
                              disabled={isSaving}
                              className="px-3 py-1.5 bg-[#16a34a] hover:bg-[#15803d] disabled:opacity-50 text-white font-medium rounded-lg text-xs transition-all flex items-center gap-1 cursor-pointer"
                            >
                              {isSaving && <Loader2 className="w-3 h-3 animate-spin" />}
                              Save
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}