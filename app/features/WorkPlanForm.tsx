// app/features/WorkPlanForm.tsx
"use client";

import { useState } from "react";
import { createWorkPlanItem } from "./actions";
import { Loader2, PlusCircle, CheckCircle2 } from "lucide-react";

export default function WorkPlanForm({ onSuccess }: { onSuccess?: () => void }) {
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setErrorMsg("");
    setSuccessMsg("");

    const formData = new FormData(e.currentTarget);

    const payload = {
      componentName: formData.get("componentName") as string,
      budgetCategory: formData.get("budgetCategory") as string,
      description: formData.get("description") as string,
      detailedCalculation: formData.get("detailedCalculation") as string,
      totalCostEstimate: Number(formData.get("totalCostEstimate")),
      currency: (formData.get("currency") as string) || "USD",
      timeFrame: formData.get("timeFrame") as string,
      expectedOutput: formData.get("expectedOutput") as string,
    };

    const res = await createWorkPlanItem(payload);

    setLoading(false);
    if (res.success) {
      setSuccessMsg("Workplan item successfully created!");
      e.currentTarget.reset();
      if (onSuccess) onSuccess();
    } else {
      setErrorMsg(res.error || "Failed to submit workplan item.");
    }
  }

  return (
    <form onSubmit={handleSubmit} className="bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-xl space-y-6">
      <div className="border-b border-slate-800 pb-4">
        <h2 className="text-lg font-semibold text-white flex items-center gap-2">
          <PlusCircle className="w-5 h-5 text-[#16a34a]" /> Add WorkPlan & Budget Item
        </h2>
        <p className="text-sm text-slate-400 mt-1">
          Fill out the parameters below to log financial estimates and expected outputs.
        </p>
      </div>

      {successMsg && (
        <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 rounded-xl flex items-center gap-3 text-sm">
          <CheckCircle2 className="w-5 h-5 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div className="p-4 bg-red-500/10 border border-red-500/30 text-red-400 rounded-xl text-sm">
          {errorMsg}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Component Name */}
        <div className="space-y-2">
          <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">Component Name</label>
          <input
            type="text"
            name="componentName"
            required
            placeholder="e.g. Component 1: Capacity building"
            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white placeholder-slate-600 focus:outline-none focus:border-[#16a34a] text-sm"
          />
        </div>

        {/* Budget Category */}
        <div className="space-y-2">
          <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">Budget Category</label>
          <select
            name="budgetCategory"
            required
            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#16a34a] text-sm"
          >
            <option value="CIVIL_WORKS">Civil Works</option>
            <option value="PERSONNEL">Personnel</option>
            <option value="CONSULTANCY">Consultancy</option>
            <option value="GOODS_EQUIPMENT">Goods & Equipment</option>
            <option value="TRAINING_TRAVELS">Training & Travels</option>
          </select>
        </div>

        {/* Total Cost Estimate */}
        <div className="space-y-2">
          <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">Total Cost Estimate</label>
          <input
            type="number"
            step="any"
            name="totalCostEstimate"
            required
            placeholder="0.00"
            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white placeholder-slate-600 focus:outline-none focus:border-[#16a34a] text-sm font-mono"
          />
        </div>

        {/* Currency */}
        <div className="space-y-2">
          <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">Currency</label>
          <input
            type="text"
            name="currency"
            defaultValue="USD"
            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#16a34a] text-sm font-mono"
          />
        </div>

        {/* Timeframe */}
        <div className="space-y-2 md:col-span-2">
          <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">TimeFrame</label>
          <input
            type="text"
            name="timeFrame"
            required
            placeholder="e.g. Q1 2026 (Months 1-3)"
            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white placeholder-slate-600 focus:outline-none focus:border-[#16a34a] text-sm"
          />
        </div>

        {/* Description */}
        <div className="space-y-2 md:col-span-2">
          <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">Description (Max 300 words)</label>
          <textarea
            name="description"
            rows={3}
            required
            placeholder="Provide a breakdown or summary of work..."
            className="w-full bg-slate-950 border border-slate-800 rounded-xl p-4 text-white placeholder-slate-600 focus:outline-none focus:border-[#16a34a] text-sm resize-none"
          />
        </div>

        {/* Detailed Calculation */}
        <div className="space-y-2 md:col-span-2">
          <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">Detailed Calculation</label>
          <textarea
            name="detailedCalculation"
            rows={2}
            required
            placeholder="Calculation logic (e.g. 5 units @ $200 each)"
            className="w-full bg-slate-950 border border-slate-800 rounded-xl p-4 text-white placeholder-slate-600 focus:outline-none focus:border-[#16a34a] text-sm resize-none"
          />
        </div>

        {/* Expected Output */}
        <div className="space-y-2 md:col-span-2">
          <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">Expected Output</label>
          <textarea
            name="expectedOutput"
            rows={2}
            required
            placeholder="Narrative of expected results..."
            className="w-full bg-slate-950 border border-slate-800 rounded-xl p-4 text-white placeholder-slate-600 focus:outline-none focus:border-[#16a34a] text-sm resize-none"
          />
        </div>
      </div>

      <div className="flex justify-end pt-4 border-t border-slate-800">
        <button
          type="submit"
          disabled={loading}
          className="bg-[#16a34a] hover:bg-emerald-700 text-white font-medium px-6 py-3 rounded-xl transition-all flex items-center gap-2 text-sm disabled:opacity-50"
        >
          {loading && <Loader2 className="w-4 h-4 animate-spin" />}
          Submit WorkPlan Item
        </button>
      </div>
    </form>
  );
}