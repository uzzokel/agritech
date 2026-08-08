// app/pending-approval/page.tsx
import Link from "next/link";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { Clock, ShieldCheck, Mail, ArrowLeft } from "lucide-react";
import { currentUser } from "@clerk/nextjs/server";

interface PendingApprovalPageProps {
  searchParams: Promise<{ redirect?: string }>;
}

export default async function PendingApprovalPage({
  searchParams,
}: PendingApprovalPageProps) {
  const user = await currentUser();
  const cookieStore = await cookies();
  const resolvedParams = await searchParams;

  // Preserve the specific route clicked (e.g., /features, /blog, /dashboard)
  const targetRedirect = resolvedParams?.redirect || "/dashboard";

  // 1. Admin Bypass: Send admin directly to their intended route
  const userRole = (user?.publicMetadata as { role?: string })?.role;
  if (userRole === "admin") {
    redirect(targetRedirect);
  }

  // 2. Verified Tier-2 Session Check: Send verified user directly to their intended route
  const isVerified = cookieStore.get("agri_session_verified")?.value === "true";
  const hasSessionId = Boolean(cookieStore.get("agri_session_id")?.value);

  if (isVerified && hasSessionId) {
    redirect(targetRedirect);
  }

  const userEmail =
    user?.emailAddresses[0]?.emailAddress || "your registered email";

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-4 pt-20">
      <div className="max-w-lg w-full bg-slate-900/80 border border-slate-800/80 rounded-3xl p-8 text-center space-y-6 shadow-2xl backdrop-blur-sm">
        {/* Animated Status Icon */}
        <div className="relative w-20 h-20 mx-auto flex items-center justify-center">
          <div className="absolute inset-0 bg-amber-500/10 rounded-full animate-ping opacity-75" />
          <div className="relative w-20 h-20 bg-amber-500/10 border border-amber-500/30 rounded-full flex items-center justify-center text-amber-400 shadow-inner">
            <Clock className="w-10 h-10 animate-pulse" />
          </div>
        </div>

        {/* Header Text */}
        <div className="space-y-2">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20">
            Status: Pending Admin Review
          </span>
          <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight pt-2">
            Application Under Review
          </h1>
          <p className="text-sm text-slate-400 leading-relaxed max-w-sm mx-auto">
            Your registration request for{" "}
            <span className="text-slate-200 font-medium">{userEmail}</span> has
            been received and is currently being reviewed by an administrator.
          </p>
        </div>

        {/* Steps Box */}
        <div className="bg-slate-950/60 border border-slate-800/80 rounded-2xl p-4 text-left space-y-3">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400" /> What happens next?
          </h3>
          <ul className="text-xs text-slate-300 space-y-2.5">
            <li className="flex items-start gap-2.5">
              <span className="flex-shrink-0 w-5 h-5 rounded-full bg-slate-800 text-slate-300 flex items-center justify-center text-[10px] font-bold">
                1
              </span>
              <span>An admin verifies your regional details and grants access.</span>
            </li>
            <li className="flex items-start gap-2.5">
              <span className="flex-shrink-0 w-5 h-5 rounded-full bg-slate-800 text-slate-300 flex items-center justify-center text-[10px] font-bold">
                2
              </span>
              <span>
                You will receive your unique <strong>AGRI-ID</strong> and{" "}
                <strong>Security PIN</strong> in your email!
              </span>
            </li>
            <li className="flex items-start gap-2.5">
              <span className="flex-shrink-0 w-5 h-5 rounded-full bg-slate-800 text-slate-300 flex items-center justify-center text-[10px] font-bold">
                3
              </span>
              <span>
                Use your ID and PIN on the portal access screen to enter your requested destination.
              </span>
            </li>
          </ul>
        </div>

        {/* Footer Actions */}
        <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3 border-t border-slate-800/80">
          <Link
            href="/"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 text-xs font-semibold text-slate-300 hover:text-white bg-slate-800/60 hover:bg-slate-800 border border-slate-700/60 rounded-xl transition cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" /> Return Home
          </Link>
          <a
            href="mailto:support@agritech.com"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 text-xs font-semibold text-amber-400 hover:text-amber-300 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/20 rounded-xl transition cursor-pointer"
          >
            <Mail className="w-4 h-4" /> Contact Support
          </a>
        </div>
      </div>
    </div>
  );
}