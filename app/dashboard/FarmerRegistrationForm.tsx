"use client";

import { useState } from "react";
import { uploadFarmerPhoto, createFarmerRecord } from "@/app/dashboard/actions";

interface FarmerFormProps {
  onSuccess?: () => void;
}

export default function FarmerRegistrationForm({ onSuccess }: FarmerFormProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [photoFile, setPhotoFile] = useState<File | null>(null);

  const initialFormData = {
    fullName: "",
    age: "",
    gender: "Male",
    highestEducation: "Secondary",
    maritalStatus: "Single",
    householdSize: "",
    state: "",
    lga: "",
    cluster: "",
    userGroup: "",
    nameOfChosenEnterprise: "",
    typeOfEnterprise: "Crop Production",
    estimatedAnnualIncome: "",
    phoneNumber: "",
  };

  const [formData, setFormData] = useState(initialFormData);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    // Clear householdSize if maritalStatus changes away from Married
    if (name === "maritalStatus" && value !== "Married") {
      setFormData({ ...formData, maritalStatus: value, householdSize: "" });
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccessMessage(null);

    try {
      let photoUrl: string | null = null;

      // 1. Upload photo if provided
      if (photoFile) {
        const photoData = new FormData();
        photoData.append("photo", photoFile);
        const uploadRes = await uploadFarmerPhoto(photoData);

        if (!uploadRes.success) {
          setError(uploadRes.error || "Failed to upload photo");
          setLoading(false);
          window.scrollTo({ top: 0, behavior: "smooth" });
          return;
        }
        photoUrl = uploadRes.url || null;
      }

      // 2. Save Farmer Record to Database
      const result = await createFarmerRecord({
        fullName: formData.fullName,
        age: parseInt(formData.age, 10),
        gender: formData.gender,
        highestEducation: formData.highestEducation,
        maritalStatus: formData.maritalStatus,
        householdSize: formData.maritalStatus === "Married" && formData.householdSize 
          ? parseInt(formData.householdSize, 10) 
          : null,
        state: formData.state,
        lga: formData.lga,
        cluster: formData.cluster,
        userGroup: formData.userGroup,
        nameOfChosenEnterprise: formData.nameOfChosenEnterprise,
        typeOfEnterprise: formData.typeOfEnterprise,
        estimatedAnnualIncome: parseFloat(formData.estimatedAnnualIncome),
        phoneNumber: formData.phoneNumber,
        photoUrl: photoUrl,
      });

      if (result.success) {
        // Show success alert & reset form
        setSuccessMessage("🎉 Farmer registered successfully!");
        setFormData(initialFormData);
        setPhotoFile(null);

        // Scroll up to ensure the green banner is visible
        window.scrollTo({ top: 0, behavior: "smooth" });

        if (onSuccess) onSuccess();
      } else {
        setError(result.error || "Failed to create record");
        window.scrollTo({ top: 0, behavior: "smooth" });
      }
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred");
      window.scrollTo({ top: 0, behavior: "smooth" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 text-slate-100">
      {/* Success Notification */}
      {successMessage && (
        <div className="p-4 bg-emerald-950/60 border border-emerald-500/50 rounded-xl text-emerald-300 text-sm flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span>✅</span>
            <span>{successMessage}</span>
          </div>
          <button
            type="button"
            onClick={() => setSuccessMessage(null)}
            className="text-xs text-emerald-400 hover:underline"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Error Notification */}
      {error && (
        <div className="p-4 bg-red-900/40 border border-red-500/50 rounded-xl text-red-300 text-sm flex items-center gap-2">
          <span>⚠️</span>
          <span>{error}</span>
        </div>
      )}

      {/* Personal Info */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">Full Name *</label>
          <input
            type="text"
            name="fullName"
            required
            value={formData.fullName}
            onChange={handleChange}
            placeholder="John Doe"
            className="w-full px-3.5 py-2.5 bg-slate-800/80 border border-emerald-900/40 rounded-xl text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">Phone Number *</label>
          <input
            type="text"
            name="phoneNumber"
            required
            value={formData.phoneNumber}
            onChange={handleChange}
            placeholder="+234..."
            className="w-full px-3.5 py-2.5 bg-slate-800/80 border border-emerald-900/40 rounded-xl text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">Age *</label>
          <input
            type="number"
            name="age"
            required
            value={formData.age}
            onChange={handleChange}
            placeholder="35"
            className="w-full px-3.5 py-2.5 bg-slate-800/80 border border-emerald-900/40 rounded-xl text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">Gender *</label>
          <select
            name="gender"
            value={formData.gender}
            onChange={handleChange}
            className="w-full px-3.5 py-2.5 bg-slate-800/80 border border-emerald-900/40 rounded-xl text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
          >
            <option value="Male">Male</option>
            <option value="Female">Female</option>
          </select>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">Highest Education *</label>
          <select
            name="highestEducation"
            value={formData.highestEducation}
            onChange={handleChange}
            className="w-full px-3.5 py-2.5 bg-slate-800/80 border border-emerald-900/40 rounded-xl text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
          >
            <option value="Primary">Primary</option>
            <option value="Secondary">Secondary</option>
            <option value="Tertiary">Tertiary</option>
            <option value="None">None</option>
          </select>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">Marital Status *</label>
          <select
            name="maritalStatus"
            value={formData.maritalStatus}
            onChange={handleChange}
            className="w-full px-3.5 py-2.5 bg-slate-800/80 border border-emerald-900/40 rounded-xl text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
          >
            <option value="Single">Single</option>
            <option value="Married">Married</option>
            <option value="Divorced">Divorced</option>
            <option value="Widowed">Widowed</option>
          </select>
        </div>

        {/* CONDITIONAL FIELD: Family/Household Size for Married Farmers */}
        {formData.maritalStatus === "Married" && (
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">
              Family / Household Size *
            </label>
            <input
              type="number"
              name="householdSize"
              min="1"
              required
              value={formData.householdSize}
              onChange={handleChange}
              placeholder="e.g. 5"
              className="w-full px-3.5 py-2.5 bg-slate-800/80 border border-emerald-900/40 rounded-xl text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 animate-in fade-in duration-200"
            />
          </div>
        )}
      </div>

      {/* Location & Enterprise */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">State *</label>
          <input
            type="text"
            name="state"
            required
            value={formData.state}
            onChange={handleChange}
            placeholder="Kano"
            className="w-full px-3.5 py-2.5 bg-slate-800/80 border border-emerald-900/40 rounded-xl text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">LGA *</label>
          <input
            type="text"
            name="lga"
            required
            value={formData.lga}
            onChange={handleChange}
            placeholder="LGA Name"
            className="w-full px-3.5 py-2.5 bg-slate-800/80 border border-emerald-900/40 rounded-xl text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">Cluster *</label>
          <input
            type="text"
            name="cluster"
            required
            value={formData.cluster}
            onChange={handleChange}
            placeholder="Cluster A"
            className="w-full px-3.5 py-2.5 bg-slate-800/80 border border-emerald-900/40 rounded-xl text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">User Group *</label>
          <input
            type="text"
            name="userGroup"
            required
            value={formData.userGroup}
            onChange={handleChange}
            placeholder="Cooperative Group 1"
            className="w-full px-3.5 py-2.5 bg-slate-800/80 border border-emerald-900/40 rounded-xl text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">Chosen Enterprise *</label>
          <input
            type="text"
            name="nameOfChosenEnterprise"
            required
            value={formData.nameOfChosenEnterprise}
            onChange={handleChange}
            placeholder="Cassava Farming"
            className="w-full px-3.5 py-2.5 bg-slate-800/80 border border-emerald-900/40 rounded-xl text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">Type of Enterprise *</label>
          <input
            type="text"
            name="typeOfEnterprise"
            required
            value={formData.typeOfEnterprise}
            onChange={handleChange}
            placeholder="Crop Production"
            className="w-full px-3.5 py-2.5 bg-slate-800/80 border border-emerald-900/40 rounded-xl text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">Estimated Annual Income (₦) *</label>
          <input
            type="number"
            name="estimatedAnnualIncome"
            required
            value={formData.estimatedAnnualIncome}
            onChange={handleChange}
            placeholder="500000"
            className="w-full px-3.5 py-2.5 bg-slate-800/80 border border-emerald-900/40 rounded-xl text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">Farmer Photo (Optional)</label>
          <input
            type="file"
            accept="image/*"
            onChange={(e) => setPhotoFile(e.target.files?.[0] || null)}
            className="w-full px-3 py-2 bg-slate-800/80 border border-emerald-900/40 rounded-xl text-xs text-slate-300 file:mr-3 file:py-1 file:px-3 file:rounded-lg file:border-0 file:bg-emerald-600/30 file:text-emerald-300 hover:file:bg-emerald-600/50"
          />
        </div>
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full py-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-semibold text-sm rounded-xl shadow-lg shadow-emerald-950/50 transition-all duration-200 disabled:opacity-50"
      >
        {loading ? "Registering Farmer..." : "Submit Registration"}
      </button>
    </form>
  );
}