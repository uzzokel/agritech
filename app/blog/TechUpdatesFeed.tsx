// app/blog/TechUpdatesFeed.tsx
"use client";

import React, { useState, useEffect, useTransition } from "react";
import { getTechAdoptions, createTechAdoption, deleteTechAdoption } from "@/app/actions/tech-actions";

interface TechAdoptionItem {
  id: string;
  technologyName: string;
  category: string;
  state: string;
  clusterName: string;
  adoptionRate: number;
  beneficiariesCount: number;
  notes: string;
  imageUrl?: string | null;
  recordedBy?: string | null;
  createdAt?: Date;
}

interface TechUpdatesFeedProps {
  isAdmin?: boolean;
}

const NIGERIAN_STATES = [
  "Abia", "Adamawa", "Akwa Ibom", "Anambra", "Bauchi", "Bayelsa", "Benue", 
  "Borno", "Cross River", "Delta", "Ebonyi", "Edo", "Ekiti", "Enugu", 
  "FCT - Abuja", "Gombe", "Imo", "Jigawa", "Kaduna", "Kano", "Katsina", 
  "Kebbi", "Kogi", "Kwara", "Lagos", "Nasarawa", "Niger", "Ogun", "Ondo", 
  "Osun", "Oyo", "Plateau", "Rivers", "Sokoto", "Taraba", "Yobe", "Zamfara"
];

const CATEGORIES = ["All", "Input & Seeds", "Digital / Mobile", "Machinery & Equipment", "Soil & Irrigation"];

