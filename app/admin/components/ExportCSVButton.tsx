// app/admin/components/ExportCSVButton.tsx
"use client";

import React from "react";

interface ExportCSVButtonProps {
  data: any[];
  filename?: string;
}

export default function ExportCSVButton({
  data,
  filename = "farmer_audit_records.csv",
}: ExportCSVButtonProps) {
  const handleExport = () => {
    if (!data || !data.length) return;

    const headers = [
      "ID",
      "Full Name",
      "Phone Number",
      "State",
      "LGA",
      "Enterprise",
      "Enterprise Type",
      "Est. Annual Income (NGN)",
      "Registered By Agent",
      "Agent ID",
    ];

    const rows = data.map((f) => [
      f.id || "",
      `"${(f.fullName || "").replace(/"/g, '""')}"`,
      `"${f.phoneNumber || ""}"`,
      `"${f.state || ""}"`,
      `"${f.lga || ""}"`,
      `"${(f.nameOfChosenEnterprise || "").replace(/"/g, '""')}"`,
      `"${(f.typeOfEnterprise || "").replace(/"/g, '""')}"`,
      f.estimatedAnnualIncome || 0,
      `"${(f.createdBy?.fullName || "").replace(/"/g, '""')}"`,
      `"${f.createdBy?.uniqueAdminId || ""}"`,
    ]);

    const csvContent =
      "data:text/csv;charset=utf-8," +
      [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <button
      type="button"
      onClick={handleExport}
      className="px-3.5 py-2 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-400 rounded-xl text-xs font-semibold transition flex items-center gap-2"
    >
      <span>📥</span>
      <span>Export CSV</span>
    </button>
  );
}