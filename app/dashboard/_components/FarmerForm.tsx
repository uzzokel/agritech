"use client";

import { useState } from "react";
import { theme } from "../../components/Styles";
import { uploadFarmerPhoto, createFarmerRecord } from "../actions"; // Adjust import path if needed

export interface FarmerFormData {
  fullName: string;
  age: string;
  gender: string;
  highestEducation: string;
  maritalStatus: string;
  householdSize: string;
  state: string;
  lga: string;
  cluster: string;
  userGroup: string;
  nameOfChosenEnterprise: string;
  typeOfEnterprise: string;
  estimatedAnnualIncome: string;
  phoneNumber: string;
  photo: File | null;
}

const initialFormState: FarmerFormData = {
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
  typeOfEnterprise: "",
  estimatedAnnualIncome: "",
  phoneNumber: "",
  photo: null,
};

export default function FarmerForm() {
  const [formData, setFormData] = useState<FarmerFormData>(initialFormState);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      let photoUrl: string | null = null;

      // Step 1: Upload photo to Supabase Storage (if selected)
      if (formData.photo) {
        const uploadData = new FormData();
        uploadData.append("photo", formData.photo);

        const uploadResult = await uploadFarmerPhoto(uploadData);

        if (!uploadResult.success) {
          throw new Error(uploadResult.error || "Failed to upload photo");
        }

        photoUrl = uploadResult.url || null;
      }

      // Step 2: Prepare payload for Prisma insert
      const payload = {
        fullName: formData.fullName,
        age: parseInt(formData.age, 10),
        gender: formData.gender,
        highestEducation: formData.highestEducation,
        maritalStatus: formData.maritalStatus,
        householdSize: formData.householdSize ? parseInt(formData.householdSize, 10) : null,
        state: formData.state,
        lga: formData.lga,
        cluster: formData.cluster,
        userGroup: formData.userGroup,
        nameOfChosenEnterprise: formData.nameOfChosenEnterprise,
        typeOfEnterprise: formData.typeOfEnterprise,
        estimatedAnnualIncome: parseFloat(formData.estimatedAnnualIncome),
        phoneNumber: formData.phoneNumber,
        photoUrl: photoUrl,
      };

      // Step 3: Call Server Action to write to PostgreSQL via Prisma
      const result = await createFarmerRecord(payload);

      if (result.success) {
        alert("Farmer record registered successfully!");
        setFormData(initialFormState);
      } else {
        alert(`Error saving record: ${result.error}`);
      }
    } catch (err: any) {
      console.error("Submission failed:", err);
      alert(`An error occurred: ${err.message || "Failed to submit farmer record."}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl bg-white rounded-xl p-8 shadow-sm border border-gray-100">
      <div className="mb-6 border-b border-gray-100 pb-4">
        <h2 className="text-2xl font-bold text-gray-800">Farmer Registration Form</h2>
        <p className="text-sm text-gray-500">Fill in all 16 required details to register a new record.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        
        {/* 1. PERSONAL INFORMATION */}
        <div>
          <h3 className="text-xs font-semibold uppercase tracking-wider text-emerald-700 mb-3">
            1. Personal Details
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            {/* Full Name */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Full Name *</label>
              <input
                type="text"
                required
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
                placeholder="e.g. Uzoamaka John"
                value={formData.fullName}
                onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
              />
            </div>

            {/* Age */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Age *</label>
              <input
                type="number"
                required
                min="18"
                max="120"
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
                placeholder="e.g. 32"
                value={formData.age}
                onChange={(e) => setFormData({ ...formData, age: e.target.value })}
              />
            </div>

            {/* Gender */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Gender *</label>
              <select
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
                value={formData.gender}
                onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
              >
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
            </div>

            {/* Highest Educational Qualification */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Highest Educational Qualification *</label>
              <select
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
                value={formData.highestEducation}
                onChange={(e) => setFormData({ ...formData, highestEducation: e.target.value })}
              >
                <option value="None">None</option>
                <option value="Primary">Primary Education</option>
                <option value="Secondary">Secondary Education</option>
                <option value="Tertiary">Tertiary (ND / HND / Degree)</option>
                <option value="Postgraduate">Postgraduate</option>
              </select>
            </div>

            {/* Marital Status */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Marital Status *</label>
              <select
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
                value={formData.maritalStatus}
                onChange={(e) => setFormData({ ...formData, maritalStatus: e.target.value })}
              >
                <option value="Single">Single</option>
                <option value="Married">Married</option>
                <option value="Divorced">Divorced</option>
                <option value="Widowed">Widowed</option>
              </select>
            </div>

            {/* Household Size (Required if Married) */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Household Size {formData.maritalStatus === "Married" ? "*" : "(Optional)"}
              </label>
              <input
                type="number"
                min="1"
                disabled={formData.maritalStatus !== "Married"}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none disabled:bg-gray-100 disabled:cursor-not-allowed"
                placeholder={formData.maritalStatus === "Married" ? "e.g. 5" : "Only if married"}
                value={formData.householdSize}
                onChange={(e) => setFormData({ ...formData, householdSize: e.target.value })}
              />
            </div>

          </div>
        </div>

        {/* 2. LOCATION & CLUSTER */}
        <div className="pt-4 border-t border-gray-100">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-emerald-700 mb-3">
            2. Location & Cluster Details
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            
            {/* State */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">State *</label>
              <input
                type="text"
                required
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
                placeholder="e.g. Enugu"
                value={formData.state}
                onChange={(e) => setFormData({ ...formData, state: e.target.value })}
              />
            </div>

            {/* LGA */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">LGA *</label>
              <input
                type="text"
                required
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
                placeholder="e.g. Nsukka"
                value={formData.lga}
                onChange={(e) => setFormData({ ...formData, lga: e.target.value })}
              />
            </div>

            {/* Cluster */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Cluster *</label>
              <input
                type="text"
                required
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
                placeholder="e.g. Adani Rice Cluster"
                value={formData.cluster}
                onChange={(e) => setFormData({ ...formData, cluster: e.target.value })}
              />
            </div>

          </div>
        </div>

        {/* 3. ENTERPRISE & FINANCIALS */}
        <div className="pt-4 border-t border-gray-100">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-emerald-700 mb-3">
            3. Enterprise & Financials
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            {/* User Group */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">User Group *</label>
              <input
                type="text"
                required
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
                placeholder="e.g. Nsukka Farmers Cooperative"
                value={formData.userGroup}
                onChange={(e) => setFormData({ ...formData, userGroup: e.target.value })}
              />
            </div>

            {/* Name of Chosen Enterprise */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Name of Chosen Enterprise *</label>
              <input
                type="text"
                required
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
                placeholder="e.g. GreenValley Agro Farms"
                value={formData.nameOfChosenEnterprise}
                onChange={(e) => setFormData({ ...formData, nameOfChosenEnterprise: e.target.value })}
              />
            </div>

            {/* Type of Enterprise */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Type of Enterprise *</label>
              <input
                type="text"
                required
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
                placeholder="e.g. Cassava & Maize Production"
                value={formData.typeOfEnterprise}
                onChange={(e) => setFormData({ ...formData, typeOfEnterprise: e.target.value })}
              />
            </div>

            {/* Estimated Annual Income */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Est. Annual Income (₦) *</label>
              <input
                type="number"
                required
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
                placeholder="e.g. 1500000"
                value={formData.estimatedAnnualIncome}
                onChange={(e) => setFormData({ ...formData, estimatedAnnualIncome: e.target.value })}
              />
            </div>

          </div>
        </div>

        {/* 4. CONTACT & PHOTO */}
        <div className="pt-4 border-t border-gray-100">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-emerald-700 mb-3">
            4. Contact & Photo Upload
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            {/* Phone Number */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Phone Number *</label>
              <input
                type="tel"
                required
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
                placeholder="e.g. 08012345678"
                value={formData.phoneNumber}
                onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
              />
            </div>

            {/* Photo Upload */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Farmer Photo</label>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => setFormData({ ...formData, photo: e.target.files ? e.target.files[0] : null })}
                className="w-full text-xs text-gray-500 file:mr-3 file:py-2 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100"
              />
            </div>

          </div>
        </div>

        {/* SUBMIT BUTTON */}
        <div className="pt-4">
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-3 text-white font-medium rounded-lg shadow-md transition-opacity hover:opacity-95 disabled:opacity-50"
            style={{ backgroundColor: theme.primaryColor }}
          >
            {isSubmitting ? "Saving to Database..." : "Submit Farmer Record"}
          </button>
        </div>

      </form>
    </div>
  );
}