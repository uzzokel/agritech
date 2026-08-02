// app/dashboard/predict-impact/DashboardPredictImpactView.tsx
"use client";

import React from "react";

export default function DashboardPredictImpactView({ user }: { user: any }) {
  const rawStreamlitUrl = process.env.NEXT_PUBLIC_STREAMLIT_URL || "https://boston-house-price-prediction-a6dky3hrmjrpkt69mkn6os.streamlit.app/";
  
  // Ensure we format the URL correctly with the embed parameter to prevent redirect loops
  const streamlitAppUrl = rawStreamlitUrl.includes("?") 
    ? `${rawStreamlitUrl}&embed=true` 
    : `${rawStreamlitUrl}/?embed=true`;

  return (
    <div className="flex flex-col min-h-screen w-full bg-slate-950 text-slate-100 font-sans pt-20">
      <header className="sticky top-0 z-20 h-16 shrink-0 border-b border-slate-800/80 bg-slate-900/90 backdrop-blur-md px-6 flex items-center justify-between">
        <h1 className="font-bold text-white text-lg tracking-tight">Predict Impact Model</h1>
        <span className="text-xs font-semibold px-3 py-1 rounded-full bg-emerald-950/80 border border-emerald-700/40 text-emerald-400">
          Admin Access Only 🛡️
        </span>
      </header>

      <main className="flex-1 p-4 md:p-6 bg-slate-900/20 flex flex-col">
        <div className="w-full flex-1 bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl min-h-[75vh]">
          <iframe
            src={streamlitAppUrl}
            title="Streamlit Predict Impact App"
            className="w-full h-full border-0 min-h-[75vh]"
          />
        </div>
      </main>
    </div>
  );
}