"use client";

import { useState, useEffect } from "react";
import { createWorkPlanItem, getWorkPlanItems } from "./actions";
import {
  Loader2,
  CheckCircle2,
  ShieldAlert,
  PlusCircle,
  Download,
  FileText,
  Check,
  RefreshCw,
} from "lucide-react";

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

interface SavedWorkPlanItem {
  id: string;
  componentName: string;
  budgetCategory: string;
  description: string;
  detailedCalculation: string;
  unitCost: number | string;
  quantity: number | string;
  totalCostEstimate: number | string;
  currency: string;
  timeFrame: string;
  expectedOutput: string;
}

export default function UploadWorkPlanPage() {
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  const [savedItems, setSavedItems] = useState<SavedWorkPlanItem[]>([]);

  const [form, setForm] = useState<Omit<SavedWorkPlanItem, "id">>({
    componentName: COMPONENTS[0],
    budgetCategory: BUDGET_CATEGORIES[0].value,
    description: "",
    detailedCalculation: "",
    unitCost: "",
    quantity: "",
    totalCostEstimate: "0.00",
    currency: "USD",
    timeFrame: "",
    expectedOutput: "",
  });

  const getCategoryLabel = (value: string) =>
    BUDGET_CATEGORIES.find((cat) => cat.value === value)?.label || value;

  const formatCurrency = (amount: number | string, currency: string) => {
    const numeric = typeof amount === "string" ? parseFloat(amount) || 0 : amount;
    try {
      return new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: currency,
        minimumFractionDigits: 2,
      }).format(numeric);
    } catch {
      return `${currency} ${numeric.toFixed(2)}`;
    }
  };

  useEffect(() => {
    fetchExistingWorkPlanItems();
  }, []);

  const fetchExistingWorkPlanItems = async () => {
    setFetching(true);
    try {
      const res = await getWorkPlanItems();
      if (res.success && res.data) {
        setSavedItems(res.data);
      } else if (res.error) {
        console.error("Failed to fetch workplan items:", res.error);
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to load items";
      console.error("Error fetching workplan items:", message);
    } finally {
      setFetching(false);
    }
  };

  const escapeCsvCell = (value: string | number | undefined | null) => {
    if (value === undefined || value === null) return '""';
    const str = String(value).replace(/"/g, '""');
    return `"${str}"`;
  };

  const downloadCSV = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (savedItems.length === 0) return;

    const headers = [
      "Component",
      "Category",
      "Description",
      "Calculation",
      "Unit Cost",
      "Quantity",
      "Total Cost",
      "Currency",
      "Time Frame",
      "Expected Output",
    ];

    const rows = savedItems.map((item) => [
      escapeCsvCell(item.componentName),
      escapeCsvCell(getCategoryLabel(item.budgetCategory)),
      escapeCsvCell(item.description),
      escapeCsvCell(item.detailedCalculation),
      escapeCsvCell(item.unitCost || "0"),
      escapeCsvCell(item.quantity || "0"),
      escapeCsvCell(item.totalCostEstimate || "0.00"),
      escapeCsvCell(item.currency),
      escapeCsvCell(item.timeFrame),
      escapeCsvCell(item.expectedOutput),
    ]);

    const csvString = [headers.join(","), ...rows.map((r) => r.join(","))].join("\r\n");

    const blob = new Blob(["\ufeff" + csvString], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `workplan-export-${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    setTimeout(() => {
      URL.revokeObjectURL(url);
    }, 100);
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;

    setForm((prev) => {
      const updated = { ...prev, [name]: value };

      if (name === "unitCost" || name === "quantity") {
        const unit = parseFloat(name === "unitCost" ? value : String(prev.unitCost)) || 0;
        const qty = parseFloat(name === "quantity" ? value : String(prev.quantity)) || 0;
        updated.totalCostEstimate = (unit * qty).toFixed(2);
      }

      return updated;
    });
  };

  const handleSaveAndAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg("");
    setSuccessMsg("");

    const payload = {
      componentName: form.componentName || COMPONENTS[0],
      budgetCategory: form.budgetCategory || BUDGET_CATEGORIES[0].value,
      description: form.description,
      detailedCalculation: form.detailedCalculation,
      unitCost: parseFloat(String(form.unitCost)) || 0,
      quantity: parseFloat(String(form.quantity)) || 0,
      totalCostEstimate: parseFloat(String(form.totalCostEstimate)) || 0,
      currency: form.currency || "USD",
      timeFrame: form.timeFrame,
      expectedOutput: form.expectedOutput,
    };

    try {
      const res = await createWorkPlanItem(payload);

      if (res.success) {
        const newItem: SavedWorkPlanItem = {
          ...form,
          id: res.data?.id || Date.now().toString(),
        };

        setSavedItems((prev) => [newItem, ...prev]);
        setSuccessMsg("Item saved to database and added to workplan!");

        setForm({
          componentName: COMPONENTS[0],
          budgetCategory: BUDGET_CATEGORIES[0].value,
          description: "",
          detailedCalculation: "",
          unitCost: "",
          quantity: "",
          totalCostEstimate: "0.00",
          currency: "USD",
          timeFrame: "",
          expectedOutput: "",
        });
      } else {
        setErrorMsg(res.error || "Failed to save item to database.");
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "An unexpected error occurred.";
      setErrorMsg(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <PlusCircle className="text-[#16a34a] w-7 h-7" /> Upload Workplan and Budget
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Capture project activities, financial estimates, and expected outcomes mapped across the 5 core project components.
          </p>
        </div>
        <button
          type="button"
          onClick={downloadCSV}
          disabled={fetching || savedItems.length === 0}
          className="flex items-center gap-2 px-4 py-2.5 bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-slate-200 text-sm font-semibold rounded-xl transition cursor-pointer border border-slate-700"
        >
          <Download className="w-4 h-4 text-emerald-400" /> Export Workplan ({savedItems.length})
        </button>
      </div>

      {successMsg && (
        <div className="p-4 bg-[#16a34a]/10 border border-[#16a34a]/30 text-[#16a34a] rounded-xl flex items-center gap-3">
          <CheckCircle2 className="w-5 h-5 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div className="p-4 bg-red-500/10 border border-red-500/30 text-red-400 rounded-xl flex items-center gap-3">
          <ShieldAlert className="w-5 h-5 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Form Input */}
      <form onSubmit={handleSaveAndAdd} className="bg-slate-900 border border-slate-800 p-8 rounded-2xl shadow-xl space-y-6">
        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-2">Column I: Project Component *</label>
          <select
            name="componentName"
            value={form.componentName}
            onChange={handleChange}
            className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-[#16a34a]"
            required
          >
            {COMPONENTS.map((comp) => (
              <option key={comp} value={comp} className="bg-slate-900 text-white">{comp}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-2">Column II: Budget Category *</label>
          <select
            name="budgetCategory"
            value={form.budgetCategory}
            onChange={handleChange}
            className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-[#16a34a]"
            required
          >
            {BUDGET_CATEGORIES.map((cat) => (
              <option key={cat.value} value={cat.value} className="bg-slate-900 text-white">{cat.label}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-2">Column III: Description of Activities (Max 300 words) *</label>
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

        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-2">Column IV: Detailed Calculation (Unit rates, quantities, formula breakdown) *</label>
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

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-2">Unit Cost / Rate *</label>
            <input
              type="number"
              step="0.01"
              name="unitCost"
              value={form.unitCost}
              onChange={handleChange}
              placeholder="e.g. 150.00"
              className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-[#16a34a]"
              required
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-2">Quantity *</label>
            <input
              type="number"
              step="1"
              name="quantity"
              value={form.quantity}
              onChange={handleChange}
              placeholder="e.g. 10"
              className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-[#16a34a]"
              required
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="md:col-span-2">
            <label className="block text-xs font-semibold text-slate-300 mb-2">Column V: Total Cost Estimate (Unit x Quantity) *</label>
            <input
              type="number"
              step="0.01"
              name="totalCostEstimate"
              value={form.totalCostEstimate}
              readOnly
              className="w-full px-4 py-3 bg-slate-950/60 border border-slate-800 rounded-xl text-emerald-400 font-bold focus:outline-none cursor-not-allowed"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-2">Currency</label>
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

        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-2">Column VI: Expected Time Frame *</label>
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

        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-2">Column VII: Expected Output and Outcome *</label>
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
          className="w-full py-4 bg-[#16a34a] hover:bg-[#15803d] text-white font-semibold rounded-xl transition duration-200 flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-[#16a34a]/20 disabled:opacity-50"
        >
          {loading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" /> Saving Item...
            </>
          ) : (
            <>
              <PlusCircle className="w-5 h-5" /> Save Item to Workplan
            </>
          )}
        </button>
      </form>

      {/* Live Table Preview of Saved Items with Fixed Max Height */}
      <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-xl">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-sm font-semibold text-slate-300 flex items-center gap-2">
            <FileText className="w-4 h-4 text-emerald-400" /> Saved Workplan Entries ({savedItems.length})
          </h2>
          <div className="flex items-center gap-2">
            {fetching ? (
              <span className="text-xs text-slate-400 flex items-center gap-1">
                <RefreshCw className="w-3 h-3 animate-spin text-emerald-400" /> Fetching latest...
              </span>
            ) : (
              <span className="text-xs text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-full flex items-center gap-1">
                <Check className="w-3 h-3" /> Synced
              </span>
            )}
          </div>
        </div>

        {fetching ? (
          <div className="py-8 text-center text-slate-500 text-xs flex justify-center items-center gap-2">
            <Loader2 className="w-4 h-4 animate-spin text-slate-400" /> Loading workplan items...
          </div>
        ) : savedItems.length === 0 ? (
          <div className="py-8 text-center text-slate-500 text-xs">
            No workplan entries found yet.
          </div>
        ) : (
          <div className="max-h-80 overflow-y-auto overflow-x-auto rounded-lg pr-1">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="sticky top-0 bg-slate-900 border-b border-slate-800 text-slate-400 uppercase z-10">
                <tr>
                  <th className="pb-3 px-2">Component</th>
                  <th className="pb-3 px-2">Category</th>
                  <th className="pb-3 px-2">Description</th>
                  <th className="pb-3 px-2">Time Frame</th>
                  <th className="pb-3 px-2">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/50">
                {savedItems.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-800/30 transition">
                    <td className="py-3 px-2 font-medium text-white">{item.componentName}</td>
                    <td className="py-3 px-2">{getCategoryLabel(item.budgetCategory)}</td>
                    <td className="py-3 px-2 truncate max-w-xs">{item.description}</td>
                    <td className="py-3 px-2 text-slate-400">{item.timeFrame}</td>
                    <td className="py-3 px-2 font-mono text-emerald-400">
                      {formatCurrency(item.totalCostEstimate, item.currency)}
                    </td>
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