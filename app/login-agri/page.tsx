"use client";

import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { loginAgriUser } from "@/app/actions/login-agri";
import { KeyRound, ShieldCheck, Loader2 } from "lucide-react";

export default function AgriLoginPage() {
  const router = useRouter();
  const [state, formAction, isPending] = useActionState(loginAgriUser, {
    success: false,
    error: null,
  });

  useEffect(() => {
    if (state.success) {
      router.push("/dashboard");
    }
  }, [state.success, router]);

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-8 shadow-2xl">
        
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 bg-emerald-500/10 text-emerald-400 rounded-full mb-4 border border-emerald-500/20">
            <ShieldCheck className="w-7 h-7" />
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">AgriTech Portal</h1>
          <p className="text-slate-400 text-sm mt-1">
            Enter your official AGRI-ID and Security PIN
          </p>
        </div>

        {/* Error Banner */}
        {state.error && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm text-center font-medium">
            {state.error}
          </div>
        )}

        {/* Form */}
        <form action={formAction} className="space-y-5">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-2">
              Official AGRI-ID
            </label>
            <input
              type="text"
              name="uniqueAdminId"
              placeholder="e.g. AGRI-12345"
              required
              className="w-full bg-slate-800 border border-slate-700 text-emerald-400 placeholder-slate-500 rounded-xl px-4 py-3 font-mono text-lg uppercase tracking-wider focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-2">
              Security PIN / Passcode
            </label>
            <div className="relative">
              <input
                type="password"
                name="pin"
                maxLength={8}
                placeholder="Enter PIN"
                required
                className="w-full bg-slate-800 border border-slate-700 text-white placeholder-slate-500 rounded-xl px-4 py-3 font-mono tracking-widest text-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
              />
              <KeyRound className="absolute right-4 top-3.5 w-5 h-5 text-slate-500" />
            </div>
          </div>

          <button
            type="submit"
            disabled={isPending}
            className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-semibold py-3 px-4 rounded-xl transition duration-200 flex items-center justify-center gap-2 shadow-lg shadow-emerald-900/20 disabled:opacity-50"
          >
            {isPending ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" /> Verifying...
              </>
            ) : (
              "Access Member Portal"
            )}
          </button>
        </form>

      </div>
    </div>
  );
}