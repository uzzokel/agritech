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
  deletePolicyRecord 
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

type FeedTab = "stories" | "routine";

interface PolicyFeedProps {
  isAdmin?: boolean; 
}

export function PolicyFeed({ isAdmin = true }: PolicyFeedProps) {
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

  // Fetch data on state changes
  useEffect(() => {
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
    const csvString = await exportPolicyDataToCsv(activeTab, stateFilter);
    const blob = new Blob([csvString], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `${activeTab}_export.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Updated PDF Export to precisely match the table layout & information
  const handleExportPdf = () => {
    const doc = new jsPDF({ orientation: "landscape" });
    doc.setFontSize(16);
    doc.text(
      activeTab === "stories" ? "Success Stories Report" : "Routine Performance Report", 
      14, 
      20
    );
    doc.setFontSize(10);
    doc.text(`State Filter: ${stateFilter} | Generated: ${new Date().toLocaleDateString()}`, 14, 28);

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

    doc.save(`${activeTab}_report.pdf`);
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this record?")) return;
    
    startTransition(async () => {
      const res = await deletePolicyRecord(activeTab, id, isAdmin);
      if (res?.success) {
        const refreshed = activeTab === "stories" 
          ? await getSuccessStories({ page, search, state: stateFilter }) 
          : await getRoutinePerformance({ page, search, state: stateFilter });
        setData(refreshed.data);
        setPagination(refreshed.pagination);
      } else {
        alert(res?.error || "Failed to delete record.");
      }
    });
  };

  return (
    <div className="space-y-6">
      {/* Navigation Tabs between Policy views */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b pb-4 gap-4">
        <div className="flex gap-4">
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
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setShowForm(!showForm)}
            className="px-4 py-2 bg-emerald-700 text-white rounded-lg text-sm font-medium hover:bg-emerald-800 transition-colors"
          >
            {showForm ? "Cancel" : `+ Add ${activeTab === "stories" ? "Story" : "Metric"}`}
          </button>
          <button
            onClick={handleExportCsv}
            className="px-3 py-2 bg-slate-800 text-white rounded-lg text-sm font-medium hover:bg-slate-700 transition-colors"
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
      {showForm && (
        <div className="p-6 border rounded-xl bg-slate-50 shadow-inner">
          <h3 className="text-lg font-semibold mb-4 text-slate-800">
            {activeTab === "stories" ? "New Success Story Entry" : "New Routine Performance Entry"}
          </h3>

          <form 
            onSubmit={async (e) => {
              e.preventDefault();
              setIsUploading(true);
              const formElement = e.currentTarget;
              const formData = new FormData(formElement);
              
              try {
                const res = activeTab === "stories" 
                  ? await createSuccessStory(formData) 
                  : await createRoutinePerformance(formData);
                
                if (res.success) {
                  formElement.reset();
                  setShowForm(false);
                  startTransition(async () => {
                    const refreshed = activeTab === "stories" 
                      ? await getSuccessStories({ page, search, state: stateFilter }) 
                      : await getRoutinePerformance({ page, search, state: stateFilter });
                    setData(refreshed.data);
                    setPagination(refreshed.pagination);
                  });
                } else {
                  alert(res.error || "Failed to save record.");
                }
              } finally {
                setIsUploading(false);
              }
            }}
            className="grid grid-cols-1 sm:grid-cols-2 gap-4"
          >
            {activeTab === "stories" ? (
              <>
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
              </>
            ) : (
              <>
                <select name="state" required className="p-2 border rounded bg-white text-slate-900">
                  <option value="">Select State</option>
                  {NIGERIAN_STATES.map((state) => (
                    <option key={state} value={state}>{state}</option>
                  ))}
                </select>
                <input name="quarter" placeholder="Quarter (e.g. Q1)" required className="p-2 border rounded bg-white text-slate-900" />
                <input name="year" placeholder="Year (e.g. 2026)" required className="p-2 border rounded bg-white text-slate-900" />
                <input name="kpi" placeholder="KPI Description" required className="p-2 border rounded bg-white text-slate-900 sm:col-span-2" />
                <input name="baseline" type="number" step="any" placeholder="Baseline Value" required className="p-2 border rounded bg-white text-slate-900" />
                <input name="target" type="number" step="any" placeholder="Target Value" required className="p-2 border rounded bg-white text-slate-900" />
                <input name="achievement" type="number" step="any" placeholder="Achievement Value" required className="p-2 border rounded bg-white text-slate-900 sm:col-span-2" />
              </>
            )}
            <div className="sm:col-span-2 flex justify-end">
              <button 
                type="submit" 
                disabled={isUploading}
                className="px-6 py-2 bg-emerald-600 text-white font-medium rounded-lg hover:bg-emerald-700 transition-colors disabled:opacity-50"
              >
                {isUploading ? "Uploading & Saving..." : "Save Record"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Interactive Search and Filter Controls */}
      <div className="flex flex-col sm:flex-row gap-4 items-center">
        <input
          type="text"
          placeholder="Search records..."
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          className="px-4 py-2 border rounded-lg w-full sm:flex-1 bg-white text-slate-800"
        />
        
        <select
          value={stateFilter}
          onChange={(e) => { setStateFilter(e.target.value); setPage(1); }}
          className="px-4 py-2 border rounded-lg w-full sm:w-auto bg-white text-slate-800"
        >
          <option value="All">All States</option>
          {NIGERIAN_STATES.map((state) => (
            <option key={state} value={state}>{state}</option>
          ))}
        </select>
      </div>

      {/* Data Table */}
      <div className="border rounded-lg overflow-x-auto bg-white shadow-sm">
        <table className="w-full text-left border-collapse min-w-[650px]">
          <thead className="bg-slate-50 border-b text-xs font-semibold text-slate-500 uppercase">
            {activeTab === "stories" ? (
              <tr>
                <th className="p-3">Visual & Subject</th>
                <th className="p-3">Location & Details</th>
                <th className="p-3">Narration</th>
                <th className="p-3">GPS Location</th>
                {isAdmin && <th className="p-3 text-right">Actions</th>}
              </tr>
            ) : (
              <tr>
                <th className="p-3">State</th>
                <th className="p-3">Quarter</th>
                <th className="p-3">KPI</th>
                <th className="p-3">Baseline</th>
                <th className="p-3">Target</th>
                <th className="p-3">Achievement</th>
                <th className="p-3">Variance</th>
                <th className="p-3">Flag</th>
                {isAdmin && <th className="p-3 text-right">Actions</th>}
              </tr>
            )}
          </thead>
          <tbody className="divide-y text-sm text-slate-700">
            {isPending ? (
              <tr>
                <td colSpan={isAdmin ? (activeTab === "stories" ? 5 : 9) : (activeTab === "stories" ? 4 : 8)} className="p-6 text-center text-slate-400">Loading data...</td>
              </tr>
            ) : data.length === 0 ? (
              <tr>
                <td colSpan={isAdmin ? (activeTab === "stories" ? 5 : 9) : (activeTab === "stories" ? 4 : 8)} className="p-6 text-center text-slate-400">No records found.</td>
              </tr>
            ) : (
              data.map((item) => (
                activeTab === "stories" ? (
                  (() => {
                    const story = item as SuccessStoryItem;
                    return (
                      <tr key={story.id} className="hover:bg-slate-50 align-top">
                        <td className="p-3">
                          <div className="flex items-center gap-3">
                            {story.imageUrl || story.photoUrl ? (
                              <img 
                                src={story.imageUrl || story.photoUrl || ""} 
                                alt={story.fullName} 
                                className="w-16 h-16 object-cover rounded-lg border shadow-sm shrink-0" 
                              />
                            ) : (
                              <div className="w-16 h-16 bg-slate-100 rounded-lg flex items-center justify-center text-slate-400 text-xs shrink-0">
                                No Image
                              </div>
                            )}
                            <div>
                              <p className="font-semibold text-slate-900">{story.fullName}</p>
                              <span className="inline-block px-2 py-0.5 mt-1 bg-emerald-50 text-emerald-700 text-xs font-medium rounded">
                                {story.state}
                              </span>
                            </div>
                          </div>
                        </td>
                        <td className="p-3">
                          <p className="text-xs text-slate-600"><span className="font-medium">Cluster:</span> {story.clusterName || "N/A"}</p>
                          <p className="text-xs text-slate-600"><span className="font-medium">Group:</span> {story.userGroup || "N/A"}</p>
                          <p className="text-xs text-slate-600"><span className="font-medium">Location:</span> {story.location || "N/A"}</p>
                        </td>
                        <td className="p-3 max-w-xs">
                          <p className="text-slate-700 text-xs line-clamp-3 leading-relaxed">{story.narration}</p>
                        </td>
                        <td className="p-3">
                          {story.gps ? (
                            (() => {
                              const parts = story.gps.split(',');
                              if (parts.length !== 2) {
                                return <span className="text-xs font-mono text-slate-800 bg-slate-100 px-2 py-0.5 rounded block">{story.gps}</span>;
                              }
                              
                              const lat = parseFloat(parts[0].trim());
                              const lon = parseFloat(parts[1].trim());

                              if (isNaN(lat) || isNaN(lon)) {
                                return <span className="text-xs font-mono text-slate-800 bg-slate-100 px-2 py-0.5 rounded block">{story.gps}</span>;
                              }

                              return (
                                <div className="space-y-1.5">
                                  <span className="text-[10px] text-slate-500 font-mono block">{story.gps}</span>
                                  <div className="w-32 h-20 rounded border overflow-hidden bg-slate-100 shadow-inner relative group">
                                    <iframe
                                      width="100%"
                                      height="100%"
                                      style={{ border: 0, pointerEvents: "none" }}
                                      loading="lazy"
                                      src={`https://www.openstreetmap.org/export/embed.html?bbox=${lon - 0.01}%2C${lat - 0.01}%2C${lon + 0.01}%2C${lat + 0.01}&layer=mapnik&marker=${lat}%2C${lon}`}
                                    />
                                    <a
                                      href={`https://www.google.com/maps/search/?api=1&query=${lat},${lon}`}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-[10px] font-medium text-center p-1"
                                    >
                                      Expand Map ↗
                                    </a>
                                  </div>
                                </div>
                              );
                            })()
                          ) : (
                            <span className="text-xs text-slate-400 italic">No GPS provided</span>
                          )}
                        </td>
                        {isAdmin && (
                          <td className="p-3 text-right">
                            <button
                              onClick={() => handleDelete(story.id)}
                              className="px-2.5 py-1 bg-red-50 text-red-600 hover:bg-red-100 text-xs font-medium rounded transition-colors"
                            >
                              Delete
                            </button>
                          </td>
                        )}
                      </tr>
                    );
                  })()
                ) : (
                  (() => {
                    const routine = item as RoutinePerformanceItem;
                    return (
                      <tr key={routine.id} className="hover:bg-slate-50">
                        <td className="p-3 font-medium">{routine.state}</td>
                        <td className="p-3">{routine.quarter} ({routine.year})</td>
                        <td className="p-3">{routine.kpi}</td>
                        <td className="p-3">{routine.baseline}</td>
                        <td className="p-3">{routine.target}</td>
                        <td className="p-3">{routine.achievement}</td>
                        <td className="p-3">{routine.variance}</td>
                        <td className="p-3">
                          <span className={`px-2 py-1 rounded text-xs font-semibold ${
                            routine.flag === "Green" ? "bg-green-100 text-green-800" :
                            routine.flag === "Amber" ? "bg-amber-100 text-amber-800" : "bg-red-100 text-red-800"
                          }`}>
                            {routine.flag} ({routine.pct}%)
                          </span>
                        </td>
                        {isAdmin && (
                          <td className="p-3 text-right">
                            <button
                              onClick={() => handleDelete(routine.id)}
                              className="px-2.5 py-1 bg-red-50 text-red-600 hover:bg-red-100 text-xs font-medium rounded transition-colors"
                            >
                              Delete
                            </button>
                          </td>
                        )}
                      </tr>
                    );
                  })()
                )
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Controls */}
      <div className="flex flex-col sm:flex-row justify-between items-center text-sm text-slate-600 gap-3">
        <span>Showing {pagination.startItem} to {pagination.endItem} of {pagination.totalCount} entries</span>
        <div className="flex gap-2 items-center">
          <button
            onClick={() => setPage((p) => Math.max(p - 1, 1))}
            disabled={pagination.currentPage === 1 || isPending}
            className="px-3 py-1 border rounded disabled:opacity-50 hover:bg-slate-50 transition-colors"
          >
            Previous
          </button>
          <span className="px-3 py-1">{pagination.currentPage} / {Math.max(pagination.totalPages, 1)}</span>
          <button
            onClick={() => setPage((p) => Math.min(p + 1, pagination.totalPages))}
            disabled={pagination.currentPage >= pagination.totalPages || isPending}
            className="px-3 py-1 border rounded disabled:opacity-50 hover:bg-slate-50 transition-colors"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
}