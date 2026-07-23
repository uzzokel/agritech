"use client";

import React, { useState } from "react";
import FarmerRegistrationForm from "./FarmerRegistrationForm";

export default function DashboardPage() {
  const [activeTab, setActiveTab] = useState<"overview" | "register" | "farmers" | null>("register");

  // Toggle function: If the tab is already active, close it (set to null), otherwise open it
  const handleTabClick = (tab: "overview" | "register" | "farmers") => {
    setActiveTab((prev) => (prev === tab ? null : tab));
  };

  return (
    /* pt-20 provides ample top clearance under fixed/sticky navbars */
    <div className="min-h-screen pt-20 flex flex-col bg-slate-950 text-slate-100">
      
      {/* MOBILE NAVIGATION TABS */}
      <div className="md:hidden flex items-center justify-around border-b border-slate-800 bg-slate-950 p-2 text-xs font-medium shrink-0">
        <button
          onClick={() => handleTabClick("overview")}
          className={`px-3 py-1.5 rounded-lg transition-colors ${
            activeTab === "overview" ? "bg-emerald-500/10 text-emerald-400 font-semibold" : "text-slate-400"
          }`}
        >
          📊 Overview
        </button>
        <button
          onClick={() => handleTabClick("register")}
          className={`px-3 py-1.5 rounded-lg transition-colors ${
            activeTab === "register" ? "bg-emerald-500/10 text-emerald-400 font-semibold" : "text-slate-400"
          }`}
        >
          📝 Register
        </button>
        <button
          onClick={() => handleTabClick("farmers")}
          className={`px-3 py-1.5 rounded-lg transition-colors ${
            activeTab === "farmers" ? "bg-emerald-500/10 text-emerald-400 font-semibold" : "text-slate-400"
          }`}
        >
          👨‍🌾 Farmers
        </button>
      </div>

      {/* MAIN LAYOUT */}
      <div className="flex flex-1 overflow-hidden">
        
        {/* DESKTOP SIDEBAR */}
        <aside className="hidden md:flex w-64 flex-col border-r border-slate-800 bg-slate-950 p-4 shrink-0 overflow-y-auto">
          <div className="space-y-1.5">
            <p className="px-3 text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">
              Menu
            </p>
            
            <button
              onClick={() => handleTabClick("overview")}
              className={`w-full flex items-center justify-between rounded-lg px-3 py-2 text-sm font-medium transition-all ${
                activeTab === "overview" 
                  ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" 
                  : "text-slate-400 hover:bg-slate-900 hover:text-slate-200"
              }`}
            >
              <span className="flex items-center gap-3">📊 Overview</span>
              {activeTab === "overview" && <span className="text-xs text-emerald-500">✕</span>}
            </button>

            <button
              onClick={() => handleTabClick("register")}
              className={`w-full flex items-center justify-between rounded-lg px-3 py-2 text-sm font-medium transition-all ${
                activeTab === "register" 
                  ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" 
                  : "text-slate-400 hover:bg-slate-900 hover:text-slate-200"
              }`}
            >
              <span className="flex items-center gap-3">📝 Register Farmer</span>
              {activeTab === "register" && <span className="text-xs text-emerald-500">✕</span>}
            </button>

            <button
              onClick={() => handleTabClick("farmers")}
              className={`w-full flex items-center justify-between rounded-lg px-3 py-2 text-sm font-medium transition-all ${
                activeTab === "farmers" 
                  ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" 
                  : "text-slate-400 hover:bg-slate-900 hover:text-slate-200"
              }`}
            >
              <span className="flex items-center gap-3">👨‍🌾 Farmers List</span>
              {activeTab === "farmers" && <span className="text-xs text-emerald-500">✕</span>}
            </button>
          </div>
        </aside>

        {/* MAIN WORK PANE */}
        <main className="flex-1 overflow-y-auto bg-slate-900/50 p-4 sm:p-6 lg:p-8">
          
          {/* TAB: REGISTER FARMER */}
          {activeTab === "register" && (
            <div className="w-full max-w-4xl mx-auto transition-all duration-300 ease-in-out animate-in fade-in slide-in-from-left-4">
              <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-4 sm:p-6 lg:p-8 shadow-xl backdrop-blur-sm">
                <FarmerRegistrationForm />
              </div>
            </div>
          )}

          {/* TAB: OVERVIEW */}
          {activeTab === "overview" && (
            <div className="w-full max-w-5xl mx-auto text-white transition-all duration-300 ease-in-out animate-in fade-in slide-in-from-left-4">
              <h2 className="text-2xl font-bold mb-2">Dashboard Overview</h2>
              <p className="text-slate-400 text-sm">Welcome back to AgriTech administrative panel.</p>
            </div>
          )}

          {/* TAB: FARMERS LIST */}
          {activeTab === "farmers" && (
            <div className="w-full max-w-5xl mx-auto text-white transition-all duration-300 ease-in-out animate-in fade-in slide-in-from-left-4">
              <h2 className="text-2xl font-bold mb-2">Registered Farmers</h2>
              <p className="text-slate-400 text-sm">List of registered farmers in the database.</p>
            </div>
          )}

          {/* PLAIN PANE (When toggled closed / no item selected) */}
          {activeTab === null && (
            <div className="flex h-full min-h-[450px] flex-col items-center justify-center rounded-2xl border border-dashed border-slate-800/80 p-8 text-center bg-slate-950/30 transition-all duration-300">
              <div className="h-12 w-12 rounded-full bg-slate-800/50 flex items-center justify-center text-slate-500 mb-4 text-xl">
                📂
              </div>
              <h3 className="text-lg font-semibold text-slate-300">Workspace Clear</h3>
              <p className="mt-1 text-sm text-slate-500 max-w-sm">
                Click any section on the sidebar menu to bring up its form or details.
              </p>
            </div>
          )}

        </main>
      </div>
    </div>
  );
}