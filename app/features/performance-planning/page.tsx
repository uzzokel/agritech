"use client";

import { useState, useEffect } from "react";
import { createPerformanceTarget, getPerformanceTargets } from "@/actions/performance";
import { Loader2, PlusCircle, CheckCircle2, ShieldAlert, Target, FileText } from "lucide-react";

const COMPONENTS = [
  "Component 1: Capacity building",
  "Component 2: Agribusiness investment",
  "Component 3: Grants and supports",
  "Component 4: Monitoring and evaluation",
  "Component 5: Project Management",
] as const;

export default function PerformancePlanningPage() {
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [targets, setTargets] = useState<any[]>([]);

  const [form, setForm] = useState({
    componentName: COMPONENTS[0],
    expectedOutcomes: "",
    targetPercentage: 100,
    baselineValue: 0,
    meansOfVerification: "",
    timeFrame: "",
    responsiblePerson: "",
  });

  useEffect(() => {
    loadTargets();
  }, []);

  const loadTargets = async () => {
    setFetching(true);
    const res = await getPerformanceTargets();
    if (res.success && res.data) setTargets(res.data);
    setFetching(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg("");
    setSuccessMsg("");

    const res = await createPerformanceTarget(form);
    if (res.success) {
      setSuccessMsg("Performance target successfully created!");
      setForm({
        componentName: COMPONENTS[0],
        expectedOutcomes: "",
        targetPercentage: 100,
        baselineValue: 0,
        meansOfVerification: "",
        timeFrame: "",
        responsiblePerson: "",
      });
      loadTargets();
    } else {
      setErrorMsg(res.error || "Failed to save performance target.");
    }
    setLoading(false);
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <Target className="text-[#16a34a] w-7 h-7" /> Performance Planning (Table 1)
        </h1>
        <p className="text-sm text-slate-400 mt-1">
          Define KPI targets, baselines, verification methods, and timeframes by component.
        </p>
      </div>

      {successMsg && (
        <div className="p-4 bg-[#16a34a]/10 border border-[#16a34a]/30 text-[#16a34a] rounded-xl flex items-center gap-3 text-xs">
          <CheckCircle2 className="w-5 h-5 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div className="p-4 bg-red-500/10 border border-red-500/30 text-red-400 rounded-xl flex items-center gap-3 text-xs">
          <ShieldAlert className="w-5 h-5 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Input Form */}
      <form onSubmit={handleSubmit} className="bg-slate-900 border border-slate-800 p-8 rounded-2xl shadow-xl space-y-6">
        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-2">Column 1: Select Component *</label>
          <select
            value={form.componentName}
            onChange={(e) => setForm({ ...form, componentName: e.target.value })}
            className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-[#16a34a]"
            required
          >
            {COMPONENTS.map((comp) => (
              <option key={comp} value={comp}>{comp}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-2">Column 2: Expected Outcomes / KPI Narration (Max 300 words) *</label>
          <textarea
            rows={4}
            value={form.expectedOutcomes}
            onChange={(e) => setForm({ ...form, expectedOutcomes: e.target.value })}
            placeholder="Describe the expected outcomes and KPI target..."
            className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-[#16a34a]"
            required
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-2">Column 3: Target (%) *</label>
            <input
              type="number"
              step="any"
              value={form.targetPercentage}
              onChange={(e) => setForm({ ...form, targetPercentage: parseFloat(e.target.value) || 0 })}
              className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-[#16a34a]"
              required
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-2">Column 4: Baseline Value (Can be 0) *</label>
            <input
              type="number"
              step="any"
              value={form.baselineValue}
              onChange={(e) => setForm({ ...form, baselineValue: parseFloat(e.target.value) || 0 })}
              className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-[#16a34a]"
              required
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-2">Column 5: Means of Verification Narration *</label>
          <textarea
            rows={2}
            value={form.meansOfVerification}
            onChange={(e) => setForm({ ...form, meansOfVerification: e.target.value })}
            placeholder="e.g. M&E Field Inspection Reports, Verification Rosters"
            className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-[#16a34a]"
            required
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-2">Column 6: Timeframe to Achieve *</label>
            <input
              type="text"
              value={form.timeFrame}
              onChange={(e) => setForm({ ...form, timeFrame: e.target.value })}
              placeholder="e.g. Q3 2026 (Month 7 - Month 9)"
              className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-[#16a34a]"
              required
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-2">Column 7: Person / Unit Responsible *</label>
            <input
              type="text"
              value={form.responsiblePerson}
              onChange={(e) => setForm({ ...form, responsiblePerson: e.target.value })}
              placeholder="e.g. M&E Specialist / Component Lead"
              className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-[#16a34a]"
              required
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-4 bg-[#16a34a] hover:bg-[#15803d] text-white font-semibold rounded-xl transition flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-[#16a34a]/20 disabled:opacity-50"
        >
          {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <PlusCircle className="w-5 h-5" />}
          Save Performance Target
        </button>
      </form>

      {/* Preview Table */}
      <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-xl space-y-4">
        <h2 className="text-sm font-semibold text-slate-300 flex items-center gap-2">
          <FileText className="w-4 h-4 text-emerald-400" /> Performance Targets List ({targets.length})
        </h2>

        {fetching ? (
          <div className="py-8 text-center text-slate-500 text-xs">Loading targets...</div>
        ) : (
          <div className="max-h-80 overflow-y-auto overflow-x-auto rounded-lg">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="sticky top-0 bg-slate-900 border-b border-slate-800 text-slate-400 uppercase z-10">
                <tr>
                  <th className="pb-3 px-2">Component</th>
                  <th className="pb-3 px-2">Expected Outcome</th>
                  <th className="pb-3 px-2">Target (%)</th>
                  <th className="pb-3 px-2">Baseline</th>
                  <th className="pb-3 px-2">Timeframe</th>
                  <th className="pb-3 px-2">Responsible</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/50">
                {targets.map((t) => (
                  <tr key={t.id} className="hover:bg-slate-800/30">
                    <td className="py-3 px-2 font-medium text-white">{t.componentName}</td>
                    <td className="py-3 px-2 truncate max-w-xs">{t.expectedOutcomes}</td>
                    <td className="py-3 px-2 text-emerald-400 font-mono">{t.targetPercentage}%</td>
                    <td className="py-3 px-2">{t.baselineValue}</td>
                    <td className="py-3 px-2 text-slate-400">{t.timeFrame}</td>
                    <td className="py-3 px-2">{t.responsiblePerson}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}