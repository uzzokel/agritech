// app/unauthorized/page.tsx
import Link from "next/link";
import { SignInButton } from "@clerk/nextjs";
import { FaUserGraduate, FaLock } from "react-icons/fa";

export default function UnauthorizedPage() {
  return (
    <div 
      className="flex min-h-screen flex-col items-center justify-center px-4 text-center relative overflow-hidden"
      style={{ backgroundColor: "#0f172a" }}
    >
      {/* Subtle background glow effect using Vitality Green */}
      <div 
        className="absolute w-96 h-96 rounded-full opacity-10 blur-3xl pointer-events-none"
        style={{ backgroundColor: "#16a34a" }}
      />

      <div className="relative z-10 max-w-md w-full space-y-6 rounded-3xl p-8 sm:p-10 bg-slate-900/60 border border-slate-800/80 shadow-2xl backdrop-blur-xl">
        
        {/* Lock Icon Badge */}
        <div 
          className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-800/80 border border-slate-700/50 shadow-inner"
        >
          <FaLock className="text-xl" style={{ color: "#16a34a" }} />
        </div>

        <div className="space-y-2">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
            Authentication Required
          </h1>
          <p className="text-slate-400 text-sm leading-relaxed">
            You need to be signed in and approved to view the dashboard, features, and blog sections.
          </p>
        </div>

        <div className="pt-2 flex flex-col sm:flex-row gap-3 justify-center items-center">
          {/* Sign In Button using Vitality Green (#16a34a) */}
          <SignInButton mode="modal">
            <button
              className="w-full sm:w-auto flex items-center justify-center gap-2 rounded-full px-6 py-3 text-white font-medium text-sm transition-all shadow-lg hover:brightness-110 active:scale-95 cursor-pointer"
              style={{ backgroundColor: "#16a34a" }}
            >
              <FaUserGraduate size={15} />
              <span>Sign In with Clerk</span>
            </button>
          </SignInButton>

          {/* Back to Home Button */}
          <Link
            href="/"
            className="w-full sm:w-auto flex items-center justify-center rounded-full border border-slate-700/80 bg-slate-800/40 px-6 py-3 text-slate-300 text-sm font-medium hover:bg-slate-800 hover:text-white transition-all shadow-sm"
          >
            Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
}