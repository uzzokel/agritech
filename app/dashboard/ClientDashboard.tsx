"use client";

import React, { useState } from "react";
import FarmerRegistrationForm from "./FarmerRegistrationForm";

interface UserProps {
  id: string;
  fullName: string;
  status: string;
  uniqueAdminId: string | null;
  lga: string;
  state: string;
}

export default function ClientDashboard({ user }: { user: UserProps }) {
  const [activeTab, setActiveTab] = useState<"overview" | "register" | "farmers" | null>("register");

  return (
    <div className="min-h-screen pt-20 flex flex-col bg-slate-950 text-slate-100">
      
      {/* USER PROFILE HEADER BANNER */}
      <div className="bg-slate-900 border-b border-slate-800 px-4 sm:px-6 py-4">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold text-white flex items-center gap-2">
              <span>{user.fullName}</span>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 font-medium">
                {user.status}
              </span>
            </h1>
            <p className="text-xs text-slate-400 mt-0.5">
              {user.lga} Local Government Area • {user.state} State
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="bg-slate-950 px-3 py-1.5 rounded-lg border border-slate-800 flex items-center gap-2">
              <span className="text-xs text-slate-400">AGRI-ID:</span>
              <code className="text-xs font-mono font-bold text-emerald-400">
                {user.uniqueAdminId || "Pending"}
              </code>
            </div>
          </div>
        </div>
      </div>

      {/* MOBILE NAVIGATION TABS */}
      <div className="md:hidden flex items-center justify-around border-b border-slate-800 bg-slate-950 p-2 text-xs font-medium shrink-0">
        <button
          onClick={() => setActiveTab("overview")}
          className={`px-3 py-1.5 rounded-lg transition-colors ${
            activeTab === "overview" ? "bg-emerald-500/10 text-emerald-400 font-semibold" : "text-slate-400"
          }`}
        >
          📊 Overview
        </button>
        <button
          onClick={() => setActiveTab("register")}
          className={`px-3 py-1.5 rounded-lg transition-colors ${
            activeTab === "register" ? "bg-emerald-500/10 text-emerald-400 font-semibold" : "text-slate-400"
          }`}
        >
          📝 Register
        </button>
        <button
          onClick={() => setActiveTab("farmers")}
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
              {user.state} Region Portal
            </p>
            
            <button
              onClick={() => setActiveTab("overview")}
              className={`w-full flex items-center justify-between rounded-lg px-3 py-2 text-sm font-medium transition-all ${
                activeTab === "overview" 
                  ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" 
                  : "text-slate-400 hover:bg-slate-900 hover:text-slate-200"
              }`}
            >
              <span className="flex items-center gap-3">📊 Overview</span>
            </button>

            <button
              onClick={() => setActiveTab("register")}
              className={`w-full flex items-center justify-between rounded-lg px-3 py-2 text-sm font-medium transition-all ${
                activeTab === "register" 
                  ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" 
                  : "text-slate-400 hover:bg-slate-900 hover:text-slate-200"
              }`}
            >
              <span className="flex items-center gap-3">📝 Register Farmer</span>
            </button>

            <button
              onClick={() => setActiveTab("farmers")}
              className={`w-full flex items-center justify-between rounded-lg px-3 py-2 text-sm font-medium transition-all ${
                activeTab === "farmers" 
                  ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" 
                  : "text-slate-400 hover:bg-slate-900 hover:text-slate-200"
              }`}
            >
              <span className="flex items-center gap-3">👨‍🌾 Farmers List</span>
            </button>
          </div>
        </aside>

        {/* MAIN WORK PANE */}
        <main className="flex-1 overflow-y-auto bg-slate-900/50 p-4 sm:p-6 lg:p-8">
          
          {/* TAB: REGISTER FARMER */}
          {activeTab === "register" && (
            <div className="w-full max-w-4xl mx-auto transition-all duration-300 ease-in-out">
              <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-4 sm:p-6 lg:p-8 shadow-xl backdrop-blur-sm">
                <FarmerRegistrationForm />
              </div>
            </div>
          )}

          {/* TAB: OVERVIEW */}
          {activeTab === "overview" && (
            <div className="w-full max-w-5xl mx-auto text-white space-y-6 transition-all duration-300 ease-in-out">
              <div>
                <h2 className="text-2xl font-bold">Dashboard Overview</h2>
                <p className="text-slate-400 text-sm">
                  Jurisdiction summary for <span className="text-emerald-400 font-medium">{user.lga} LGA, {user.state} State</span>.
                </p>
              </div>

              {/* STATS CARDS */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl shadow-lg">
                  <p className="text-slate-400 text-xs font-medium uppercase tracking-wider">Region</p>
                  <p className="text-xl font-bold text-white mt-1">{user.lga}</p>
                  <p className="text-xs text-slate-500 mt-0.5">{user.state} State</p>
                </div>

                <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl shadow-lg">
                  <p className="text-slate-400 text-xs font-medium uppercase tracking-wider">Account Status</p>
                  <p className="text-xl font-bold text-emerald-400 mt-1">{user.status}</p>
                  <p className="text-xs text-slate-500 mt-0.5">Authorized Regional Officer</p>
                </div>

                <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl shadow-lg">
                  <p className="text-slate-400 text-xs font-medium uppercase tracking-wider">AGRI-ID Code</p>
                  <p className="text-xl font-mono font-bold text-emerald-400 mt-1">{user.uniqueAdminId || "N/A"}</p>
                  <p className="text-xs text-slate-500 mt-0.5">Active Credentials</p>
                </div>
              </div>
            </div>
          )}

          {/* TAB: FARMERS LIST */}
          {activeTab === "farmers" && (
            <div className="w-full max-w-5xl mx-auto text-white transition-all duration-300 ease-in-out">
              <h2 className="text-2xl font-bold mb-2">Registered Farmers</h2>
              <p className="text-slate-400 text-sm">
                List of registered farmers under {user.lga} LGA, {user.state} State.
              </p>
            </div>
          )}

          {/* PLAIN PANE */}
          {activeTab === null && (
            <div className="flex h-full min-h-[450px] flex-col items-center justify-center rounded-2xl border border-dashed border-slate-800/80 p-8 text-center bg-slate-950/30">
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