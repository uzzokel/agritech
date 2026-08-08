"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { registerAgriUser } from "@/app/actions/user";
import { Loader2, CheckCircle2, ShieldAlert } from "lucide-react";

const DESIGNATION_OPTIONS = [
  "Agricultural Officer",
  "Extension Agent/Facilitator",
  "Lead Farmer / Cluster Coordinator",
  "Inspector / Auditor",
  "Field Data Collector",
] as const;

// Helper to check for client-side cookies
function getCookie(name: string): string | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(new RegExp("(^| )" + name + "=([^;]+)"));
  return match ? decodeURIComponent(match[2]) : null;
}

// Safely sanitize redirect query parameter to prevent Open Redirects
function getSafeRedirectUrl(rawParam: string | null): string {
  if (!rawParam) return "/dashboard";
  const safePrefixes = ["/dashboard", "/features", "/blog"];
  const isSafe = safePrefixes.some((prefix) => rawParam.startsWith(prefix));
  return isSafe ? rawParam : "/dashboard";
}

function RegisterFormContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isLoaded, user } = useUser();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const [form, setForm] = useState({
    fullName: "",
    email: "",
    state: "",
    lga: "",
    designation: "",
    phoneNumber: "",
    securityPin: "",
  });

  // Client-Side Session Hydration & Form Prefill
  useEffect(() => {
    if (!isLoaded || !user) return;

    const safeRedirect = getSafeRedirectUrl(searchParams.get("redirect"));

    // Check if Tier-2 verified session cookies are already present in browser storage
    const agriVerified = getCookie("agri_session_verified");
    const agriSessionId = getCookie("agri_session_id");

    if (agriVerified === "true" && agriSessionId) {
      router.replace(safeRedirect);
      return;
    }

    // Auto-fill Clerk primary credentials into initial form state
    const primaryEmail = user.primaryEmailAddress?.emailAddress || "";
    const fullName =
      user.fullName || `${user.firstName || ""} ${user.lastName || ""}`.trim();

    setForm((prev) => ({
      ...prev,
      email: prev.email || primaryEmail,
      fullName: prev.fullName || fullName,
    }));
  }, [isLoaded, user, router, searchParams]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;

    // Restrict security PIN field to numeric digits only
    if (name === "securityPin") {
      const digitsOnly = value.replace(/\D/g, "");
      setForm((prev) => ({ ...prev, securityPin: digitsOnly }));
      return;
    }

    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    if (!form.email) {
      setError("Please enter a valid email address.");
      setLoading(false);
      return;
    }

    if (!form.designation) {
      setError("Please select a designation from the dropdown.");
      setLoading(false);
      return;
    }

    if (form.securityPin.length < 4 || form.securityPin.length > 6) {
      setError("Security PIN must be between 4 and 6 digits.");
      setLoading(false);
      return;
    }

    try {
      const res = await registerAgriUser(form);
      if (res?.success) {
        setSubmitted(true);
      } else {
        setError(res?.error || "An error occurred during submission.");
      }
    } catch {
      setError("An unexpected network error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (!isLoaded) {
    return (
      <div className="flex items-center gap-2 text-emerald-400">
        <Loader2 className="w-6 h-6 animate-spin" /> Checking authorization status...
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="max-w-md w-full text-center bg-slate-900 border border-slate-800 p-8 rounded-2xl shadow-xl">
        <div className="w-16 h-16 bg-emerald-500/10 text-emerald-400 rounded-full flex items-center justify-center mx-auto mb-4 border border-emerald-500/20">
          <CheckCircle2 className="w-8 h-8" />
        </div>
        <h2 className="text-2xl font-bold mb-2 text-white">Application Submitted!</h2>
        <p className="text-slate-400 text-sm mb-6 leading-relaxed">
          Your details have been registered. Your account status is currently{" "}
          <span className="text-amber-400 font-semibold">PENDING</span>. Once an
          admin reviews and approves your account, your access credentials will be delivered to your email.
        </p>
        <button
          onClick={() => router.push("/")}
          className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-medium rounded-xl transition duration-200 cursor-pointer"
        >
          Return Home
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-lg w-full bg-slate-900 border border-slate-800 p-8 rounded-2xl shadow-xl">
      <h1 className="text-2xl font-bold mb-1 text-emerald-400">
        AgriTech Access Application
      </h1>
      <p className="text-sm text-slate-400 mb-6">
        Provide your regional details to request access authorization.
      </p>

      {error && (
        <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 text-red-400 text-sm rounded-xl flex items-center gap-2">
          <ShieldAlert className="w-5 h-5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1">
            Full Name *
          </label>
          <input
            type="text"
            name="fullName"
            required
            value={form.fullName}
            onChange={handleChange}
            placeholder="e.g. Ibrahim Musa"
            className="w-full px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-emerald-500"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1">
            Email Address *
          </label>
          <input
            type="email"
            name="email"
            required
            value={form.email}
            onChange={handleChange}
            placeholder="e.g. ibrahim@example.com"
            className="w-full px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-emerald-500"
          />
          <p className="text-[11px] text-slate-500 mt-1">
            Your AGRI-ID approval notification and login details will be sent to your registered Email.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              State *
            </label>
            <input
              type="text"
              name="state"
              required
              value={form.state}
              onChange={handleChange}
              placeholder="e.g. Kano"
              className="w-full px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-emerald-500"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              LGA *
            </label>
            <input
              type="text"
              name="lga"
              required
              value={form.lga}
              onChange={handleChange}
              placeholder="e.g. Dala"
              className="w-full px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-emerald-500"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1">
            Designation *
          </label>
          <select
            name="designation"
            required
            value={form.designation}
            onChange={handleChange}
            className="w-full px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-emerald-500"
          >
            <option value="" disabled>
              Select your designation...
            </option>
            {DESIGNATION_OPTIONS.map((option) => (
              <option key={option} value={option} className="bg-slate-900 text-white">
                {option}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1">
            Phone Number *
          </label>
          <input
            type="tel"
            name="phoneNumber"
            required
            value={form.phoneNumber}
            onChange={handleChange}
            placeholder="+234..."
            className="w-full px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-emerald-500"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1">
            Security PIN (4-6 Digits) *
          </label>
          <input
            type="password"
            inputMode="numeric"
            name="securityPin"
            maxLength={6}
            required
            value={form.securityPin}
            onChange={handleChange}
            placeholder="••••"
            className="w-full px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-xl font-mono tracking-widest text-white focus:outline-none focus:border-emerald-500"
          />
          <p className="text-[11px] text-slate-500 mt-1">
            You will use this PIN along with your unique AGRI-ID to log in once approved.
          </p>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full mt-2 py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-xl transition duration-200 flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
        >
          {loading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" /> Submitting Application...
            </>
          ) : (
            "Submit Registration"
          )}
        </button>
      </form>
    </div>
  );
}

export default function RegisterAgriPage() {
  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-slate-950 text-white py-12 pt-30">
      <Suspense
        fallback={
          <div className="flex items-center gap-2 text-emerald-400">
            <Loader2 className="w-6 h-6 animate-spin" /> Loading Application...
          </div>
        }
      >
        <RegisterFormContent />
      </Suspense>
    </div>
  );
}