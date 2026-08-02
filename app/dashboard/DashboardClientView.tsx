// app/dashboard/DashboardClientView.tsx
"use client";

import React, { useState, useEffect, useTransition } from "react";
import FarmerRegistrationForm from "./FarmerRegistrationForm";
import { getFarmerRecords } from "./actions";
import { isAdminUser } from "@/lib/admin"; 
import AdminAnalytics from "@/app/admin/components/AdminAnalytics"; 
import ExportCSVButton from "@/app/admin/components/ExportCSVButton"; 

export default function DashboardClientView({ user }: { user: any }) {
  const [activeTab, setActiveTab] = useState<"overview" | "register" | "farmers" | "analytics">("overview");
  const [filterMode, setFilterMode] = useState<"all" | "my">("all");
  const [searchQuery, setSearchQuery] = useState("");
  
  // Advanced Filter & Search States for Analytics / Aggregates
  const [analyticsSearch, setAnalyticsSearch] = useState("");
  const [enterpriseFilter, setEnterpriseFilter] = useState("all");
  const [stateFilter, setStateFilter] = useState("all");

  const [farmers, setFarmers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isPending, startTransition] = useTransition();

  const adminAuthorized = isAdminUser(user);

  const loadFarmers = async () => {
    setIsLoading(true);
    try {
      const res = await getFarmerRecords();
      if (res?.success && res?.data) {
        setFarmers(res.data);
      }
    } catch (error) {
      console.error("Failed to load farmer records:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadFarmers();
  }, []);

  // Filter farmers for Directory View
  const filteredFarmers = farmers.filter((farmer) => {
    const matchesFilter =
      filterMode === "all" ||
      (filterMode === "my" && farmer.createdBy?.id === user?.id);

    const q = searchQuery.toLowerCase();
    const matchesSearch =
      (farmer.fullName || "").toLowerCase().includes(q) ||
      (farmer.phoneNumber || "").includes(searchQuery) ||
      (farmer.state || "").toLowerCase().includes(q) ||
      (farmer.lga || "").toLowerCase().includes(q) ||
      (farmer.nameOfChosenEnterprise || "").toLowerCase().includes(q) ||
      (farmer.createdBy?.fullName || "").toLowerCase().includes(q);

    return matchesFilter && matchesSearch;
  });

  const myCount = farmers.filter((f) => f.createdBy?.id === user?.id).length;

  // --- FILTERED FARMERS FOR ANALYTICS AGGREGATES & AVERAGES ---
  const analyticsFilteredFarmers = farmers.filter((farmer) => {
    const q = analyticsSearch.toLowerCase();
    const matchesSearch =
      (farmer.fullName || "").toLowerCase().includes(q) ||
      (farmer.phoneNumber || "").includes(analyticsSearch) ||
      (farmer.state || "").toLowerCase().includes(q) ||
      (farmer.lga || "").toLowerCase().includes(q) ||
      (farmer.nameOfChosenEnterprise || "").toLowerCase().includes(q);

    const matchesEnterprise =
      enterpriseFilter === "all" || farmer.nameOfChosenEnterprise === enterpriseFilter;

    const matchesState =
      stateFilter === "all" || farmer.state === stateFilter;

    return matchesSearch && matchesEnterprise && matchesState;
  });

  // Extract unique lists for filters
  const uniqueEnterprises = Array.from(new Set(farmers.map((f) => f.nameOfChosenEnterprise).filter(Boolean)));
  const uniqueStates = Array.from(new Set(farmers.map((f) => f.state).filter(Boolean)));

  // Calculate Aggregates & Averages for Relevant Columns
  const totalAnalyticsCount = analyticsFilteredFarmers.length;
  
  const totalIncome = analyticsFilteredFarmers.reduce((sum, f) => sum + (Number(f.estimatedAnnualIncome) || 0), 0);
  const avgIncome = totalAnalyticsCount > 0 ? totalIncome / totalAnalyticsCount : 0;

  const totalAcreage = analyticsFilteredFarmers.reduce((sum, f) => sum + (Number(f.farmSize) || Number(f.acreage) || 0), 0);
  const avgAcreage = totalAnalyticsCount > 0 ? totalAcreage / totalAnalyticsCount : 0;

  const totalAge = analyticsFilteredFarmers.reduce((sum, f) => sum + (Number(f.age) || 0), 0);
  const validAgeCount = analyticsFilteredFarmers.filter(f => Number(f.age) > 0).length;
  const avgAge = validAgeCount > 0 ? totalAge / validAgeCount : 0;

  const totalHouseholdSize = analyticsFilteredFarmers.reduce((sum, f) => sum + (Number(f.householdSize) || 0), 0);
  const validHhCount = analyticsFilteredFarmers.filter(f => Number(f.householdSize) > 0).length;
  const avgHouseholdSize = validHhCount > 0 ? totalHouseholdSize / validHhCount : 0;

  return (
    <div className="flex flex-col min-h-screen w-full bg-slate-950 text-slate-100 font-sans pt-30">
      
      {/* Top Navigation Bar */}
      <header className="sticky top-0 z-20 h-16 shrink-0 border-b border-slate-800/80 bg-slate-900/90 backdrop-blur-md px-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 font-bold text-lg">
            🌱
          </div>
          <h1 className="font-bold text-white text-lg tracking-tight">
            {user?.fullName || "AgriTech Portal"}
          </h1>
        </div>

        <div className="flex items-center gap-3">
          {user?.state && (
            <span className="text-xs font-semibold px-3 py-1 rounded-full bg-emerald-950/80 border border-emerald-700/40 text-emerald-400">
              {user.state} {user?.lga ? `• ${user.lga}` : ""}
            </span>
          )}
        </div>
      </header>

      {/* Main Container: Sidebar + Active Tab Content */}
      <div className="flex flex-1 w-full relative">
        
        {/* SIDEBAR */}
        <aside className="w-64 shrink-0 border-r border-slate-800/80 bg-slate-950/90 p-4 sticky top-16 h-[calc(100vh-4rem)] overflow-y-auto flex flex-col justify-between">
          <nav className="space-y-1.5">
            <p className="px-3 text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-2">
              Menu
            </p>

            {/* Overview Tab */}
            <button
              type="button"
              onClick={() => setActiveTab("overview")}
              className={`w-full text-left px-3.5 py-2.5 rounded-xl font-medium text-sm transition-all flex items-center gap-3 ${
                activeTab === "overview"
                  ? "bg-emerald-600/20 text-emerald-400 border border-emerald-500/30 shadow-sm"
                  : "text-slate-400 hover:bg-slate-900 hover:text-slate-200"
              }`}
            >
              <span className="text-base">📊</span>
              <span>Overview</span>
            </button>

            {/* Farmers List Tab */}
            <button
              type="button"
              onClick={() => setActiveTab("farmers")}
              className={`w-full text-left px-3.5 py-2.5 rounded-xl font-medium text-sm transition-all flex items-center justify-between ${
                activeTab === "farmers"
                  ? "bg-emerald-600/20 text-emerald-400 border border-emerald-500/30 shadow-sm"
                  : "text-slate-400 hover:bg-slate-900 hover:text-slate-200"
              }`}
            >
              <div className="flex items-center gap-3">
                <span className="text-base">👨‍🌾</span>
                <span>Farmers Directory</span>
              </div>
              <span className="text-xs bg-slate-800 text-slate-300 px-2 py-0.5 rounded-full font-semibold">
                {farmers.length}
              </span>
            </button>

            {/* Admin Analytics & Export Tab */}
            {adminAuthorized && (
              <button
                type="button"
                onClick={() => setActiveTab("analytics")}
                className={`w-full text-left px-3.5 py-2.5 rounded-xl font-medium text-sm transition-all flex items-center gap-3 ${
                  activeTab === "analytics"
                    ? "bg-emerald-600/20 text-emerald-400 border border-emerald-500/30 shadow-sm"
                    : "text-slate-400 hover:bg-slate-900 hover:text-slate-200"
                }`}
              >
                <span className="text-base">📈</span>
                <span>Analytics & Export</span>
              </button>
            )}

            <hr className="border-slate-800/80 my-3" />

            <p className="px-3 text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-2">
              Actions
            </p>

            {/* Sidebar Button to trigger Farmer Registration Form */}
            <button
              type="button"
              onClick={() => setActiveTab("register")}
              className={`w-full text-left px-3.5 py-2.5 rounded-xl font-semibold text-sm transition-all flex items-center gap-3 ${
                activeTab === "register"
                  ? "bg-emerald-600 text-white shadow-lg shadow-emerald-950/50"
                  : "bg-emerald-600/10 text-emerald-400 hover:bg-emerald-600/20 border border-emerald-500/20"
              }`}
            >
              <span className="text-base">📝</span>
              <span>Register Farmer</span>
            </button>
          </nav>

          {/* User Profile Badge at bottom of Sidebar */}
          <div className="pt-4 border-t border-slate-800/80">
            <div className="flex items-center gap-3 px-2">
              <div className="h-8 w-8 rounded-full bg-slate-800 flex items-center justify-center text-xs font-bold text-slate-300 border border-slate-700">
                {user?.fullName ? user.fullName[0].toUpperCase() : "U"}
              </div>
              <div className="flex flex-col min-w-0">
                <span className="text-xs font-semibold text-slate-200 truncate">
                  {user?.fullName || "Agent"}
                </span>
                <span className="text-[10px] text-slate-400 truncate">
                  ID: {user?.uniqueAdminId || "Agent"}
                </span>
              </div>
            </div>
          </div>
        </aside>

        {/* MAIN WORKSPACE CONTENT */}
        <main className="flex-1 p-6 md:p-8 bg-slate-900/20 min-w-0 overflow-y-auto">
          
          {/* TAB 1: OVERVIEW DASHBOARD */}
          {activeTab === "overview" && (
            <div className="max-w-6xl mx-auto space-y-6">
              
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 bg-gradient-to-r from-slate-900 via-slate-900 to-emerald-950/40 border border-slate-800/80 rounded-2xl shadow-lg">
                <div>
                  <h2 className="text-2xl font-bold text-white tracking-tight">
                    Welcome back, {user?.fullName?.split(" ")[0] || "Coordinator"} 👋
                  </h2>
                  <p className="text-sm text-slate-400 mt-1">
                    Here is a quick overview of agricultural registrations in {user?.state || "your region"}.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveTab("register")}
                  className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-semibold rounded-xl shadow-md transition-all flex items-center justify-center gap-2 shrink-0"
                >
                  <span>➕</span>
                  <span>New Farmer Entry</span>
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="p-5 bg-slate-900/90 border border-slate-800/80 rounded-2xl">
                  <div className="flex items-center justify-between text-slate-400 text-xs font-semibold uppercase tracking-wider mb-2">
                    <span>Total Registered Farmers</span>
                    <span className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400">👨‍🌾</span>
                  </div>
                  <div className="text-2xl font-bold text-white">{isLoading ? "..." : farmers.length}</div>
                  <p className="text-xs text-slate-500 mt-1">Total entries across system</p>
                </div>

                <div className="p-5 bg-slate-900/90 border border-slate-800/80 rounded-2xl">
                  <div className="flex items-center justify-between text-slate-400 text-xs font-semibold uppercase tracking-wider mb-2">
                    <span>My Registered Farmers</span>
                    <span className="p-1.5 rounded-lg bg-teal-500/10 text-teal-400">📝</span>
                  </div>
                  <div className="text-2xl font-bold text-white">{isLoading ? "..." : myCount}</div>
                  <p className="text-xs text-slate-500 mt-1">Registered under your ID</p>
                </div>

                <div className="p-5 bg-slate-900/90 border border-slate-800/80 rounded-2xl">
                  <div className="flex items-center justify-between text-slate-400 text-xs font-semibold uppercase tracking-wider mb-2">
                    <span>Assigned Area</span>
                    <span className="p-1.5 rounded-lg bg-blue-500/10 text-blue-400">🏛️</span>
                  </div>
                  <div className="text-base font-bold text-white truncate">
                    {user?.state || "N/A"}
                  </div>
                  <p className="text-xs text-slate-500 mt-1">{user?.lga || "All LGAs"}</p>
                </div>
              </div>

              {/* Quick Action Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="p-6 bg-slate-900/90 border border-slate-800/80 rounded-2xl space-y-3">
                  <h3 className="font-bold text-white text-base">Register Farmer</h3>
                  <p className="text-sm text-slate-400">
                    Add a new farmer record including contact info, enterprise type, and household demographics.
                  </p>
                  <button
                    type="button"
                    onClick={() => setActiveTab("register")}
                    className="inline-flex items-center gap-2 text-sm font-semibold text-emerald-400 hover:text-emerald-300 transition"
                  >
                    <span>Open Registration Form</span>
                    <span>→</span>
                  </button>
                </div>

                <div className="p-6 bg-slate-900/90 border border-slate-800/80 rounded-2xl space-y-3">
                  <h3 className="font-bold text-white text-base">View Farmers Directory</h3>
                  <p className="text-sm text-slate-400">
                    Browse, filter, and inspect previously registered farmers and their assigned agents.
                  </p>
                  <button
                    type="button"
                    onClick={() => setActiveTab("farmers")}
                    className="inline-flex items-center gap-2 text-sm font-semibold text-emerald-400 hover:text-emerald-300 transition"
                  >
                    <span>Go to Directory</span>
                    <span>→</span>
                  </button>
                </div>
              </div>

            </div>
          )}

          {/* TAB 2: FARMER REGISTRATION FORM */}
          {activeTab === "register" && (
            <div className="max-w-3xl mx-auto bg-slate-900 border border-slate-800/80 rounded-2xl p-6 md:p-8 shadow-2xl">
              <div className="flex items-center justify-between border-b border-slate-800/80 pb-4 mb-6">
                <div>
                  <h2 className="text-xl font-bold text-white">Register New Farmer</h2>
                  <p className="text-xs text-slate-400 mt-0.5">Fill in the required information below.</p>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveTab("overview")}
                  className="text-xs text-slate-400 hover:text-slate-200 px-3 py-1.5 rounded-lg bg-slate-800 border border-slate-700"
                >
                  ✕ Close Form
                </button>
              </div>

              <FarmerRegistrationForm
                user={user}
                onSuccess={() => {
                  loadFarmers(); 
                  setActiveTab("farmers");
                }}
              />
            </div>
          )}

          {/* TAB 3: FARMERS DIRECTORY LIST */}
          {activeTab === "farmers" && (
            <div className="max-w-6xl mx-auto space-y-6">
              
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900 border border-slate-800/80 rounded-2xl p-6 shadow-xl">
                <div>
                  <h2 className="text-xl font-bold text-white">Farmers Directory</h2>
                  <p className="text-xs text-slate-400 mt-1">
                    Showing {filteredFarmers.length} of {farmers.length} registered farmers
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-800">
                    <button
                      type="button"
                      onClick={() => setFilterMode("all")}
                      className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition ${
                        filterMode === "all"
                          ? "bg-emerald-600 text-white shadow-sm"
                          : "text-slate-400 hover:text-slate-200"
                      }`}
                    >
                      All Farmers ({farmers.length})
                    </button>
                    <button
                      type="button"
                      onClick={() => setFilterMode("my")}
                      className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition ${
                        filterMode === "my"
                          ? "bg-emerald-600 text-white shadow-sm"
                          : "text-slate-400 hover:text-slate-200"
                      }`}
                    >
                      My Entries ({myCount})
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={() => setActiveTab("register")}
                    className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold transition flex items-center gap-1.5"
                  >
                    <span>➕</span> Add Farmer
                  </button>
                </div>
              </div>

              {/* Search input */}
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search by farmer name, phone, LGA, enterprise, or registering agent..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full px-4 py-3 pl-10 rounded-xl bg-slate-900 border border-slate-800 text-slate-100 text-sm focus:outline-none focus:border-emerald-500/50 transition"
                />
                <span className="absolute left-3.5 top-3 text-slate-500 text-sm">🔍</span>
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery("")}
                    className="absolute right-3.5 top-3 text-slate-500 hover:text-slate-300 text-xs"
                  >
                    Clear
                  </button>
                )}
              </div>

              {/* Farmers Table */}
              <div className="bg-slate-900 border border-slate-800/80 rounded-2xl overflow-hidden shadow-xl">
                {isLoading ? (
                  <div className="p-12 text-center text-slate-400 text-sm">
                    <div className="inline-block h-6 w-6 animate-spin rounded-full border-2 border-emerald-500 border-t-transparent mb-3" />
                    <p>Fetching farmer records...</p>
                  </div>
                ) : filteredFarmers.length === 0 ? (
                  <div className="p-12 text-center text-slate-400 space-y-3">
                    <p className="text-3xl">🌾</p>
                    <p className="text-base font-semibold text-slate-200">No farmers found</p>
                    <p className="text-xs text-slate-500">
                      {searchQuery
                        ? "Try adjusting your search criteria."
                        : filterMode === "my"
                        ? "You haven't registered any farmers yet."
                        : "No farmer entries exist in the database."}
                    </p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm text-slate-300">
                      <thead className="bg-slate-950/60 border-b border-slate-800 text-xs font-semibold uppercase tracking-wider text-slate-400">
                        <tr>
                          <th className="px-5 py-3.5">Farmer</th>
                          <th className="px-5 py-3.5">Location</th>
                          <th className="px-5 py-3.5">Enterprise</th>
                          <th className="px-5 py-3.5">Est. Income</th>
                          <th className="px-5 py-3.5">Registered By (Agent)</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/60">
                        {filteredFarmers.map((farmer) => (
                          <tr key={farmer.id || Math.random()} className="hover:bg-slate-800/40 transition">
                            <td className="px-5 py-4">
                              <div className="flex items-center gap-3">
                                {farmer.photoUrl ? (
                                  <img
                                    src={farmer.photoUrl}
                                    alt={farmer.fullName || "Farmer"}
                                    className="h-10 w-10 rounded-full object-cover border border-slate-700 shrink-0"
                                  />
                                ) : (
                                  <div className="h-10 w-10 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center font-bold text-slate-400 shrink-0">
                                    {farmer.fullName?.[0]?.toUpperCase() || "F"}
                                  </div>
                                )}
                                <div>
                                  <p className="font-semibold text-slate-100">{farmer.fullName || "N/A"}</p>
                                  <p className="text-xs text-slate-400">
                                    {farmer.phoneNumber || "No Phone"} • {farmer.gender || "N/A"}, {farmer.age ? `${farmer.age} yrs` : "N/A"}
                                  </p>
                                </div>
                              </div>
                            </td>
                            <td className="px-5 py-4">
                              <p className="text-slate-200">{farmer.lga || "N/A"}</p>
                              <p className="text-xs text-slate-400">{farmer.state || "N/A"} {farmer.cluster ? `(${farmer.cluster})` : ""}</p>
                            </td>
                            <td className="px-5 py-4">
                              <span className="inline-block px-2.5 py-1 rounded-lg bg-emerald-950/80 border border-emerald-800/50 text-emerald-300 text-xs font-medium">
                                {farmer.nameOfChosenEnterprise || "N/A"}
                              </span>
                              <p className="text-xs text-slate-400 mt-0.5">{farmer.typeOfEnterprise || "N/A"}</p>
                            </td>
                            <td className="px-5 py-4 font-mono text-slate-200 text-xs">
                              ₦{farmer.estimatedAnnualIncome ? farmer.estimatedAnnualIncome.toLocaleString() : "0"}
                            </td>
                            <td className="px-5 py-4">
                              {farmer.createdBy ? (
                                <div className="space-y-0.5">
                                  <p className="font-medium text-slate-200 text-xs">
                                    {farmer.createdBy.fullName || "Agent"}
                                    {farmer.createdBy.id === user?.id && (
                                      <span className="ml-1.5 px-1.5 py-0.5 rounded text-[10px] bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                                        You
                                      </span>
                                    )}
                                  </p>
                                  <p className="text-[11px] text-slate-400 font-mono">
                                    ID: {farmer.createdBy.uniqueAdminId || "N/A"}
                                  </p>
                                </div>
                              ) : (
                                <span className="text-xs text-slate-500 italic">Unassigned / System</span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 4: ADMIN ANALYTICS & EXPORT */}
          {activeTab === "analytics" && adminAuthorized && (
            <div className="max-w-6xl mx-auto space-y-6">
              
              {/* Header & Export Action */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900 border border-slate-800/80 rounded-2xl p-6 shadow-xl">
                <div>
                  <h2 className="text-xl font-bold text-white">System Analytics & Data Export</h2>
                  <p className="text-xs text-slate-400 mt-1">
                    Filter metrics, review data aggregates/averages, and export master CSV sheets.
                  </p>
                </div>
                <div>
                  {farmers.length > 0 && (
                    <ExportCSVButton data={analyticsFilteredFarmers} filename="agritech_filtered_export.csv" />
                  )}
                </div>
              </div>

              {/* Advanced Filters & Search Bar for Analytics */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-slate-900/60 p-4 border border-slate-800/80 rounded-2xl">
                {/* Search query */}
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Search analytics data..."
                    value={analyticsSearch}
                    onChange={(e) => setAnalyticsSearch(e.target.value)}
                    className="w-full px-3 py-2 pl-9 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 text-xs focus:outline-none focus:border-emerald-500/50"
                  />
                  <span className="absolute left-3 top-2.5 text-slate-500 text-xs">🔍</span>
                </div>

                {/* Enterprise Filter */}
                <div>
                  <select
                    value={enterpriseFilter}
                    onChange={(e) => setEnterpriseFilter(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 text-xs focus:outline-none focus:border-emerald-500/50"
                  >
                    <option value="all">All Enterprises</option>
                    {uniqueEnterprises.map((ent: any) => (
                      <option key={ent} value={ent}>{ent}</option>
                    ))}
                  </select>
                </div>

                {/* State Filter */}
                <div>
                  <select
                    value={stateFilter}
                    onChange={(e) => setStateFilter(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 text-xs focus:outline-none focus:border-emerald-500/50"
                  >
                    <option value="all">All States</option>
                    {uniqueStates.map((st: any) => (
                      <option key={st} value={st}>{st}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Aggregates & Averages Overview Cards */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl">
                  <p className="text-[11px] text-slate-400 uppercase font-semibold">Filtered Count</p>
                  <p className="text-xl font-bold text-white mt-1">{totalAnalyticsCount}</p>
                  <p className="text-[10px] text-slate-500">Farmers matching criteria</p>
                </div>

                <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl">
                  <p className="text-[11px] text-slate-400 uppercase font-semibold">Avg. Annual Income</p>
                  <p className="text-xl font-bold text-emerald-400 mt-1 font-mono">₦{Math.round(avgIncome).toLocaleString()}</p>
                  <p className="text-[10px] text-slate-500">Total: ₦{totalIncome.toLocaleString()}</p>
                </div>

                <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl">
                  <p className="text-[11px] text-slate-400 uppercase font-semibold">Avg. Farm Acreage</p>
                  <p className="text-xl font-bold text-blue-400 mt-1">{avgAcreage.toFixed(1)} ha</p>
                  <p className="text-[10px] text-slate-500">Total land: {totalAcreage.toFixed(1)}</p>
                </div>

                <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl">
                  <p className="text-[11px] text-slate-400 uppercase font-semibold">Avg. Farmer Age</p>
                  <p className="text-xl font-bold text-amber-400 mt-1">{avgAge.toFixed(1)} yrs</p>
                  <p className="text-[10px] text-slate-500">Avg. Household: {avgHouseholdSize.toFixed(1)}</p>
                </div>
              </div>

              {/* Admin Analytics Visual Component */}
              {farmers.length > 0 && (
                <AdminAnalytics farmers={analyticsFilteredFarmers} />
              )}
            </div>
          )}

        </main>

      </div>
    </div>
  );
}