// app/features/page.tsx
"use client";

import { useState } from "react";
import { createWorkPlanItem } from "./actions";
import { Loader2, CheckCircle2, ShieldAlert, PlusCircle } from "lucide-react";

const COMPONENTS = [
  "Component 1: Capacity building",
  "Component 2: Agribusiness investment",
  "Component 3: Grants and supports",
  "Component 4: Monitoring and evaluation",
  "Component 5: Project Management",
] as const;

const BUDGET_CATEGORIES = [
  { label: "Civil Works", value: "CIVIL_WORKS" },
  { label: "Personnel", value: "PERSONNEL" },
  { label: "Consultancy and Services", value: "CONSULTANCY" },
  { label: "Goods and Equipment", value: "GOODS_EQUIPMENT" },
  { label: "Training and Travels", value: "TRAINING_TRAVELS" },
] as const;

export default function UploadWorkPlanPage() {
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  const [form, setForm] = useState({
    componentName: COMPONENTS[0],
    budgetCategory: BUDGET_CATEGORIES[0].value,
    description: "",
    detailedCalculation: "",
    totalCostEstimate: "",
    currency: "USD",
    timeFrame: "",
    expectedOutput: "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg("");
    setSuccessMsg("");

    // Word count check for description (Max 300 words)
    const wordCount = form.description.trim().split(/\s+/).length;
    if (wordCount > 300) {
      setErrorMsg("Description cannot exceed 300 words.");
      setLoading(false);
      return;
    }

    try {
      const res = await createWorkPlanItem({
        ...form,
        totalCostEstimate: parseFloat(form.totalCostEstimate) || 0,
      });

      if (res.success) {
        setSuccessMsg("Workplan and budget item successfully uploaded to Supabase database!");
        setForm({
          componentName: COMPONENTS[0],
          budgetCategory: BUDGET_CATEGORIES[0].value,
          description: "",
          detailedCalculation: "",
          totalCostEstimate: "",
          currency: "USD",
          timeFrame: "",
          expectedOutput: "",
        });
      } else {
        setErrorMsg(res.error || "Failed to save item.");
      }
    } catch {
      setErrorMsg("An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <PlusCircle className="text-[#16a34a] w-7 h-7" /> Upload Workplan and Budget
        </h1>
        <p className="text-sm text-slate-400 mt-1">
          Capture project activities, financial estimates, and expected outcomes mapped across the 5 core project components.
        </p>
      </div>

      {successMsg && (
        <div className="mb-6 p-4 bg-[#16a34a]/10 border border-[#16a34a]/30 text-[#16a34a] rounded-xl flex items-center gap-3">
          <CheckCircle2 className="w-5 h-5 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 text-red-400 rounded-xl flex items-center gap-3">
          <ShieldAlert className="w-5 h-5 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-slate-900 border border-slate-800 p-8 rounded-2xl shadow-xl space-y-6">
        
        {/* Column 1: Component Dropdown */}
        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-2">
            Column I: Project Component *
          </label>
          <select
            name="componentName"
            value={form.componentName}
            onChange={handleChange}
            className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-[#16a34a]"
            required
          >
            {COMPONENTS.map((comp) => (
              <option key={comp} value={comp} className="bg-slate-900 text-white">
                {comp}
              </option>
            ))}
          </select>
        </div>

        {/* Column 2: Budget Category Dropdown */}
        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-2">
            Column II: Budget Category *
          </label>
          <select
            name="budgetCategory"
            value={form.budgetCategory}
            onChange={handleChange}
            className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-[#16a34a]"
            required
          >
            {BUDGET_CATEGORIES.map((cat) => (
              <option key={cat.value} value={cat.value} className="bg-slate-900 text-white">
                {cat.label}
              </option>
            ))}
          </select>
        </div>

        {/* Column 3: Description of Activities */}
        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-2">
            Column III: Description of Activities (Max 300 words) *
          </label>
          <textarea
            name="description"
            rows={4}
            value={form.description}
            onChange={handleChange}
            placeholder="Describe the activity breakdown..."
            className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-[#16a34a]"
            required
          />
        </div>

        {/* Column 4: Detailed Calculation */}
        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-2">
            Column IV: Detailed Calculation (Unit rates, quantities, formula breakdown) *
          </label>
          <textarea
            name="detailedCalculation"
            rows={3}
            value={form.detailedCalculation}
            onChange={handleChange}
            placeholder="e.g. 5 training sessions x 50 participants x $100 per diem..."
            className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-white font-mono text-sm focus:outline-none focus:border-[#16a34a]"
            required
          />
        </div>

        {/* Column 5: Total Cost Estimate & Currency */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="md:col-span-2">
            <label className="block text-xs font-semibold text-slate-300 mb-2">
              Column V: Total Cost Estimate *
            </label>
            <input
              type="number"
              step="0.01"
              name="totalCostEstimate"
              value={form.totalCostEstimate}
              onChange={handleChange}
              placeholder="0.00"
              className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-[#16a34a]"
              required
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-2">
              Currency
            </label>
            <select
              name="currency"
              value={form.currency}
              onChange={handleChange}
              className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-[#16a34a]"
            >
              <option value="USD">USD ($)</option>
              <option value="NGN">NGN (₦)</option>
              <option value="EUR">EUR (€)</option>
            </select>
          </div>
        </div>

        {/* Column 6: Expected Time Frame */}
        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-2">
            Column VI: Expected Time Frame (Quarters, Months, Days) *
          </label>
          <input
            type="text"
            name="timeFrame"
            value={form.timeFrame}
            onChange={handleChange}
            placeholder="e.g. Q1 2026 (Month 1 - Month 3)"
            className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-[#16a34a]"
            required
          />
        </div>

        {/* Column 7: Expected Output and Outcome */}
        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-2">
            Column VII: Expected Output and Outcome *
          </label>
          <textarea
            name="expectedOutput"
            rows={3}
            value={form.expectedOutput}
            onChange={handleChange}
            placeholder="Short narrative of expected results..."
            className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-[#16a34a]"
            required
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-4 bg-[#16a34a] hover:bg-[#15803d] text-white font-semibold rounded-xl transition duration-200 flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-[#16a34a]/20"
        >
          {loading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" /> Saving Workplan Item...
            </>
          ) : (
            "Save Workplan & Budget Item"
          )}
        </button>
      </form>
    </div>
  );
}