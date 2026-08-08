// app/components/LogoutButton.tsx
"use client";

import { useTransition } from "react";
import { useClerk } from "@clerk/nextjs";
import { deleteAgriSessionCookie } from "@/app/actions/logout-agri";
import { LogOut, Loader2 } from "lucide-react";

export function LogoutButton() {
  const [isPending, startTransition] = useTransition();
  const { signOut } = useClerk();

  const handleLogout = () => {
    startTransition(async () => {
      try {
        // 1. Clear Tier-2 session cookies on the server
        await deleteAgriSessionCookie();

        // 2. Clear Clerk session & perform clean client navigation to /login-agri
        await signOut({ redirectUrl: "/login-agri?invalid=1" });
      } catch (error) {
        console.error("Sign-out error:", error);
      }
    });
  };

  return (
    <button
      onClick={handleLogout}
      disabled={isPending}
      className="inline-flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700/80 border border-slate-700/60 transition disabled:opacity-50 cursor-pointer"
    >
      {isPending ? (
        <>
          <Loader2 className="w-4 h-4 animate-spin text-emerald-400" />
          <span>Signing out...</span>
        </>
      ) : (
        <>
          <LogOut className="w-4 h-4 text-slate-400" />
          <span>Sign Out</span>
        </>
      )}
    </button>
  );
}