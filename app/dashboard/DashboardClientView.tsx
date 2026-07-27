// app/dashboard/DashboardClientView.tsx
"use client";

import React, { useState } from "react";
import FarmerRegistrationForm from "./FarmerRegistrationForm";

export default function DashboardClientView({ user }: { user: any }) {
  const [activeTab, setActiveTab] = useState<"overview" | "register" | "farmers">("overview");

  return (
    <div className="flex flex-col min-h-screen w-full bg-slate-950 text-slate-100 font-sans py-30">
      
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

        {user?.state && (
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold px-3 py-1 rounded-full bg-emerald-950/80 border border-emerald-700/40 text-emerald-400">
              {user.state} {user?.lga ? `• ${user.lga}` : ""}
            </span>
          </div>
        )}
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
              className={`w-full text-left px-3.5 py-2.5 rounded-xl font-medium text-sm transition-all flex items-center gap-3 ${
                activeTab === "farmers"
                  ? "bg-emerald-600/20 text-emerald-400 border border-emerald-500/30 shadow-sm"
                  : "text-slate-400 hover:bg-slate-900 hover:text-slate-200"
              }`}
            >
              <span className="text-base">👨‍🌾</span>
              <span>Farmers Directory</span>
            </button>

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
                  {user?.designation || "Regional Coordinator"}
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
              
              {/* Header Banner */}
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

              {/* Quick Metrics Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="p-5 bg-slate-900/90 border border-slate-800/80 rounded-2xl">
                  <div className="flex items-center justify-between text-slate-400 text-xs font-semibold uppercase tracking-wider mb-2">
                    <span>Registered Farmers</span>
                    <span className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400">👨‍🌾</span>
                  </div>
                  <div className="text-2xl font-bold text-white">--</div>
                  <p className="text-xs text-slate-500 mt-1">Total entries in database</p>
                </div>

                <div className="p-5 bg-slate-900/90 border border-slate-800/80 rounded-2xl">
                  <div className="flex items-center justify-between text-slate-400 text-xs font-semibold uppercase tracking-wider mb-2">
                    <span>Active Clusters</span>
                    <span className="p-1.5 rounded-lg bg-teal-500/10 text-teal-400">📍</span>
                  </div>
                  <div className="text-2xl font-bold text-white">--</div>
                  <p className="text-xs text-slate-500 mt-1">Coverage across LGAs</p>
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
                    Browse, filter, and inspect previously registered farmers and their assigned clusters.
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
                onSuccess={() => setActiveTab("farmers")}
              />
            </div>
          )}

          {/* TAB 3: FARMERS DIRECTORY LIST */}
          {activeTab === "farmers" && (
            <div className="max-w-5xl mx-auto bg-slate-900 border border-slate-800/80 rounded-2xl p-6 md:p-8 shadow-xl">
              <div className="flex items-center justify-between border-b border-slate-800/80 pb-4 mb-6">
                <h2 className="text-xl font-bold text-white">Farmers Directory</h2>
                <button
                  type="button"
                  onClick={() => setActiveTab("register")}
                  className="px-3.5 py-1.5 bg-emerald-600/20 border border-emerald-500/30 text-emerald-400 rounded-lg text-xs font-semibold hover:bg-emerald-600/30 transition"
                >
                  + Add Farmer
                </button>
              </div>
              <p className="text-sm text-slate-400">Farmers record list will display here.</p>
            </div>
          )}

        </main>

      </div>
    </div>
  );
}