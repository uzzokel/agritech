// app/components/PolicyFeed.tsx
"use client";

import { useState, useEffect, useTransition } from "react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { 
  getSuccessStories, 
  getRoutinePerformance, 
  exportPolicyDataToCsv, 
  createSuccessStory, 
  createRoutinePerformance,
  getPolicyBrief,
  updatePolicyBrief
} from "@/app/actions/policy-actions";

const NIGERIAN_STATES = [
  "Abia", "Adamawa", "Akwa Ibom", "Anambra", "Bauchi", "Bayelsa", "Benue", 
  "Borno", "Cross River", "Delta", "Ebonyi", "Edo", "Ekiti", "Enugu", 
  "FCT - Abuja", "Gombe", "Imo", "Jigawa", "Kaduna", "Kano", "Katsina", 
  "Kebbi", "Kogi", "Kwara", "Lagos", "Nasarawa", "Niger", "Ogun", "Ondo", 
  "Osun", "Oyo", "Plateau", "Rivers", "Sokoto", "Taraba", "Yobe", "Zamfara"
];

export interface SuccessStoryItem {
  id: string;
  fullName: string;
  state: string;
  clusterName?: string | null;
  userGroup?: string | null;
  location?: string | null;
  gps?: string | null;
  imageUrl?: string | null;
  photoUrl?: string | null;
  narration: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface RoutinePerformanceItem {
  id: string;
  state: string;
  quarter: string;
  year: string;
  kpi: string;
  baseline: number;
  target: number;
  achievement: number;
  variance: number;
  flag: string;
  pct: number;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface PolicyBriefItem {
  id?: string;
  title: string;
  domain: string;
  focus: string;
  recommendations: string[];
  fontFamily?: string;
  fontSize?: string;
  textColor?: string;
  fontWeight?: string;
  highlightClass?: string;
}

type FeedTab = "stories" | "routine" | "briefs";

interface PolicyFeedProps {
  isAdmin?: boolean; 
  initialBrief?: PolicyBriefItem | null;
}

interface RoutineKpiRow {
  kpi: string;
  baseline: string;
  target: string;
  achievement: string;
}

export function PolicyFeed({ isAdmin = true, initialBrief = null }: PolicyFeedProps) {
  const [activeTab, setActiveTab] = useState<FeedTab>("stories");
  const [search, setSearch] = useState("");
  const [stateFilter, setStateFilter] = useState("All");
  const [page, setPage] = useState(1);
  
  const [data, setData] = useState<(SuccessStoryItem | RoutinePerformanceItem)[]>([]);
  const [pagination, setPagination] = useState({ 
    currentPage: 1, 
    totalPages: 1, 
    startItem: 0, 
    endItem: 0, 
    totalCount: 0 
  });
  
  const [isPending, startTransition] = useTransition();
  const [showForm, setShowForm] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  // Multi-Row Routine Performance State
  const [routineState, setRoutineState] = useState("");
  const [routineQuarter, setRoutineQuarter] = useState("");
  const [routineYear, setRoutineYear] = useState("2026");
  const [routineRows, setRoutineRows] = useState<RoutineKpiRow[]>([
    { kpi: "", baseline: "", target: "", achievement: "" }
  ]);

  // Policy Brief Control States
  const [showBriefForm, setShowBriefForm] = useState(false);

  // Editable Live Policy Brief State with Cross-Sector & External Linkages Focus
  const defaultBriefState: PolicyBriefItem = {
    id: "brief-default-1",
    title: initialBrief?.title || "Digitalizing Smallholder Supply Chains: Cross-Sector Impacts & External Institutional Linkages",
    domain: initialBrief?.domain || "Agriculture, Trade & Institutional Collaboration",
    focus: initialBrief?.focus || "Analytical policy brief addressing cross-sector impacts, external institutional linkages, and market collaborations to bridge information asymmetry and mitigate post-harvest vulnerabilities.",
    recommendations: initialBrief?.recommendations || [
      "Establish cross-sector institutional frameworks connecting agricultural ministries, financial technology providers, and logistics bureaus.",
      "Deploy localized pricing SMS/USSD alerts linked directly with regional trading boards to minimize exploitation by middle agents.",
      "Integrate state-level logistics mapping to coordinate direct aggregation points, shortening transit times for perishable yields."
    ],
    fontFamily: initialBrief?.fontFamily || "sans",
    fontSize: initialBrief?.fontSize || "text-base",
    textColor: initialBrief?.textColor || "text-slate-900",
    fontWeight: initialBrief?.fontWeight || "font-bold",
    highlightClass: initialBrief?.highlightClass || "bg-yellow-100 text-yellow-900 px-1 rounded"
  };

  const [briefsData, setBriefsData] = useState<PolicyBriefItem[]>([defaultBriefState]);

  // Fetch dynamic brief content if available
  useEffect(() => {
    if (!initialBrief) {
      getPolicyBrief().then((res) => {
        if (res) {
          const briefData = res as unknown as PolicyBriefItem;
          setBriefsData([{
            id: briefData.id || "brief-fetched-1",
            title: briefData.title || defaultBriefState.title,
            domain: briefData.domain || defaultBriefState.domain,
            focus: briefData.focus || defaultBriefState.focus,
            recommendations: Array.isArray(briefData.recommendations) ? briefData.recommendations : defaultBriefState.recommendations,
            fontFamily: briefData.fontFamily || "sans",
            fontSize: briefData.fontSize || "text-base",
            textColor: briefData.textColor || "text-slate-900",
            fontWeight: briefData.fontWeight || "font-bold",
            highlightClass: briefData.highlightClass || "bg-yellow-100 text-yellow-900 px-1 rounded",
          }]);
        }
      });
    }
  }, [initialBrief]);

  // Fetch data on state changes when not viewing briefs
  useEffect(() => {
    if (activeTab === "briefs") return;

    startTransition(async () => {
      if (activeTab === "stories") {
        const res = await getSuccessStories({ page, search, state: stateFilter });
        setData(res.data);
        setPagination(res.pagination);
      } else {
        const res = await getRoutinePerformance({ page, search, state: stateFilter });
        setData(res.data);
        setPagination(res.pagination);
      }
    });
  }, [activeTab, page, search, stateFilter]);

  const handleExportCsv = async () => {
    if (activeTab === "briefs") {
      alert("CSV export for policy briefs is available via summary report downloads.");
      return;
    }
    const csvString = await exportPolicyDataToCsv(activeTab, stateFilter);
    const blob = new Blob([csvString], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `${activeTab}_${stateFilter}_export.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExportPdf = () => {
    const doc = new jsPDF({ orientation: "landscape" });
    doc.setFontSize(16);
    doc.text(
      activeTab === "stories" 
        ? `Success Stories Report (${stateFilter})` 
        : activeTab === "routine" 
        ? `Routine Performance Report - ${stateFilter === "All" ? "All States" : stateFilter}` 
        : "AgriTech Policy Briefs Compilation", 
      14, 
      20
    );
    doc.setFontSize(10);
    doc.text(`Generated: ${new Date().toLocaleDateString()}`, 14, 28);

    if (activeTab === "briefs") {
      const tableRows = briefsData.map((b, idx) => [
        idx + 1,
        b.domain,
        b.title,
        b.focus,
        b.recommendations.join("; ")
      ]);

      autoTable(doc, {
        startY: 34,
        head: [["S/N", "Domain", "Policy Brief Title", "Core Focus", "Strategic Recommendations"]],
        body: tableRows,
        styles: { fontSize: 8, cellPadding: 3 },
      });
      doc.save("agritech_policy_briefs.pdf");
      return;
    }

    if (activeTab === "stories") {
      const tableRows = data.map((item) => {
        const s = item as SuccessStoryItem;
        return [
          s.fullName, 
          s.state, 
          s.clusterName || "N/A", 
          s.userGroup || "N/A", 
          s.location || "N/A",
          s.narration,
          s.gps || "N/A"
        ];
      });

      autoTable(doc, {
        startY: 34,
        head: [["Full Name", "State", "Cluster", "User Group", "Location", "Narration", "GPS"]],
        body: tableRows,
        styles: { fontSize: 8, cellPadding: 3 },
      });
    } else {
      const tableRows = data.map((item) => {
        const r = item as RoutinePerformanceItem;
        return [
          r.state, 
          `${r.quarter} ${r.year}`, 
          r.kpi, 
          r.baseline, 
          r.target, 
          r.achievement, 
          r.variance, 
          `${r.flag} (${r.pct}%)`
        ];
      });

      autoTable(doc, {
        startY: 34,
        head: [["State", "Period", "KPI", "Baseline", "Target", "Achievement", "Variance", "Flag"]],
        body: tableRows,
        styles: { fontSize: 8, cellPadding: 3 },
      });
    }

    doc.save(`${activeTab}_${stateFilter}_report.pdf`);
  };

  const handleDownloadSingleBriefPdf = (brief: PolicyBriefItem) => {
    const doc = new jsPDF({ orientation: "portrait" });
    doc.setFontSize(14);
    doc.text("POLICY BRIEF: CROSS-SECTOR & MARKET LINKAGES", 14, 20);
    
    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.text(brief.title, 14, 30, { maxWidth: 180 });

    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text(`Domain: ${brief.domain}`, 14, 45);
    doc.text(`Date: ${new Date().toLocaleDateString()}`, 14, 52);

    doc.setFont("helvetica", "bold");
    doc.text("Core Focus & Institutional Linkages:", 14, 65);
    doc.setFont("helvetica", "normal");
    doc.text(brief.focus, 14, 72, { maxWidth: 180 });

    doc.setFont("helvetica", "bold");
    doc.text("Strategic Recommendations:", 14, 95);
    
    let yPos = 103;
    brief.recommendations.forEach((rec) => {
      doc.setFont("helvetica", "normal");
      doc.text(`• ${rec}`, 18, yPos, { maxWidth: 175 });
      yPos += 14;
    });

    doc.save(`policy_brief.pdf`);
  };

  const filteredBriefs = briefsData.filter(b => 
    b.title.toLowerCase().includes(search.toLowerCase()) || 
    b.focus.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Navigation Tabs including Policy Briefs Submenu */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b pb-4 gap-4">
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => { setActiveTab("stories"); setPage(1); setShowForm(false); }}
            className={`px-4 py-2 font-medium rounded-lg transition-colors ${
              activeTab === "stories" ? "bg-emerald-600 text-white" : "bg-slate-100 text-slate-700 hover:bg-slate-200"
            }`}
          >
            Success Stories
          </button>
          <button
            onClick={() => { setActiveTab("routine"); setPage(1); setShowForm(false); }}
            className={`px-4 py-2 font-medium rounded-lg transition-colors ${
              activeTab === "routine" ? "bg-emerald-600 text-white" : "bg-slate-100 text-slate-700 hover:bg-slate-200"
            }`}
          >
            Routine Performance
          </button>
          <button
            onClick={() => { setActiveTab("briefs"); setShowForm(false); }}
            className={`px-4 py-2 font-medium rounded-lg transition-colors flex items-center gap-1.5 ${
              activeTab === "briefs" ? "bg-emerald-600 text-white" : "bg-slate-100 text-slate-700 hover:bg-slate-200"
            }`}
          >
            <span>📜 Policy Briefs</span>
            <span className="bg-emerald-800 text-emerald-100 text-[10px] px-1.5 py-0.5 rounded-full ml-1">{briefsData.length}</span>
          </button>
        </div>

        <div className="flex flex-wrap gap-2">
          {activeTab !== "briefs" && (
            <button
              onClick={() => setShowForm(!showForm)}
              className="px-4 py-2 bg-emerald-700 text-white rounded-lg text-sm font-medium hover:bg-emerald-800 transition-colors"
            >
              {showForm ? "Cancel" : `+ Add ${activeTab === "stories" ? "Story" : "Metric"}`}
            </button>
          )}
          <button
            onClick={handleExportCsv}
            disabled={activeTab === "briefs"}
            className="px-3 py-2 bg-slate-800 text-white rounded-lg text-sm font-medium hover:bg-slate-700 transition-colors disabled:opacity-50"
          >
            Export CSV
          </button>
          <button
            onClick={handleExportPdf}
            className="px-3 py-2 bg-rose-700 text-white rounded-lg text-sm font-medium hover:bg-rose-800 transition-colors"
          >
            Export PDF
          </button>
        </div>
      </div>

      {/* Dynamic Entry Forms */}
      {showForm && activeTab !== "briefs" && (
        <div className="p-6 border rounded-xl bg-slate-50 shadow-inner">
          <h3 className="text-lg font-semibold mb-4 text-slate-800">
            {activeTab === "stories" ? "New Success Story Entry" : "Batch Routine Performance Entry"}
          </h3>

          <form 
            onSubmit={async (e) => {
              e.preventDefault();
              setIsUploading(true);
              const formElement = e.currentTarget;
              const formData = new FormData(formElement);
              
              try {
                if (activeTab === "stories") {
                  const res = await createSuccessStory(formData);
                  if (res.success) {
                    formElement.reset();
                    setShowForm(false);
                    startTransition(async () => {
                      const refreshed = await getSuccessStories({ page, search, state: stateFilter });
                      setData(refreshed.data);
                      setPagination(refreshed.pagination);
                    });
                  } else {
                    alert(res.error || "Failed to save record.");
                  }
                } else {
                  let allSuccess = true;
                  for (const row of routineRows) {
                    const rowData = new FormData();
                    rowData.append("state", routineState);
                    rowData.append("quarter", routineQuarter);
                    rowData.append("year", routineYear);
                    rowData.append("kpi", row.kpi);
                    rowData.append("baseline", row.baseline);
                    rowData.append("target", row.target);
                    rowData.append("achievement", row.achievement);

                    const res = await createRoutinePerformance(rowData);
                    if (!res.success) {
                      allSuccess = false;
                      break;
                    }
                  }

                  if (allSuccess) {
                    setShowForm(false);
                    setRoutineRows([{ kpi: "", baseline: "", target: "", achievement: "" }]);
                    startTransition(async () => {
                      const refreshed = await getRoutinePerformance({ page, search, state: stateFilter });
                      setData(refreshed.data);
                      setPagination(refreshed.pagination);
                    });
                  } else {
                    alert("Failed to save one or more routine performance records.");
                  }
                }
              } finally {
                setIsUploading(false);
              }
            }}
            className="space-y-4"
          >
            {activeTab === "stories" ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <input name="fullName" placeholder="Full Name" required className="p-2 border rounded bg-white text-slate-900" />
                <select name="state" required className="p-2 border rounded bg-white text-slate-900">
                  <option value="">Select State</option>
                  {NIGERIAN_STATES.map((state) => (
                    <option key={state} value={state}>{state}</option>
                  ))}
                </select>
                <input name="clusterName" placeholder="Cluster Name" className="p-2 border rounded bg-white text-slate-900" />
                <input name="userGroup" placeholder="User Group" className="p-2 border rounded bg-white text-slate-900" />
                <input name="location" placeholder="Location" className="p-2 border rounded bg-white text-slate-900" />
                <input name="gps" placeholder="GPS Coordinates (e.g. 9.0765, 7.3986)" className="p-2 border rounded bg-white text-slate-900" />
                
                <div className="sm:col-span-2 flex flex-col gap-1">
                  <label className="text-xs font-medium text-slate-600">Upload Image / Photo</label>
                  <input 
                    name="image" 
                    type="file" 
                    accept="image/*" 
                    className="p-2 border rounded bg-white text-slate-900 file:mr-4 file:py-1 file:px-4 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100" 
                  />
                </div>

                <textarea name="narration" placeholder="Narration / Story details..." required className="p-2 border rounded bg-white text-slate-900 sm:col-span-2" rows={3} />
              </div>
            ) : (
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-white p-4 border rounded-lg">
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">Target State</label>
                    <select 
                      value={routineState} 
                      onChange={(e) => setRoutineState(e.target.value)} 
                      required 
                      className="p-2 border rounded bg-white text-slate-900 w-full"
                    >
                      <option value="">Select State</option>
                      {NIGERIAN_STATES.map((state) => (
                        <option key={state} value={state}>{state}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">Quarter</label>
                    <input 
                      value={routineQuarter} 
                      onChange={(e) => setRoutineQuarter(e.target.value)} 
                      placeholder="e.g. Q1" 
                      required 
                      className="p-2 border rounded bg-white text-slate-900 w-full" 
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">Year</label>
                    <input 
                      value={routineYear} 
                      onChange={(e) => setRoutineYear(e.target.value)} 
                      placeholder="e.g. 2026" 
                      required 
                      className="p-2 border rounded bg-white text-slate-900 w-full" 
                    />
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <h4 className="text-sm font-bold text-slate-700">KPI Performance Entries</h4>
                    <button
                      type="button"
                      onClick={() => setRoutineRows([...routineRows, { kpi: "", baseline: "", target: "", achievement: "" }])}
                      className="px-3 py-1 bg-emerald-100 text-emerald-800 rounded text-xs font-semibold hover:bg-emerald-200 transition"
                    >
                      + Add Another KPI
                    </button>
                  </div>

                  {routineRows.map((row, index) => (
                    <div key={index} className="grid grid-cols-1 sm:grid-cols-12 gap-2 items-center bg-white p-3 border rounded-lg">
                      <div className="sm:col-span-5">
                        <input 
                          placeholder="KPI Description" 
                          value={row.kpi}
                          onChange={(e) => {
                            const newRows = [...routineRows];
                            newRows[index].kpi = e.target.value;
                            setRoutineRows(newRows);
                          }}
                          required 
                          className="p-2 border rounded bg-white text-slate-900 w-full text-sm" 
                        />
                      </div>
                      <div className="sm:col-span-2">
                        <input 
                          type="number" 
                          step="any" 
                          placeholder="Baseline" 
                          value={row.baseline}
                          onChange={(e) => {
                            const newRows = [...routineRows];
                            newRows[index].baseline = e.target.value;
                            setRoutineRows(newRows);
                          }}
                          required 
                          className="p-2 border rounded bg-white text-slate-900 w-full text-sm" 
                        />
                      </div>
                      <div className="sm:col-span-2">
                        <input 
                          type="number" 
                          step="any" 
                          placeholder="Target" 
                          value={row.target}
                          onChange={(e) => {
                            const newRows = [...routineRows];
                            newRows[index].target = e.target.value;
                            setRoutineRows(newRows);
                          }}
                          required 
                          className="p-2 border rounded bg-white text-slate-900 w-full text-sm" 
                        />
                      </div>
                      <div className="sm:col-span-2">
                        <input 
                          type="number" 
                          step="any" 
                          placeholder="Achievement" 
                          value={row.achievement}
                          onChange={(e) => {
                            const newRows = [...routineRows];
                            newRows[index].achievement = e.target.value;
                            setRoutineRows(newRows);
                          }}
                          required 
                          className="p-2 border rounded bg-white text-slate-900 w-full text-sm" 
                        />
                      </div>
                      <div className="sm:col-span-1 flex justify-center">
                        {routineRows.length > 1 && (
                          <button
                            type="button"
                            onClick={() => setRoutineRows(routineRows.filter((_, i) => i !== index))}
                            className="text-red-600 hover:text-red-800 text-xs font-semibold px-2 py-1"
                          >
                            ✕
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            <div className="flex justify-end">
              <button 
                type="submit" 
                disabled={isUploading}
                className="px-6 py-2 bg-emerald-600 text-white font-medium rounded-lg hover:bg-emerald-700 transition-colors disabled:opacity-50"
              >
                {isUploading ? "Saving Records..." : "Save All Records"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Interactive Search and Filter Controls */}
      <div className="flex flex-col sm:flex-row gap-4 items-center">
        <input
          type="text"
          placeholder={activeTab === "briefs" ? "Search policy briefs..." : "Search records..."}
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          className="px-4 py-2 border rounded-lg w-full sm:flex-1 bg-white text-slate-800"
        />
        
        {activeTab !== "briefs" && (
          <select
            value={stateFilter}
            onChange={(e) => { setStateFilter(e.target.value); setPage(1); }}
            className="px-4 py-2 border rounded-lg w-full sm:w-auto bg-white text-slate-800 font-medium text-emerald-900"
          >
            <option value="All">All States</option>
            {NIGERIAN_STATES.map((state) => (
              <option key={state} value={state}>{state}</option>
            ))}
          </select>
        )}
      </div>

      {/* Conditional Rendering for Policy Briefs Tab vs Data Tables */}
      {activeTab === "briefs" ? (
        <div className="space-y-6">
          {isAdmin && (
            <div className="mb-6">
              <button
                onClick={() => setShowBriefForm(!showBriefForm)}
                className="px-4 py-2 bg-emerald-700 text-white text-sm font-medium rounded-lg hover:bg-emerald-800 transition"
              >
                {showBriefForm ? "Close Form" : "+ Add New Policy Brief"}
              </button>

              {showBriefForm && (
                <form
                  action={async (formData) => {
                    const title = formData.get("title") as string;
                    const domain = formData.get("domain") as string;
                    const focus = formData.get("focus") as string;
                    const recommendationsStr = formData.get("recommendations") as string;
                    const recommendations = recommendationsStr ? recommendationsStr.split("\n").filter(Boolean) : [];
                    const fontFamily = formData.get("fontFamily") as string;
                    const fontSize = formData.get("fontSize") as string;
                    const textColor = formData.get("textColor") as string;
                    const fontWeight = formData.get("fontWeight") as string;
                    const highlightClass = formData.get("highlightClass") as string;

                    const newBrief: PolicyBriefItem = {
                      id: `brief-${Date.now()}`,
                      title,
                      domain,
                      focus,
                      recommendations,
                      fontFamily,
                      fontSize,
                      textColor,
                      fontWeight,
                      highlightClass
                    };

                    await updatePolicyBrief({
                      title,
                      domain,
                      focus,
                      recommendations,
                      fontFamily,
                      fontSize,
                    }, isAdmin);

                    setBriefsData([newBrief, ...briefsData]);
                    setShowBriefForm(false);
                    setPage(1);
                  }}
                  className="mt-4 p-6 border rounded-xl bg-slate-50 shadow-inner space-y-4"
                >
                  <h3 className="text-base font-semibold text-slate-800">
                    Create New Analytical Policy Brief (Cross-Sector & Linkages)
                  </h3>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">Policy Brief Title</label>
                      <input 
                        name="title" 
                        placeholder="e.g. Cross-Sector Integration in Agricultural Supply Chains" 
                        required 
                        className="w-full p-2 border rounded bg-white text-slate-900 text-sm" 
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">Domain / Sector</label>
                        <input 
                          name="domain" 
                          placeholder="e.g. Agriculture, Trade & Institutional Collaboration" 
                          required 
                          className="w-full p-2 border rounded bg-white text-slate-900 text-sm" 
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">Font Styling</label>
                        <select name="fontFamily" className="w-full p-2 border rounded bg-white text-slate-900 text-sm">
                          <option value="sans">Sans-Serif</option>
                          <option value="serif">Serif</option>
                          <option value="mono">Monospace</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Core Focus (Addressing cross-sector impacts, external institutional linkages, and market collaborations)
                      </label>
                      <textarea 
                        name="focus" 
                        rows={3}
                        placeholder="Describe analytical framework, cross-sector coordination, and external linkages..." 
                        required 
                        className="w-full p-2 border rounded bg-white text-slate-900 text-sm" 
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Strategic Recommendations (Enter each recommendation on a new line)
                      </label>
                      <textarea 
                        name="recommendations" 
                        rows={4}
                        placeholder="Recommendation 1&#10;Recommendation 2&#10;Recommendation 3" 
                        required 
                        className="w-full p-2 border rounded bg-white text-slate-900 text-sm" 
                      />
                    </div>

                    <div className="flex justify-end">
                      <button 
                        type="submit" 
                        className="px-5 py-2 bg-emerald-600 text-white font-medium text-sm rounded-lg hover:bg-emerald-700 transition"
                      >
                        Publish Policy Brief
                      </button>
                    </div>
                  </div>
                </form>
              )}
            </div>
          )}

          {/* Policy Briefs Display List */}
          <div className="grid grid-cols-1 gap-6">
            {filteredBriefs.length === 0 ? (
              <div className="p-8 text-center bg-white border rounded-xl text-slate-400">
                No policy briefs found matching your search.
              </div>
            ) : (
              filteredBriefs
                .slice((page - 1) * 5, page * 5)
                .map((brief) => (
                  <div key={brief.id} className="p-6 bg-white border rounded-xl shadow-sm space-y-4">
                    <div className="flex justify-between items-start gap-4">
                      <div>
                        <span className="text-xs font-bold text-emerald-700 uppercase tracking-wider">{brief.domain}</span>
                        <h3 className="text-xl font-bold text-slate-900 mt-1">{brief.title}</h3>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleDownloadSingleBriefPdf(brief)}
                          className="px-3 py-1.5 bg-rose-600 text-white text-xs font-semibold rounded hover:bg-rose-700 transition"
                        >
                          Download PDF
                        </button>
                        {isAdmin && (
                          <button
                            onClick={() => {
                              if (confirm("Are you sure you want to delete this policy brief?")) {
                                setBriefsData(briefsData.filter(b => b.id !== brief.id));
                              }
                            }}
                            className="px-3 py-1.5 bg-slate-200 text-slate-700 text-xs font-semibold rounded hover:bg-red-600 hover:text-white transition"
                            title="Delete Brief"
                          >
                            Delete
                          </button>
                        )}
                      </div>
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-slate-500 uppercase">Core Focus & Market Collaborations</h4>
                      <p className="text-slate-700 text-sm mt-1">{brief.focus}</p>
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-slate-500 uppercase mb-2">Strategic Recommendations</h4>
                      <ul className="space-y-1">
                        {brief.recommendations.map((rec, i) => (
                          <li key={i} className="text-sm text-slate-700 flex items-start gap-2">
                            <span className="text-emerald-600 font-bold">•</span>
                            <span>{rec}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                ))
            )}
          </div>

          {/* Policy Briefs Pagination Controls */}
          {Math.ceil(filteredBriefs.length / 5) > 1 && (
            <div className="flex flex-col sm:flex-row items-center justify-between border-t pt-4 gap-4 text-sm text-slate-600 bg-white px-2">
              <div>
                Showing <span className="font-semibold">{Math.min((page - 1) * 5 + 1, filteredBriefs.length)}</span> to{" "}
                <span className="font-semibold">{Math.min(page * 5, filteredBriefs.length)}</span> of{" "}
                <span className="font-semibold">{filteredBriefs.length}</span> policy briefs
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
                  disabled={page === 1}
                  className="px-3 py-1.5 border rounded-lg bg-white text-slate-700 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition"
                >
                  Previous
                </button>
                
                <span className="px-3 py-1.5 font-medium text-slate-800">
                  Page {page} of {Math.ceil(filteredBriefs.length / 5)}
                </span>

                <button
                  onClick={() => setPage((prev) => Math.min(prev + 1, Math.ceil(filteredBriefs.length / 5)))}
                  disabled={page === Math.ceil(filteredBriefs.length / 5)}
                  className="px-3 py-1.5 border rounded-lg bg-white text-slate-700 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      ) : (
        /* Data Tables for Success Stories & Routine Performance */
        <div className="space-y-4">
          <div className="overflow-x-auto border rounded-xl bg-white shadow-sm">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-100 border-b text-slate-700 text-xs uppercase tracking-wider">
                  {activeTab === "stories" ? (
                    <>
                      <th className="p-3">Full Name</th>
                      <th className="p-3">State</th>
                      <th className="p-3">Cluster</th>
                      <th className="p-3">User Group</th>
                      <th className="p-3">Location</th>
                      <th className="p-3">Narration</th>
                      <th className="p-3 text-right">Actions</th>
                    </>
                  ) : (
                    <>
                      <th className="p-3">State</th>
                      <th className="p-3">Period</th>
                      <th className="p-3">KPI</th>
                      <th className="p-3">Baseline</th>
                      <th className="p-3">Target</th>
                      <th className="p-3">Achievement</th>
                      <th className="p-3">Variance</th>
                      <th className="p-3">Flag</th>
                      <th className="p-3 text-right">Actions</th>
                    </>
                  )}
                </tr>
              </thead>
              <tbody className="divide-y text-sm text-slate-800">
                {isPending ? (
                  <tr>
                    <td colSpan={9} className="p-8 text-center text-slate-500">Loading records...</td>
                  </tr>
                ) : data.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="p-8 text-center text-slate-500">No records found. Click "+ Add" to create one.</td>
                  </tr>
                ) : (
                  data.map((item, idx) => (
                    <tr key={idx} className="hover:bg-slate-50 transition">
                      {activeTab === "stories" ? (
                        <>
                          <td className="p-3 font-medium">{(item as SuccessStoryItem).fullName}</td>
                          <td className="p-3">{(item as SuccessStoryItem).state}</td>
                          <td className="p-3">{(item as SuccessStoryItem).clusterName || "N/A"}</td>
                          <td className="p-3">{(item as SuccessStoryItem).userGroup || "N/A"}</td>
                          <td className="p-3">{(item as SuccessStoryItem).location || "N/A"}</td>
                          <td className="p-3 max-w-xs truncate">{(item as SuccessStoryItem).narration}</td>
                          <td className="p-3 text-right">
                            <span className="text-xs text-slate-400">Recorded</span>
                          </td>
                        </>
                      ) : (
                        <>
                          <td className="p-3 font-medium">{(item as RoutinePerformanceItem).state}</td>
                          <td className="p-3">{(item as RoutinePerformanceItem).quarter} {(item as RoutinePerformanceItem).year}</td>
                          <td className="p-3 max-w-xs">{(item as RoutinePerformanceItem).kpi}</td>
                          <td className="p-3">{(item as RoutinePerformanceItem).baseline}</td>
                          <td className="p-3">{(item as RoutinePerformanceItem).target}</td>
                          <td className="p-3">{(item as RoutinePerformanceItem).achievement}</td>
                          <td className="p-3">{(item as RoutinePerformanceItem).variance}</td>
                          <td className="p-3">
                            <span className={`px-2 py-0.5 rounded text-xs font-semibold ${
                              (item as RoutinePerformanceItem).flag === "On Track" ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-800"
                            }`}>
                              {(item as RoutinePerformanceItem).flag} ({(item as RoutinePerformanceItem).pct}%)
                            </span>
                          </td>
                          <td className="p-3 text-right">
                            <span className="text-xs text-slate-400">Recorded</span>
                          </td>
                        </>
                      )}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}