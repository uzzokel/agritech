"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createWorkPlanItem } from "./actions";
import { Loader2, CheckCircle2, ShieldAlert, PlusCircle, Download, FileText, Filter, ChevronLeft, ChevronRight, Trash2 } from "lucide-react";
import { NIGERIAN_STATES } from "../constants";

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

export interface WorkPlanItem {
  id: string;
  componentName: string;
  budgetCategory: string;
  state: string;
  description: string;
  detailedCalculation: string;
  unitCost: number;
  quantity: number;
  totalCostEstimate: number;
  currency: string;
  timeFrame: string;
  expectedOutput: string;
}

interface UploadWorkPlanPageProps {
  initialItems?: WorkPlanItem[];
}

export default function UploadWorkPlanPage({ initialItems = [] }: UploadWorkPlanPageProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  const [savedItems, setSavedItems] = useState<WorkPlanItem[]>(initialItems);

  const [filterComponent, setFilterComponent] = useState("ALL");
  const [filterState, setFilterState] = useState("ALL");
  const [searchQuery, setSearchQuery] = useState("");

  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 10;

  const [form, setForm] = useState({
    componentName: COMPONENTS[0],
    budgetCategory: BUDGET_CATEGORIES[0].value,
    state: NIGERIAN_STATES[0],
    description: "",
    detailedCalculation: "",
    unitCost: "",
    quantity: "",
    totalCostEstimate: "",
    currency: "USD",
    timeFrame: "",
    expectedOutput: "",
  });

  useEffect(() => {
    const cost = parseFloat(form.unitCost) || 0;
    const qty = parseFloat(form.quantity) || 0;
    if (cost > 0 && qty > 0) {
      setForm((prev) => ({ ...prev, totalCostEstimate: (cost * qty).toString() }));
    }
  }, [form.unitCost, form.quantity]);

  useEffect(() => {
    setCurrentPage(1);
  }, [filterComponent, filterState, searchQuery]);

  const filteredItems = savedItems.filter((item) => {
    const matchesComp = filterComponent === "ALL" || item.componentName === filterComponent;
    const matchesState = filterState === "ALL" || item.state === filterState;
    const matchesSearch = 
      searchQuery === "" || 
      item.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.detailedCalculation.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.expectedOutput.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesComp && matchesState && matchesSearch;
  });

  const totalPages = Math.ceil(filteredItems.length / ITEMS_PER_PAGE) || 1;
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const currentTableItems = filteredItems.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  // Summary Metrics calculations
  const totalBudgetFiltered = filteredItems.reduce((acc, item) => acc + (Number(item.totalCostEstimate) || 0), 0);
  const uniqueStatesCount = new Set(filteredItems.map(item => item.state)).size;

  const downloadCSV = () => {
    if (filteredItems.length === 0) {
      alert("No data available in the current filtered view to export.");
      return;
    }

    const headers = ["Component", "Category", "State", "Description", "Calculation", "Unit Cost", "Quantity", "Total Cost", "Currency", "TimeFrame", "ExpectedOutput"];
    const rows = filteredItems.map((item) => [
      `"${item.componentName.replace(/"/g, '""')}"`,
      item.budgetCategory,
      `"${item.state.replace(/"/g, '""')}"`,
      `"${item.description.replace(/"/g, '""')}"`,
      `"${item.detailedCalculation.replace(/"/g, '""')}"`,
      item.unitCost,
      item.quantity,
      item.totalCostEstimate,
      item.currency,
      `"${item.timeFrame.replace(/"/g, '""')}"`,
      `"${item.expectedOutput.replace(/"/g, '""')}"`
    ]);

    const csvContent = [headers.join(","), ...rows.map(r => r.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `workplan-budget-${new Date().getTime()}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const downloadPDF = () => {
    if (filteredItems.length === 0) {
      alert("No data available in the current filtered view to generate PDF.");
      return;
    }

    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const htmlContent = `
      <html>
        <head>
          <title>Workplan and Budget Report</title>
          <style>
            body { font-family: sans-serif; padding: 20px; color: #333; }
            h2 { color: #16a34a; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; font-size: 10px; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            th { background-color: #f8fafc; }
            .text-right { text-align: right; }
          </style>
        </head>
        <body>
          <h2>AgriTech Workplan & Budget Ledger</h2>
          <p>Generated on ${new Date().toLocaleString()}</p>
          <p><strong>Total Filtered Cost:</strong> ${filteredItems[0]?.currency || 'USD'} ${totalBudgetFiltered.toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
          <table>
            <thead>
              <tr>
                <th>Component</th>
                <th>Category</th>
                <th>State</th>
                <th>Description</th>
                <th class="text-right">Total Cost</th>
                <th>Timeframe</th>
              </tr>
            </thead>
            <tbody>
              ${filteredItems.map(item => `
                <tr>
                  <td>${item.componentName}</td>
                  <td>${item.budgetCategory}</td>
                  <td>${item.state}</td>
                  <td>${item.description}</td>
                  <td class="text-right">${item.currency} ${Number(item.totalCostEstimate).toLocaleString()}</td>
                  <td>${item.timeFrame}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
          <script>
            window.onload = function() { window.print(); };
          </script>
        </body>
      </html>
    `;

    printWindow.document.write(htmlContent);
    printWindow.document.close();
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg("");
    setSuccessMsg("");

    const payload = {
      componentName: form.componentName || COMPONENTS[0],
      budgetCategory: form.budgetCategory || BUDGET_CATEGORIES[0].value,
      state: form.state || NIGERIAN_STATES[0],
      description: form.description,
      detailedCalculation: form.detailedCalculation,
      unitCost: parseFloat(form.unitCost) || 0,
      quantity: parseFloat(form.quantity) || 0,
      totalCostEstimate: parseFloat(form.totalCostEstimate) || 0,
      currency: form.currency || "USD",
      timeFrame: form.timeFrame,
      expectedOutput: form.expectedOutput,
    };

    const wordCount = payload.description.trim().split(/\s+/).filter(Boolean).length;
    if (wordCount > 300) {
      setErrorMsg("Description cannot exceed 300 words.");
      setLoading(false);
      return;
    }

    try {
      const res = await createWorkPlanItem(payload);

      if (res.success && res.data) {
        setSuccessMsg("Workplan and budget item successfully saved to database!");
        
        const newItem: WorkPlanItem = {
          id: res.data.id,
          componentName: res.data.componentName,
          budgetCategory: res.data.budgetCategory ?? "CIVIL_WORKS",
          state: (res.data as any).state ?? NIGERIAN_STATES[0],
          description: res.data.description,
          detailedCalculation: res.data.detailedCalculation,
          unitCost: Number(res.data.unitCost),
          quantity: Number(res.data.quantity),
          totalCostEstimate: Number(res.data.totalCostEstimate),
          currency: res.data.currency,
          timeFrame: res.data.timeFrame,
          expectedOutput: res.data.expectedOutput,
        };

        setSavedItems((prev) => [newItem, ...prev]);
        setForm({
          componentName: COMPONENTS[0],
          budgetCategory: BUDGET_CATEGORIES[0].value,
          state: NIGERIAN_STATES[0],
          description: "",
          detailedCalculation: "",
          unitCost: "",
          quantity: "",
          totalCostEstimate: "",
          currency: "USD",
          timeFrame: "",
          expectedOutput: "",
        });
        router.refresh();
      } else {
        setErrorMsg((res as any).error || "Failed to save item to database.");
      }
    } catch (err: any) {
      setErrorMsg(err.message || "An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  };

  const handleClearForm = () => {
    setForm({
      componentName: COMPONENTS[0],
      budgetCategory: BUDGET_CATEGORIES[0].value,
      state: NIGERIAN_STATES[0],
      description: "",
      detailedCalculation: "",
      unitCost: "",
      quantity: "",
      totalCostEstimate: "",
      currency: "USD",
      timeFrame: "",
      expectedOutput: "",
    });
    setErrorMsg("");
    setSuccessMsg("");
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-12">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <PlusCircle className="text-[#16a34a] w-7 h-7" /> Upload Workplan and Budget
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Capture project activities, financial unit metrics, and expected outcomes mapped across components and implementation states.
          </p>
        </div>
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

      <form onSubmit={handleSubmit} className="bg-slate-900 border border-slate-800 p-8 rounded-2xl shadow-xl space-y-6">
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

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
            <label className="block text-xs font-semibold text-slate-300 mb-2">Column III: Implementation State / Hub *</label>
            <select
              name="state"
              value={form.state}
              onChange={handleChange}
              className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-[#16a34a]"
              required
            >
              {NIGERIAN_STATES.map((st) => (
                <option key={st} value={st} className="bg-slate-900 text-white">{st}</option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-2">Column IV: Description of Activities (Max 300 words) *</label>
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
          <label className="block text-xs font-semibold text-slate-300 mb-2">Column V: Detailed Calculation (Unit rates, quantities, formula breakdown) *</label>
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

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-2">Unit Cost *</label>
            <input
              type="number"
              step="0.01"
              name="unitCost"
              value={form.unitCost}
              onChange={handleChange}
              placeholder="0.00"
              className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-[#16a34a]"
              required
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-2">Quantity *</label>
            <input
              type="number"
              step="any"
              name="quantity"
              value={form.quantity}
              onChange={handleChange}
              placeholder="0"
              className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-[#16a34a]"
              required
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-2">Total Cost Estimate *</label>
            <input
              type="number"
              step="0.01"
              name="totalCostEstimate"
              value={form.totalCostEstimate}
              onChange={handleChange}
              placeholder="0.00"
              className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-white font-bold text-[#16a34a] focus:outline-none focus:border-[#16a34a]"
              required
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
          <label className="block text-xs font-semibold text-slate-300 mb-2">Column VII: Expected Time Frame *</label>
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
          <label className="block text-xs font-semibold text-slate-300 mb-2">Column VIII: Expected Output and Outcome *</label>
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

        <div className="flex items-center gap-4">
          <button
            type="submit"
            disabled={loading}
            className="flex-1 py-4 bg-[#16a34a] hover:bg-[#15803d] text-white font-semibold rounded-xl transition duration-200 flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-[#16a34a]/20"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" /> Saving to Database...
              </>
            ) : (
              "Save Workplan & Budget Item"
            )}
          </button>
          
          <button
            type="button"
            onClick={handleClearForm}
            className="px-6 py-4 bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium rounded-xl transition border border-slate-700 cursor-pointer flex items-center gap-2"
          >
            <Trash2 className="w-4 h-4" /> Clear Form
          </button>
        </div>
      </form>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl">
          <p className="text-xs font-medium text-slate-400">Total Filtered Entries</p>
          <p className="text-2xl font-bold text-white mt-1">{filteredItems.length}</p>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl">
          <p className="text-xs font-medium text-slate-400">Total Filtered Budget</p>
          <p className="text-2xl font-bold text-[#16a34a] mt-1">
            {filteredItems[0]?.currency || "USD"} {totalBudgetFiltered.toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </p>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl">
          <p className="text-xs font-medium text-slate-400">States / Hubs Involved</p>
          <p className="text-2xl font-bold text-white mt-1">{uniqueStatesCount}</p>
        </div>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
          <div>
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Filter className="w-5 h-5 text-[#16a34a]" /> Workplan & Budget Ledger
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              {filteredItems.length === 0
                ? "No entries found."
                : `Showing ${startIndex + 1} to ${Math.min(startIndex + ITEMS_PER_PAGE, filteredItems.length)} of ${filteredItems.length} entries (filtered from ${savedItems.length} total records)`}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
            <input
              type="text"
              placeholder="Search description/calc..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-[#16a34a]"
            />

            <select
              value={filterComponent}
              onChange={(e) => setFilterComponent(e.target.value)}
              className="px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-300 focus:outline-none focus:border-[#16a34a]"
            >
              <option value="ALL">All Components</option>
              {COMPONENTS.map((comp) => (
                <option key={comp} value={comp}>{comp}</option>
              ))}
            </select>

            <select
              value={filterState}
              onChange={(e) => setFilterState(e.target.value)}
              className="px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-300 focus:outline-none focus:border-[#16a34a]"
            >
              <option value="ALL">All States / Hubs</option>
              {NIGERIAN_STATES.map((st) => (
                <option key={st} value={st}>{st}</option>
              ))}
            </select>

            <button 
              type="button"
              onClick={downloadCSV}
              className="flex items-center gap-1.5 px-3 py-2 bg-[#16a34a] hover:bg-[#15803d] text-white text-xs font-medium rounded-xl transition cursor-pointer shadow-sm"
            >
              <Download className="w-3.5 h-3.5" /> CSV Export
            </button>

            <button 
              type="button"
              onClick={downloadPDF}
              className="flex items-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-white text-xs font-medium rounded-xl transition cursor-pointer shadow-sm border border-slate-700"
            >
              <FileText className="w-3.5 h-3.5" /> Print PDF
            </button>
          </div>
        </div>

        <div className="overflow-x-auto border border-slate-800 rounded-xl">
          <table className="w-full text-left text-xs text-slate-300 border-collapse">
            <thead className="bg-slate-950 text-slate-400 font-semibold uppercase tracking-wider border-b border-slate-800">
              <tr>
                <th className="p-3 border-r border-slate-800">Component</th>
                <th className="p-3 border-r border-slate-800">Category</th>
                <th className="p-3 border-r border-slate-800">State / Hub</th>
                <th className="p-3 border-r border-slate-800">Description</th>
                <th className="p-3 border-r border-slate-800">Calculation</th>
                <th className="p-3 border-r border-slate-800 text-right">Unit Cost</th>
                <th className="p-3 border-r border-slate-800 text-right">Qty</th>
                <th className="p-3 border-r border-slate-800 text-right">Total Cost</th>
                <th className="p-3 border-r border-slate-800">Currency</th>
                <th className="p-3 border-r border-slate-800">Timeframe</th>
                <th className="p-3">Expected Output</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 bg-slate-900 font-mono">
              {currentTableItems.length === 0 ? (
                <tr>
                  <td colSpan={11} className="text-center py-8 text-slate-500 font-sans italic">
                    No entries found matching the filter criteria. Submit the form above to add items.
                  </td>
                </tr>
              ) : (
                currentTableItems.map((item, idx) => (
                  <tr key={item.id || idx} className="hover:bg-slate-800/50 transition">
                    <td className="p-3 border-r border-slate-800 font-sans font-medium text-white">{item.componentName}</td>
                    <td className="p-3 border-r border-slate-800 font-sans">{item.budgetCategory}</td>
                    <td className="p-3 border-r border-slate-800 font-sans text-[#16a34a] font-semibold">{item.state}</td>
                    <td className="p-3 border-r border-slate-800 font-sans max-w-xs truncate">{item.description}</td>
                    <td className="p-3 border-r border-slate-800">{item.detailedCalculation}</td>
                    <td className="p-3 border-r border-slate-800 text-right">{Number(item.unitCost).toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                    <td className="p-3 border-r border-slate-800 text-right">{item.quantity}</td>
                    <td className="p-3 border-r border-slate-800 text-right font-bold text-white">{Number(item.totalCostEstimate).toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                    <td className="p-3 border-r border-slate-800">{item.currency}</td>
                    <td className="p-3 border-r border-slate-800 font-sans">{item.timeFrame}</td>
                    <td className="p-3 font-sans max-w-xs truncate">{item.expectedOutput}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {filteredItems.length > 0 && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2">
            <span className="text-xs text-slate-400 font-sans">
              Page <strong className="text-white">{currentPage}</strong> of <strong className="text-white">{totalPages}</strong>
            </span>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="flex items-center gap-1 px-3 py-2 bg-slate-800 hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed text-slate-200 text-xs font-medium rounded-xl transition cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" /> Previous
              </button>

              <div className="hidden sm:flex items-center gap-1">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNumber) => (
                  <button
                    key={pageNumber}
                    type="button"
                    onClick={() => setCurrentPage(pageNumber)}
                    className={`w-8 h-8 rounded-lg text-xs font-semibold transition cursor-pointer flex items-center justify-center ${
                      currentPage === pageNumber
                        ? "bg-[#16a34a] text-white shadow-sm"
                        : "bg-slate-950 border border-slate-800 text-slate-400 hover:text-white"
                    }`}
                  >
                    {pageNumber}
                  </button>
                ))}
              </div>

              <button
                type="button"
                onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="flex items-center gap-1 px-3 py-2 bg-slate-800 hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed text-slate-200 text-xs font-medium rounded-xl transition cursor-pointer"
              >
                Next <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}