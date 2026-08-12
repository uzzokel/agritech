"use client";

import { useState, useEffect, useTransition, useMemo } from "react";
import { getLessons, createLesson, deleteLesson } from "@/app/actions/lessons-actions";
import { 
  BookOpen, 
  Plus, 
  Trash2, 
  Loader2, 
  AlertCircle, 
  Calendar, 
  User, 
  CheckCircle2,
  Download,
  Filter,
  Search,
  ChevronLeft,
  ChevronRight
} from "lucide-react";

// Standardized component options for the dropdown
const COMPONENT_OPTIONS = [
  "Component 1: Capacity Building & Governance",
  "Component 2: Agribusiness & Infrastructure",
  "Component 3: Project Management & M&E",
  "Component 4: Environmental & Social Safeguards",
  "Component 5: Financial Management & Procurement",
] as const;

type Lesson = {
  id: string;
  component: string;
  whatWentWrong: string;
  rootCauseAnalysis: string;
  impact: string;
  actionableRecommendation: string;
  actionOwner: string;
  timestamp: Date | string;
};

const ITEMS_PER_PAGE = 10;
const MAX_PAGES = 10;

export default function LessonsLearnedPage() {
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [loading, setLoading] = useState(true);
  const [isExporting, setIsExporting] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [isOpen, setIsOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Search & Filter state
  const [selectedComponentFilter, setSelectedComponentFilter] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState<string>("");

  // Pagination state
  const [currentPage, setCurrentPage] = useState<number>(1);

  // Form state
  const [formData, setFormData] = useState({
    component: COMPONENT_OPTIONS[0] as string,
    whatWentWrong: "",
    rootCauseAnalysis: "",
    impact: "",
    actionableRecommendation: "",
    actionOwner: "",
  });

  // Fetch initial records
  const fetchLessons = async () => {
    setLoading(true);
    try {
      const res = await getLessons();
      if (res?.success && res.data) {
        setLessons(res.data);
      } else {
        setError(res?.error || "Failed to load lessons.");
      }
    } catch {
      setError("An unexpected error occurred while fetching lessons.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLessons();
  }, []);

  // Reset pagination when search query or filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedComponentFilter, searchQuery]);

  // Filtered lessons memoized for efficiency
  const filteredLessons = useMemo(() => {
    return lessons.filter((lesson) => {
      const matchesComponent =
        selectedComponentFilter === "ALL" || lesson.component === selectedComponentFilter;
      
      const query = searchQuery.toLowerCase();
      const matchesSearch =
        !query ||
        lesson.whatWentWrong?.toLowerCase().includes(query) ||
        lesson.rootCauseAnalysis?.toLowerCase().includes(query) ||
        lesson.impact?.toLowerCase().includes(query) ||
        lesson.actionableRecommendation?.toLowerCase().includes(query) ||
        lesson.actionOwner?.toLowerCase().includes(query);

      return matchesComponent && matchesSearch;
    });
  }, [lessons, selectedComponentFilter, searchQuery]);

  // Calculate total pages capped at MAX_PAGES (10)
  const totalPages = Math.min(
    Math.ceil(filteredLessons.length / ITEMS_PER_PAGE) || 1,
    MAX_PAGES
  );

  // Get current page slice
  const paginatedLessons = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredLessons.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [filteredLessons, currentPage]);

  // Handle Dynamic PDF Export (prevents SSR window errors)
  const handleExportPDF = async () => {
    if (filteredLessons.length === 0) return;
    setIsExporting(true);

    try {
      // Dynamic imports for browser-only execution
      const { default: jsPDF } = await import("jspdf");
      const { default: autoTable } = await import("jspdf-autotable");

      const doc = new jsPDF({ orientation: "landscape", unit: "pt", format: "a4" });

      // Document Title & Metadata
      doc.setFontSize(18);
      doc.setTextColor(15, 23, 42); // slate-900
      doc.text("Lessons Learned Directory", 40, 40);

      doc.setFontSize(10);
      doc.setTextColor(100, 116, 139); // slate-500
      doc.text(
        `Export Generated: ${new Date().toLocaleString()} | Filter: ${
          selectedComponentFilter === "ALL" ? "All Components" : selectedComponentFilter
        }`,
        40,
        56
      );

      // Prepare table data
      const tableData = filteredLessons.map((item) => [
        `${item.component}\n\n${new Date(item.timestamp).toLocaleDateString("en-US")}`,
        `Issue:\n${item.whatWentWrong}\n\nRoot Cause:\n${item.rootCauseAnalysis}`,
        item.impact,
        `Recommendation:\n${item.actionableRecommendation}\n\nOwner: ${item.actionOwner}`,
      ]);

      // Render AutoTable
      autoTable(doc, {
        startY: 70,
        head: [["Component & Date", "Issue & Root Cause", "Impact", "Recommendation & Owner"]],
        body: tableData,
        theme: "striped",
        headStyles: {
          fillColor: [5, 150, 105], // emerald-600
          textColor: 255,
          fontSize: 9,
          fontStyle: "bold",
        },
        bodyStyles: {
          fontSize: 8,
          textColor: [51, 65, 85], // slate-700
        },
        columnStyles: {
          0: { cellWidth: 140 },
          1: { cellWidth: 230 },
          2: { cellWidth: 170 },
          3: { cellWidth: 220 },
        },
        styles: {
          overflow: "linebreak",
          cellPadding: 6,
        },
      });

      doc.save(`lessons-learned-${new Date().toISOString().slice(0, 10)}.pdf`);
    } catch (err) {
      console.error("Failed to generate PDF:", err);
      alert("Could not generate PDF report. Please try again.");
    } finally {
      setIsExporting(false);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    startTransition(async () => {
      const res = await createLesson(formData);
      if (res?.success) {
        setFormData({
          component: COMPONENT_OPTIONS[0],
          whatWentWrong: "",
          rootCauseAnalysis: "",
          impact: "",
          actionableRecommendation: "",
          actionOwner: "",
        });
        setIsOpen(false);
        fetchLessons();
      } else {
        setError(res?.error || "Something went wrong.");
      }
    });
  };

  const handleDelete = (id: string) => {
    if (!confirm("Are you sure you want to delete this record?")) return;

    startTransition(async () => {
      const res = await deleteLesson(id);
      if (res?.success) {
        fetchLessons();
      } else {
        alert(res?.error || "Failed to delete.");
      }
    });
  };

  return (
    <div className="min-h-screen bg-slate-50/50 p-6 md:p-10 space-y-8">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-emerald-600 font-semibold text-sm">
            <BookOpen className="w-4 h-4" />
            <span>Continuous Improvement Log</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-bold text-slate-900 tracking-tight">
            Lessons Learned Directory
          </h1>
          <p className="text-sm text-slate-500">
            Document root cause analyses, operational impacts, and corrective recommendations.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleExportPDF}
            disabled={filteredLessons.length === 0 || isExporting}
            className="inline-flex items-center justify-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-700 disabled:opacity-50 px-4 py-2.5 rounded-xl text-sm font-medium transition-all shadow-sm active:scale-95"
          >
            {isExporting ? (
              <Loader2 className="w-4 h-4 animate-spin text-slate-600" />
            ) : (
              <Download className="w-4 h-4 text-slate-600" />
            )}
            {isExporting ? "Exporting..." : "Export PDF"}
          </button>

          <button
            onClick={() => setIsOpen(true)}
            className="inline-flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2.5 rounded-xl text-sm font-medium transition-all shadow-sm active:scale-95"
          >
            <Plus className="w-4 h-4" />
            Add New Lesson
          </button>
        </div>
      </div>

      {/* Summary KPI Widgets */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            Total Logged Lessons
          </p>
          <p className="text-3xl font-extrabold text-slate-900 mt-2">{lessons.length}</p>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            Active Components
          </p>
          <p className="text-3xl font-extrabold text-emerald-600 mt-2">
            {new Set(lessons.map((l) => l.component)).size}
          </p>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            Action Owners Assigned
          </p>
          <p className="text-3xl font-extrabold text-indigo-600 mt-2">
            {new Set(lessons.map((l) => l.actionOwner)).size}
          </p>
        </div>
      </div>

      {/* Filters and Search Bar */}
      <div className="flex flex-col sm:flex-row gap-4 bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search by keywords, root cause, owner..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
          />
        </div>

        <div className="flex items-center gap-2 min-w-[280px]">
          <Filter className="w-4 h-4 text-slate-400 shrink-0" />
          <select
            value={selectedComponentFilter}
            onChange={(e) => setSelectedComponentFilter(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
          >
            <option value="ALL">All Components</option>
            {COMPONENT_OPTIONS.map((opt) => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Main Table / Content Section */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3 text-slate-400">
            <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
            <p className="text-sm">Loading lessons database...</p>
          </div>
        ) : filteredLessons.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
            <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center text-slate-400 mb-3">
              <BookOpen className="w-6 h-6" />
            </div>
            <h3 className="text-base font-semibold text-slate-800">No lessons found</h3>
            <p className="text-sm text-slate-500 max-w-md mt-1">
              {lessons.length === 0
                ? "Start building your project memory by recording bottlenecks, root causes, and corrective action owners."
                : "No records match your selected component or search criteria."}
            </p>
            {lessons.length === 0 && (
              <button
                onClick={() => setIsOpen(true)}
                className="mt-4 text-sm font-medium text-emerald-600 hover:text-emerald-700 underline"
              >
                Add the first record
              </button>
            )}
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold text-xs uppercase tracking-wider">
                  <tr>
                    <th className="px-6 py-4">Timestamp & Component</th>
                    <th className="px-6 py-4">Issue & Root Cause</th>
                    <th className="px-6 py-4">Impact</th>
                    <th className="px-6 py-4">Action & Owner</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {paginatedLessons.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                      {/* Timestamp & Component Column */}
                      <td className="px-6 py-4 vertical-top max-w-[220px]">
                        <div className="space-y-1.5">
                          <span className="inline-block bg-slate-100 text-slate-800 text-xs px-2.5 py-1 rounded-md font-medium border border-slate-200">
                            {item.component}
                          </span>
                          <div className="flex items-center gap-1.5 text-xs text-slate-400">
                            <Calendar className="w-3.5 h-3.5" />
                            <span>
                              {new Date(item.timestamp).toLocaleString("en-US", {
                                dateStyle: "medium",
                                timeStyle: "short",
                              })}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* What Went Wrong & Root Cause */}
                      <td className="px-6 py-4 space-y-2 max-w-[300px]">
                        <div>
                          <span className="text-xs font-semibold text-red-600 uppercase tracking-wider block">
                            What Went Wrong:
                          </span>
                          <p className="text-slate-800 font-medium whitespace-pre-wrap">
                            {item.whatWentWrong}
                          </p>
                        </div>
                        <div>
                          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
                            Root Cause:
                          </span>
                          <p className="text-slate-600 text-xs whitespace-pre-wrap">
                            {item.rootCauseAnalysis}
                          </p>
                        </div>
                      </td>

                      {/* Impact Column */}
                      <td className="px-6 py-4 max-w-[220px] whitespace-pre-wrap text-slate-600">
                        {item.impact}
                      </td>

                      {/* Actionable Recommendation & Owner */}
                      <td className="px-6 py-4 space-y-2 max-w-[280px]">
                        <div>
                          <span className="text-xs font-semibold text-emerald-600 uppercase tracking-wider block">
                            Recommendation:
                          </span>
                          <p className="text-slate-700 whitespace-pre-wrap">
                            {item.actionableRecommendation}
                          </p>
                        </div>
                        <div className="flex items-center gap-1.5 text-xs font-medium text-slate-800 bg-emerald-50 px-2 py-1 rounded-md w-fit border border-emerald-100">
                          <User className="w-3.5 h-3.5 text-emerald-600" />
                          <span>Owner: {item.actionOwner}</span>
                        </div>
                      </td>

                      {/* Action Buttons */}
                      <td className="px-6 py-4 text-right align-top">
                        <button
                          onClick={() => handleDelete(item.id)}
                          disabled={isPending}
                          className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Delete Record"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            <div className="flex items-center justify-between px-6 py-4 border-t border-slate-100 bg-slate-50/50">
              <p className="text-xs text-slate-500">
                Showing{" "}
                <span className="font-semibold text-slate-700">
                  {Math.min((currentPage - 1) * ITEMS_PER_PAGE + 1, filteredLessons.length)}
                </span>{" "}
                to{" "}
                <span className="font-semibold text-slate-700">
                  {Math.min(currentPage * ITEMS_PER_PAGE, filteredLessons.length)}
                </span>{" "}
                of <span className="font-semibold text-slate-700">{filteredLessons.length}</span> entries
              </p>

              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                  className="p-2 border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-100 disabled:opacity-40 disabled:hover:bg-transparent transition-colors"
                  title="Previous Page"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>

                {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
                  <button
                    key={pageNum}
                    onClick={() => setCurrentPage(pageNum)}
                    className={`w-8 h-8 rounded-lg text-xs font-medium transition-colors ${
                      currentPage === pageNum
                        ? "bg-emerald-600 text-white font-semibold"
                        : "text-slate-600 hover:bg-slate-100 border border-slate-200"
                    }`}
                  >
                    {pageNum}
                  </button>
                ))}

                <button
                  onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                  className="p-2 border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-100 disabled:opacity-40 disabled:hover:bg-transparent transition-colors"
                  title="Next Page"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Modal Form Dialog */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 md:p-8 shadow-2xl space-y-6 border border-slate-100 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <h2 className="text-xl font-bold text-slate-900">Record New Lesson Learned</h2>
                <p className="text-xs text-slate-500">Fill in details for tracking and prevention</p>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="text-slate-400 hover:text-slate-600 text-sm font-semibold p-1"
              >
                ✕
              </button>
            </div>

            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-xl flex items-center gap-2 text-xs text-red-700">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Dropdown for Component Selection */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Project Component *
                </label>
                <select
                  name="component"
                  value={formData.component}
                  onChange={handleChange}
                  required
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 transition-all"
                >
                  {COMPONENT_OPTIONS.map((opt) => (
                    <option key={opt} value={opt}>
                      {opt}
                    </option>
                  ))}
                </select>
              </div>

              {/* What Went Wrong */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  What Went Wrong? *
                </label>
                <textarea
                  name="whatWentWrong"
                  rows={2}
                  value={formData.whatWentWrong}
                  onChange={handleChange}
                  required
                  placeholder="Describe the issue or bottleneck encountered..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 transition-all"
                />
              </div>

              {/* Root Cause Analysis */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Root Cause Analysis *
                </label>
                <textarea
                  name="rootCauseAnalysis"
                  rows={2}
                  value={formData.rootCauseAnalysis}
                  onChange={handleChange}
                  required
                  placeholder="Why did this happen? (e.g., delayed disbursement, lack of training...)"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 transition-all"
                />
              </div>

              {/* Operational Impact */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Operational Impact *
                </label>
                <textarea
                  name="impact"
                  rows={2}
                  value={formData.impact}
                  onChange={handleChange}
                  required
                  placeholder="Effect on budget, timelines, outputs, or team operations..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 transition-all"
                />
              </div>

              {/* Actionable Recommendation */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Actionable Recommendation *
                </label>
                <textarea
                  name="actionableRecommendation"
                  rows={2}
                  value={formData.actionableRecommendation}
                  onChange={handleChange}
                  required
                  placeholder="Corrective steps to avoid recurrence..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 transition-all"
                />
              </div>

              {/* Action Owner */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Action Owner *
                </label>
                <input
                  type="text"
                  name="actionOwner"
                  value={formData.actionOwner}
                  onChange={handleChange}
                  required
                  placeholder="e.g. M&E Specialist, Procurement Unit, State Coordinator"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 transition-all"
                />
              </div>

              {/* Buttons */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2 rounded-xl text-sm font-medium transition-all shadow-sm disabled:opacity-50"
                >
                  {isPending ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      Save Record
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}