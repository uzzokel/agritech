"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { verifyFarmerUniqueId } from "@/app/dashboard/actions";

export default function VerifyIdPage() {
  const [uniqueId, setUniqueId] = useState("");
  const [pin, setPin] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const router = useRouter();
  const searchParams = useSearchParams();
  const targetRedirect = searchParams.get("redirect") || "/dashboard";

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const result = await verifyFarmerUniqueId(uniqueId.trim(), pin.trim());

    if (result.success) {
      router.refresh();
      router.push(targetRedirect);
    } else {
      setError(result.error || "Verification failed");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-[#0f172a] text-slate-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-slate-900/90 backdrop-blur-md rounded-2xl border border-slate-800 shadow-2xl shadow-black/40 p-8">
        <div className="mb-6 border-b border-slate-800/80 pb-4">
          <h2 className="text-2xl font-bold text-white tracking-tight">Access Control</h2>
          <p className="text-sm text-slate-400 mt-1">
            Enter your Unique ID and 4–6 digit PIN to access protected areas.
          </p>
        </div>

        {error && (
          <div className="mb-5 p-3 bg-red-950/50 text-red-400 text-xs rounded-lg border border-red-800/60">
            {error}
          </div>
        )}

        <form onSubmit={handleVerify} className="space-y-5">
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">
              Unique ID *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. AGRI-000000"
              value={uniqueId}
              onChange={(e) => setUniqueId(e.target.value)}
              className="w-full px-3.5 py-2.5 text-sm bg-slate-950/70 text-slate-100 placeholder:text-slate-600 border border-slate-800 rounded-lg focus:ring-2 focus:ring-[#16a34a]/50 focus:border-[#16a34a] outline-none transition-all"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">
              Security PIN (4–6 Digits) *
            </label>
            <input
              type="password"
              required
              maxLength={6}
              minLength={4}
              placeholder="••••"
              value={pin}
              onChange={(e) => setPin(e.target.value.replace(/\D/g, ""))}
              className="w-full px-3.5 py-2.5 text-sm bg-slate-950/70 text-slate-100 placeholder:text-slate-600 border border-slate-800 rounded-lg focus:ring-2 focus:ring-[#16a34a]/50 focus:border-[#16a34a] outline-none tracking-widest transition-all"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 bg-[#16a34a] hover:bg-[#15803d] text-white font-medium text-sm rounded-lg shadow-lg shadow-[#16a34a]/20 disabled:opacity-50 transition-all cursor-pointer"
          >
            {loading ? "Verifying..." : "Access System"}
          </button>
        </form>
      </div>
    </div>
  );
}