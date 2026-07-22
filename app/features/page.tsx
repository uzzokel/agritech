import { Sparkles, ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function FeaturesPage() {
  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center p-6">
      <div className="bg-slate-900 border border-slate-800 p-8 rounded-2xl max-w-lg text-center shadow-2xl">
        <div className="inline-flex items-center justify-center w-14 h-14 bg-emerald-500/10 text-emerald-400 rounded-full mb-4 border border-emerald-500/20">
          <Sparkles className="w-7 h-7" />
        </div>
        <h1 className="text-3xl font-bold text-emerald-400 mb-2">AgriTech Features Hub</h1>
        <p className="text-slate-400 text-sm mb-6">
          Access granted! You are verified with an active AGRI session. Regional tools, extension analytics, and crop insights will live here.
        </p>

        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 text-sm text-slate-300 hover:text-emerald-400 transition"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Dashboard
        </Link>
      </div>
    </div>
  );
}