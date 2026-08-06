// app/login-agri/page.tsx
"use client";

import { useActionState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { loginAgriUser } from "@/app/actions/login-agri";
import { KeyRound, ShieldCheck, Loader2 } from "lucide-react";

function LoginFormContent() {
  const searchParams = useSearchParams();
  const targetRedirect = searchParams.get("redirect") || "/dashboard";

  const [state, formAction, isPending] = useActionState(loginAgriUser, {
    success: false,
    error: null,
  });

  useEffect(() => {
    if (state?.success) {
      window.location.href = targetRedirect;
    }
  }, [state?.success, targetRedirect]);

  return (
    <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-8 shadow-2xl">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-14 h-14 bg-emerald-500/10 text-emerald-400 rounded-full mb-4 border border-emerald-500/20">
          <ShieldCheck className="w-7 h-7" />
        </div>
        <h1 className="text-2xl font-bold text-white tracking-tight">
          AgriTech Portal
        </h1>
        <p className="text-slate-400 text-sm mt-1">
          Enter your official AGRI-ID and Security PIN
        </p>
      </div>

      {/* Error Banner */}
      {state?.error && (
        <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm text-center font-medium">
          {state.error}
        </div>
      )}

      {/* Form */}
      <form action={formAction} className="space-y-5">
        <input type="hidden" name="redirectTo" value={targetRedirect} />

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
              name="securityPin"
              maxLength={10}
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
          className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-semibold py-3 px-4 rounded-xl transition duration-200 flex items-center justify-center gap-2 shadow-lg shadow-emerald-900/20 disabled:opacity-50 cursor-pointer"
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

      {/* Footer Link */}
      <div className="mt-8 text-center pt-6 border-t border-slate-800">
        <p className="text-slate-400 text-sm">
          Haven&apos;t received your AGRI-ID yet?{" "}
          <Link
            href="/register-agri"
            className="text-emerald-400 hover:text-emerald-300 font-medium underline underline-offset-4 transition"
          >
            Submit Application
          </Link>
        </p>
      </div>
    </div>
  );
}

export default function AgriLoginPage() {
  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4 py-30">
      <Suspense
        fallback={
          <div className="flex items-center gap-2 text-emerald-400">
            <Loader2 className="w-6 h-6 animate-spin" /> Loading Portal...
          </div>
        }
      >
        <LoginFormContent />
      </Suspense>
    </div>
  );
}