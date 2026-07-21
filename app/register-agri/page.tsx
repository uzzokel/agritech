"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { registerAgriUser } from "@/app/actions/register-agri";

const DESIGNATION_OPTIONS = [
  "Agricultural Officer",
  "Extension Agent/Facilitator",
  "Lead Farmer / Cluster Coordinator",
  "Inspector / Auditor",
  "Field Data Collector",
];

export default function RegisterAgriPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const [form, setForm] = useState({
    fullName: "",
    email: "", // 👈 1. Added email state
    state: "",
    lga: "",
    designation: "",
    phoneNumber: "",
    securityPin: "",
  });

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    setForm({ ...form, [e.target.name]: e.target.value });
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

    if (form.securityPin.length < 4) {
      setError("Security PIN must be at least 4 digits.");
      setLoading(false);
      return;
    }

    const res = await registerAgriUser(form);
    setLoading(false);

    if (res.success) {
      setSubmitted(true);
    } else {
      setError(res.error || "An error occurred.");
    }
  };

  if (submitted) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-slate-950 text-white">
        <div className="max-w-md w-full text-center bg-slate-900 border border-slate-800 p-8 rounded-2xl shadow-xl">
          <div className="w-16 h-16 bg-emerald-500/10 text-emerald-400 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl font-bold">
            ✓
          </div>
          <h2 className="text-2xl font-bold mb-2">Application Submitted!</h2>
          <p className="text-gray-400 text-sm mb-6">
            Your details have been registered. Your account status is currently <span className="text-amber-400 font-semibold">PENDING</span>. Once an admin reviews and approves your account, your access credentials will be delivered.
          </p>
          <button
            onClick={() => router.push("/")}
            className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-medium rounded-lg transition"
          >
            Return Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-slate-950 text-white py-12">
      <div className="max-w-lg w-full bg-slate-900 border border-slate-800 p-8 rounded-2xl shadow-xl">
        <h1 className="text-2xl font-bold mb-1 text-emerald-400">AgriTech Access Application</h1>
        <p className="text-sm text-gray-400 mb-6">
          Provide your regional details to request access authorization.
        </p>

        {error && (
          <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 text-red-400 text-sm rounded-lg">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-300 mb-1">Full Name *</label>
            <input
              type="text"
              name="fullName"
              required
              value={form.fullName}
              onChange={handleChange}
              placeholder="e.g. Ibrahim Musa"
              className="w-full px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-emerald-500"
            />
          </div>

          {/* 👈 2. Added Email Address Input */}
          <div>
            <label className="block text-xs font-semibold text-gray-300 mb-1">Email Address *</label>
            <input
              type="email"
              name="email"
              required
              value={form.email}
              onChange={handleChange}
              placeholder="e.g. ibrahim@example.com"
              className="w-full px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-emerald-500"
            />
            <p className="text-[11px] text-gray-500 mt-1">
              Your AGRI-ID approval notification and login details will be sent here.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-300 mb-1">State *</label>
              <input
                type="text"
                name="state"
                required
                value={form.state}
                onChange={handleChange}
                placeholder="e.g. Kano"
                className="w-full px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-emerald-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-300 mb-1">LGA *</label>
              <input
                type="text"
                name="lga"
                required
                value={form.lga}
                onChange={handleChange}
                placeholder="e.g. Dala"
                className="w-full px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-300 mb-1">Designation *</label>
            <select
              name="designation"
              required
              value={form.designation}
              onChange={handleChange}
              className="w-full px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-emerald-500"
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
            <label className="block text-xs font-semibold text-gray-300 mb-1">Phone Number (Optional)</label>
            <input
              type="tel"
              name="phoneNumber"
              value={form.phoneNumber}
              onChange={handleChange}
              placeholder="+234..."
              className="w-full px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-300 mb-1">Security PIN (4-6 Digits) *</label>
            <input
              type="password"
              name="securityPin"
              maxLength={6}
              required
              value={form.securityPin}
              onChange={handleChange}
              placeholder="••••"
              className="w-full px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-emerald-500"
            />
            <p className="text-[11px] text-gray-500 mt-1">
              You will use this PIN along with your unique AGRI-ID to log in once approved.
            </p>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-lg transition duration-200"
          >
            {loading ? "Submitting Application..." : "Submit Registration"}
          </button>
        </form>
      </div>
    </div>
  );
}