export function TechUpdatesFeed({ isAdmin = true }: TechUpdatesFeedProps) {
  const [data, setData] = useState<TechAdoptionItem[]>([]);
  const [pagination, setPagination] = useState({ 
    currentPage: 1, 
    totalPages: 1, 
    startItem: 0, 
    endItem: 0, 
    totalCount: 0 
  });

  const [search, setSearch] = useState("");
  const [filterCategory, setFilterCategory] = useState("All");
  const [filterState, setFilterState] = useState("All");
  const [page, setPage] = useState(1);

  const [showForm, setShowForm] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isPending, startTransition] = useTransition();

  // Fetch data on state/page/filter changes
  useEffect(() => {
    startTransition(async () => {
      const res = await getTechAdoptions({ page, search, state: filterState, category: filterCategory });
      setData(res.data);
      setPagination(res.pagination);
    });
  }, [page, search, filterState, filterCategory]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b pb-4 gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Farmer Technology Adoption Tracking</h2>
          <p className="text-sm text-slate-500">Monitor rural adoption rates of agricultural innovations, inputs, and digital tools.</p>
        </div>
        
        {isAdmin && (
          <button
            onClick={() => setShowForm(!showForm)}
            className="px-4 py-2 bg-emerald-700 text-white rounded-lg text-sm font-medium hover:bg-emerald-800 transition-colors"
          >
            {showForm ? "Cancel" : "+ Record Tech Adoption"}
          </button>
        )}
      </div>

      {/* Admin Entry Form with Image Upload */}
      {showForm && (
        <form 
          onSubmit={async (e) => {
            e.preventDefault();
            setIsUploading(true);
            const formElement = e.currentTarget;
            const formData = new FormData(formElement);

            try {
              const res = await createTechAdoption(formData);
              if (res.success) {
                formElement.reset();
                setShowForm(false);
                startTransition(async () => {
                  const refreshed = await getTechAdoptions({ page, search, state: filterState, category: filterCategory });
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
          className="p-6 border rounded-xl bg-slate-50 shadow-inner space-y-4"
        >
          <h3 className="text-base font-semibold text-slate-800">New Technology Adoption Report</h3>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Technology / Innovation Name</label>
              <input 
                name="technologyName"
                placeholder="e.g. Drought-Resistant Hybrid Seeds"
                required
                className="w-full p-2 border rounded bg-white text-slate-900 text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Category</label>
              <select
                name="category"
                required
                className="w-full p-2 border rounded bg-white text-slate-900 text-sm"
              >
                <option value="Input & Seeds">Input & Seeds</option>
                <option value="Digital / Mobile">Digital / Mobile</option>
                <option value="Machinery & Equipment">Machinery & Equipment</option>
                <option value="Soil & Irrigation">Soil & Irrigation</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">State</label>
              <select
                name="state"
                required
                className="w-full p-2 border rounded bg-white text-slate-900 text-sm"
              >
                <option value="">Select State</option>
                {NIGERIAN_STATES.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Cluster Name</label>
              <input 
                name="clusterName"
                placeholder="e.g. Zaria Maize Growers Hub"
                required
                className="w-full p-2 border rounded bg-white text-slate-900 text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Adoption Rate (%)</label>
              <input 
                type="number"
                step="any"
                min="0"
                max="100"
                name="adoptionRate"
                placeholder="e.g. 75"
                required
                className="w-full p-2 border rounded bg-white text-slate-900 text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Estimated Beneficiaries (Farmers)</label>
              <input 
                type="number"
                name="beneficiariesCount"
                placeholder="e.g. 1200"
                required
                className="w-full p-2 border rounded bg-white text-slate-900 text-sm"
              />
            </div>

            <div className="sm:col-span-2 flex flex-col gap-1">
              <label className="text-xs font-semibold text-slate-600">Upload Field Evidence / Photo</label>
              <input 
                name="image" 
                type="file" 
                accept="image/*" 
                className="p-2 border rounded bg-white text-slate-900 file:mr-4 file:py-1 file:px-4 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100" 
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-600 mb-1">Field Notes / Observations</label>
              <textarea 
                name="notes"
                placeholder="Provide qualitative feedback on adoption barriers or success metrics..."
                rows={3}
                required
                className="w-full p-2 border rounded bg-white text-slate-900 text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Recorded By (Officer Name)</label>
              <input 
                name="recordedBy"
                placeholder="e.g. Dr. Aminu Bello"
                className="w-full p-2 border rounded bg-white text-slate-900 text-sm"
              />
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={isUploading}
              className="px-6 py-2 bg-emerald-600 text-white font-medium text-sm rounded-lg hover:bg-emerald-700 transition disabled:opacity-50"
            >
              {isUploading ? "Saving Record..." : "Save Adoption Record"}
            </button>
          </div>
        </form>
      )}

      {/* Search & Filter Controls */}
      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between bg-white p-4 border rounded-xl shadow-sm">
        <input
          type="text"
          placeholder="Search technologies, clusters, officers..."
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          className="px-4 py-2 border rounded-lg w-full sm:flex-1 bg-white text-slate-800 text-sm"
        />

        <select
          value={filterState}
          onChange={(e) => { setFilterState(e.target.value); setPage(1); }}
          className="p-2 border rounded-lg bg-white text-slate-800 text-sm w-full sm:w-48 font-medium text-emerald-900"
        >
          <option value="All">All States</option>
          {NIGERIAN_STATES.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
      </div>

      {/* Category Tabs */}
      <div className="flex flex-wrap gap-2">
        {CATEGORIES.map((cat) => (
          <button
            key={cat}
            onClick={() => { setFilterCategory(cat); setPage(1); }}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
              filterCategory === cat 
                ? "bg-emerald-600 text-white" 
                : "bg-slate-100 text-slate-700 hover:bg-slate-200"
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Adoption Feed Cards */}
      <div className="space-y-4">
        {isPending ? (
          <div className="p-8 text-center bg-white border rounded-xl text-slate-500">Loading adoption records...</div>
        ) : data.length === 0 ? (
          <div className="p-8 text-center bg-white border rounded-xl text-slate-500">
            No technology adoption records found matching your filters.
          </div>
        ) : (
          data.map((item) => (
            <div key={item.id} className="p-6 bg-white border rounded-xl shadow-sm space-y-4 hover:border-emerald-200 transition">
              <div className="flex flex-wrap justify-between items-center gap-2">
                <div className="flex items-center gap-2">
                  <span className="bg-emerald-50 text-emerald-800 text-xs font-bold px-2.5 py-1 rounded-md">
                    {item.category}
                  </span>
                  <span className="bg-slate-100 text-slate-700 text-xs font-semibold px-2.5 py-1 rounded-md">
                    {item.state} • {item.clusterName}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs text-slate-400">
                    {item.createdAt ? new Date(item.createdAt).toLocaleDateString() : ""} • Recorded by {item.recordedBy || "Officer"}
                  </span>
                  {isAdmin && (
                    <button
                      onClick={async () => {
                        if (confirm("Are you sure you want to delete this adoption record?")) {
                          await deleteTechAdoption(item.id);
                          startTransition(async () => {
                            const refreshed = await getTechAdoptions({ page, search, state: filterState, category: filterCategory });
                            setData(refreshed.data);
                            setPagination(refreshed.pagination);
                          });
                        }
                      }}
                      className="text-red-600 hover:text-red-800 text-xs font-semibold"
                    >
                      Delete
                    </button>
                  )}
                </div>
              </div>
              
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div className="space-y-1">
                  <h3 className="text-lg font-bold text-slate-900">{item.technologyName}</h3>
                </div>
                <div className="flex gap-4">
                  <div className="bg-emerald-50 border border-emerald-100 px-3 py-1 rounded-lg text-right">
                    <span className="text-[10px] font-bold text-emerald-700 block uppercase">Adoption Rate</span>
                    <span className="text-sm font-bold text-emerald-900">{item.adoptionRate}%</span>
                  </div>
                  <div className="bg-slate-50 border border-slate-100 px-3 py-1 rounded-lg text-right">
                    <span className="text-[10px] font-bold text-slate-500 block uppercase">Farmers Reached</span>
                    <span className="text-sm font-bold text-slate-800">{item.beneficiariesCount.toLocaleString()}</span>
                  </div>
                </div>
              </div>

              {item.imageUrl && (
                <div className="my-2">
                  <img 
                    src={item.imageUrl} 
                    alt={item.technologyName} 
                    className="w-full max-h-64 object-cover rounded-lg border"
                  />
                </div>
              )}

              <p className="text-sm text-slate-600 leading-relaxed bg-slate-50 p-3 rounded-lg border">
                <span className="font-semibold text-slate-700">Field Feedback: </span>
                {item.notes}
              </p>
            </div>
          ))
        )}
      </div>

      {/* Pagination Controls Bar */}
      <div className="flex flex-col sm:flex-row justify-between items-center bg-white px-4 py-3 border rounded-xl shadow-sm gap-4">
        <div className="text-xs text-slate-600">
          Showing <span className="font-semibold text-slate-900">{pagination.startItem || 0}</span> to{" "}
          <span className="font-semibold text-slate-900">{pagination.endItem || 0}</span> of{" "}
          <span className="font-semibold text-slate-900">{pagination.totalCount || 0}</span> entries
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
            disabled={page <= 1 || isPending}
            className="px-3 py-1.5 border rounded-lg text-xs font-medium text-slate-700 bg-white hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition"
          >
            Previous
          </button>

          <span className="text-xs font-medium text-slate-700 px-2">
            Page {pagination.currentPage || page} of {pagination.totalPages || 1}
          </span>

          <button
            onClick={() => setPage((prev) => Math.min(prev + 1, pagination.totalPages || 1))}
            disabled={page >= (pagination.totalPages || 1) || isPending}
            className="px-3 py-1.5 border rounded-lg text-xs font-medium text-slate-700 bg-white hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
}