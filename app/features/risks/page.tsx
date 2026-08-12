"use client";

import React, { useState, useEffect, useTransition } from "react";
import { useFormik } from "formik";
import * as Yup from "yup";
import { 
  AlertTriangle, 
  Plus, 
  X, 
  ShieldAlert, 
  CheckCircle2, 
  Clock, 
  Download,
  Trash2,
  Loader2
} from "lucide-react";

// Server Actions
import { createRisk, getRisks, deleteRisk } from "@/app/actions/risk-actions";

// PDF Generation Imports
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

// Theme Configuration
export const theme = {
  primaryColor: "#0f172a",   // Deep Navy
  secondaryColor: "#16a34a", // Vitality Green
};

// Types
interface RiskItem {
  id: string;
  riskCategory: string;
  riskDescription: string;
  probability: number;
  impact: number;
  riskIntensity: number;
  riskAssessment: string;
  responseStrategy: string;
  riskOwner: string;
  status: string;
  timestamp: string;
}

// Helper to compute Intensity and Assessment with strict numerical parsing
const computeRiskAssessment = (probability: number | string, impact: number | string) => {
  const p = typeof probability === "number" ? probability : parseFloat(probability) || 0;
  const i = typeof impact === "number" ? impact : parseFloat(impact) || 0;
  
  const intensity = parseFloat((p * i).toFixed(2));
  let assessment = "Low Risk";
  let badgeColor = "bg-green-100 text-green-800 border-green-300";

  if (intensity >= 3.0) {
    assessment = "High Risk";
    badgeColor = "bg-rose-100 text-rose-800 border-rose-300";
  } else if (intensity >= 2.0) {
    assessment = "Medium Risk";
    badgeColor = "bg-amber-100 text-amber-800 border-amber-300";
  }

  return { intensity, assessment, badgeColor };
};

// Word counter validation helper
const maxWords = (max: number) => (value: string | undefined) => {
  if (!value) return true;
  const wordCount = value.trim().split(/\s+/).filter(Boolean).length;
  return wordCount <= max;
};

// Formik Validation Schema
const RiskSchema = Yup.object().shape({
  riskCategory: Yup.string().required("Risk category is required"),
  riskDescription: Yup.string()
    .required("Description is required")
    .test("word-count", "Description must not exceed 300 words", maxWords(300)),
  probability: Yup.number().required("Probability is required"),
  impact: Yup.number().required("Impact is required"),
  responseStrategy: Yup.string().required("Response strategy is required"),
  riskOwner: Yup.string().required("Risk owner is required"),
  status: Yup.string().required("Status is required"),
});

export default function RiskMonitoringPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [risks, setRisks] = useState<RiskItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isPending, startTransition] = useTransition();

  // Load risks from database via Server Action
  useEffect(() => {
    async function loadRisks() {
      setIsLoading(true);
      const result = await getRisks();
      if (result.success && result.data) {
        const formattedRisks = result.data.map((r: any) => ({
          ...r,
          probability: Number(r.probability),
          impact: Number(r.impact),
          riskIntensity: Number(r.riskIntensity ?? (r.probability * r.impact)),
          timestamp: r.timestamp ? new Date(r.timestamp).toLocaleString() : new Date().toLocaleString(),
        }));
        setRisks(formattedRisks);
      }
      setIsLoading(false);
    }
    loadRisks();
  }, []);

  const formik = useFormik({
    initialValues: {
      riskCategory: "Technical",
      riskDescription: "",
      probability: 0.1,
      impact: 1,
      responseStrategy: "Mitigate",
      riskOwner: "",
      status: "Open",
    },
    validationSchema: RiskSchema,
    onSubmit: async (values, { resetForm, setSubmitting }) => {
      startTransition(async () => {
        const probNum = Number(values.probability);
        const impactNum = Number(values.impact);

        const result = await createRisk({
          riskCategory: values.riskCategory,
          riskDescription: values.riskDescription,
          probability: probNum,
          impact: impactNum,
          responseStrategy: values.responseStrategy,
          riskOwner: values.riskOwner,
          status: values.status,
        });

        if (result.success && result.data) {
          const formattedNewRisk: RiskItem = {
            ...result.data,
            probability: probNum,
            impact: impactNum,
            riskIntensity: parseFloat((probNum * impactNum).toFixed(2)),
            timestamp: result.data.timestamp 
              ? new Date(result.data.timestamp).toLocaleString() 
              : new Date().toLocaleString(),
          };

          setRisks((prev) => [formattedNewRisk, ...prev]);
          resetForm();
          setIsModalOpen(false);
        } else {
          alert(result.error || "Failed to create risk record.");
        }
        setSubmitting(false);
      });
    },
  });

  // Handle Risk Deletion
  const handleDeleteRisk = async (id: string) => {
    if (!confirm("Are you sure you want to delete this risk record?")) return;

    startTransition(async () => {
      const result = await deleteRisk(id);
      if (result.success) {
        setRisks((prev) => prev.filter((r) => r.id !== id));
      } else {
        alert(result.error || "Failed to delete risk record.");
      }
    });
  };

  // Export to PDF Handler
  const handleExportPDF = () => {
    const doc = new jsPDF({
      orientation: "landscape",
      unit: "pt",
      format: "a4",
    });

    doc.setFontSize(18);
    doc.setTextColor(15, 23, 42); // #0f172a
    doc.text("Risk Monitoring & Analysis Report", 40, 40);

    doc.setFontSize(10);
    doc.setTextColor(100, 116, 139); 
    doc.text(`Generated on: ${new Date().toLocaleString()}`, 40, 56);

    const highRisks = risks.filter((r) => r.riskAssessment === "High Risk").length;
    const medRisks = risks.filter((r) => r.riskAssessment === "Medium Risk").length;
    const lowRisks = risks.filter((r) => r.riskAssessment === "Low Risk").length;

    doc.setFontSize(10);
    doc.setTextColor(30, 41, 59);
    doc.text(
      `Total Risks Logged: ${risks.length} | High: ${highRisks} | Medium: ${medRisks} | Low: ${lowRisks}`,
      40,
      75
    );

    const tableRows = risks.map((r) => [
      r.id,
      r.riskCategory,
      r.riskDescription,
      Number(r.probability).toFixed(1),
      Number(r.impact).toString(),
      (Number(r.probability) * Number(r.impact)).toFixed(2),
      r.riskAssessment,
      r.responseStrategy,
      r.riskOwner,
      r.status,
      r.timestamp,
    ]);

    autoTable(doc, {
      startY: 90,
      head: [[
        "Risk ID",
        "Category",
        "Description",
        "P",
        "I",
        "P×I",
        "Assessment",
        "Strategy",
        "Owner",
        "Status",
        "Timestamp"
      ]],
      body: tableRows,
      theme: "striped",
      headStyles: {
        fillColor: [15, 23, 42], // Deep Navy #0f172a
        textColor: [255, 255, 255],
        fontStyle: "bold",
        fontSize: 9,
      },
      bodyStyles: {
        fontSize: 8,
        textColor: [51, 65, 85],
      },
      columnStyles: {
        0: { cellWidth: 50 },
        1: { cellWidth: 65 },
        2: { cellWidth: 160 },
        3: { cellWidth: 30, halign: "center" },
        4: { cellWidth: 30, halign: "center" },
        5: { cellWidth: 35, halign: "center" },
        6: { cellWidth: 65, halign: "center" },
        7: { cellWidth: 60 },
        8: { cellWidth: 80 },
        9: { cellWidth: 60 },
        10: { cellWidth: 85 },
      },
      didParseCell: (data) => {
        if (data.section === "body" && data.column.index === 6) {
          const val = data.cell.raw as string;
          if (val === "High Risk") {
            data.cell.styles.textColor = [225, 29, 72];
            data.cell.styles.fontStyle = "bold";
          } else if (val === "Medium Risk") {
            data.cell.styles.textColor = [217, 119, 6];
            data.cell.styles.fontStyle = "bold";
          } else if (val === "Low Risk") {
            data.cell.styles.textColor = [22, 163, 74]; // Vitality Green
            data.cell.styles.fontStyle = "bold";
          }
        }
      },
    });

    doc.save(`Risk_Monitoring_Report_${Date.now()}.pdf`);
  };

  // Live calculation for modal with strict type conversion
  const liveCalc = computeRiskAssessment(
    formik.values.probability,
    formik.values.impact
  );

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <AlertTriangle className="h-6 w-6 text-amber-500" />
            Risk Monitoring & Analysis
          </h1>
          <p className="text-sm text-slate-600 mt-1">
            Identify, assess, and track risk exposure and response strategies.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={handleExportPDF}
            disabled={risks.length === 0}
            className="inline-flex items-center gap-2 bg-slate-100 hover:bg-slate-200 disabled:opacity-50 text-slate-800 border border-slate-300 font-medium px-4 py-2.5 rounded-lg transition-colors shadow-sm"
          >
            <Download className="h-4 w-4" />
            Export to PDF
          </button>
          <button
            onClick={() => setIsModalOpen(true)}
            className="inline-flex items-center gap-2 bg-[#16a34a] hover:bg-green-700 text-white font-medium px-4 py-2.5 rounded-lg transition-colors shadow-sm"
          >
            <Plus className="h-4 w-4" />
            Add New Risk
          </button>
        </div>
      </div>

      {/* Risk Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="bg-[#0f172a] text-white font-bold">
                <th className="p-4 whitespace-nowrap">Risk ID</th>
                <th className="p-4 whitespace-nowrap">Category</th>
                <th className="p-4 min-w-[240px]">Description</th>
                <th className="p-4 whitespace-nowrap text-center">Probability (P)</th>
                <th className="p-4 whitespace-nowrap text-center">Impact (I)</th>
                <th className="p-4 whitespace-nowrap text-center">Intensity (P×I)</th>
                <th className="p-4 whitespace-nowrap text-center">Assessment</th>
                <th className="p-4 whitespace-nowrap">Strategy</th>
                <th className="p-4 whitespace-nowrap">Owner</th>
                <th className="p-4 whitespace-nowrap">Status</th>
                <th className="p-4 whitespace-nowrap">Timestamp</th>
                <th className="p-4 whitespace-nowrap text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 bg-white">
              {isLoading ? (
                <tr>
                  <td colSpan={12} className="p-8 text-center text-slate-600">
                    <div className="flex items-center justify-center gap-2">
                      <Loader2 className="h-5 w-5 animate-spin text-[#16a34a]" />
                      Loading risk records from database...
                    </div>
                  </td>
                </tr>
              ) : risks.length === 0 ? (
                <tr>
                  <td colSpan={12} className="p-8 text-center text-slate-600">
                    No risk records found. Click "Add New Risk" to log one.
                  </td>
                </tr>
              ) : (
                risks.map((risk) => {
                  const pNum = Number(risk.probability) || 0;
                  const iNum = Number(risk.impact) || 0;
                  const intensityVal = pNum * iNum;
                  
                  const { badgeColor, assessment } = computeRiskAssessment(pNum, iNum);

                  return (
                    <tr key={risk.id} className="hover:bg-slate-50 transition-colors">
                      <td className="p-4 font-mono font-bold text-slate-900">
                        {risk.id.slice(0, 8)}
                      </td>
                      <td className="p-4 font-semibold text-slate-900">
                        {risk.riskCategory}
                      </td>
                      <td className="p-4 text-slate-800 line-clamp-3">
                        {risk.riskDescription}
                      </td>
                      <td className="p-4 text-center font-mono font-medium text-slate-900">
                        {pNum.toFixed(1)}
                      </td>
                      <td className="p-4 text-center font-mono font-medium text-slate-900">
                        {iNum}
                      </td>
                      <td className="p-4 text-center font-bold font-mono text-[#0f172a]">
                        {intensityVal.toFixed(2)}
                      </td>
                      <td className="p-4 text-center">
                        <span
                          className={`inline-block px-2.5 py-1 rounded-full text-xs font-semibold border ${badgeColor}`}
                        >
                          {assessment}
                        </span>
                      </td>
                      <td className="p-4 text-slate-900 font-medium">
                        {risk.responseStrategy}
                      </td>
                      <td className="p-4 text-slate-800 font-medium">{risk.riskOwner}</td>
                      <td className="p-4">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold ${
                            risk.status === "Open"
                              ? "bg-rose-100 text-rose-800 border border-rose-300"
                              : risk.status === "In progress"
                              ? "bg-amber-100 text-amber-800 border border-amber-300"
                              : "bg-green-100 text-green-800 border border-green-300"
                          }`}
                        >
                          {risk.status === "Open" && <ShieldAlert className="h-3 w-3" />}
                          {risk.status === "In progress" && <Clock className="h-3 w-3" />}
                          {risk.status === "closed" && <CheckCircle2 className="h-3 w-3" />}
                          {risk.status}
                        </span>
                      </td>
                      <td className="p-4 text-xs font-medium text-slate-600 whitespace-nowrap">
                        {risk.timestamp}
                      </td>
                      <td className="p-4 text-right">
                        <button
                          onClick={() => handleDeleteRisk(risk.id)}
                          disabled={isPending}
                          className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                          title="Delete Risk"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Form */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-white w-full max-w-2xl rounded-xl shadow-2xl border border-slate-200 overflow-hidden my-8">
            <div className="flex justify-between items-center p-5 border-b border-slate-200 bg-[#0f172a] text-white">
              <h2 className="text-lg font-bold flex items-center gap-2">
                <ShieldAlert className="h-5 w-5 text-[#16a34a]" />
                Register New Risk
              </h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-300 hover:text-white transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={formik.handleSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Risk Category */}
                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1">
                    Risk Category
                  </label>
                  <select
                    name="riskCategory"
                    value={formik.values.riskCategory}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    className="w-full bg-white text-slate-900 font-medium border border-slate-300 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-[#16a34a] focus:border-[#16a34a] outline-none shadow-sm cursor-pointer"
                  >
                    {["Technical", "Operational", "Political", "Environmental", "Financial", "Security"].map((cat) => (
                      <option key={cat} value={cat} className="bg-white text-slate-900 font-medium">
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Response Strategy */}
                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1">
                    Response Strategy
                  </label>
                  <select
                    name="responseStrategy"
                    value={formik.values.responseStrategy}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    className="w-full bg-white text-slate-900 font-medium border border-slate-300 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-[#16a34a] focus:border-[#16a34a] outline-none shadow-sm cursor-pointer"
                  >
                    {["Mitigate", "Accept", "Avoid", "Transfer", "Share"].map((strat) => (
                      <option key={strat} value={strat} className="bg-white text-slate-900 font-medium">
                        {strat}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Risk Description */}
              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1">
                  Risk Description (Max 300 words)
                </label>
                <textarea
                  name="riskDescription"
                  rows={3}
                  value={formik.values.riskDescription}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  placeholder="Provide detailed narrative of the risk exposure..."
                  className="w-full bg-white text-slate-900 font-medium border border-slate-300 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-[#16a34a] focus:border-[#16a34a] outline-none shadow-sm placeholder:text-slate-400"
                />
                {formik.touched.riskDescription && formik.errors.riskDescription && (
                  <p className="text-xs text-rose-600 font-semibold mt-1">{formik.errors.riskDescription}</p>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Probability */}
                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1">
                    Probability of Occurrence (P)
                  </label>
                  <select
                    name="probability"
                    value={formik.values.probability}
                    onChange={(e) => {
                      formik.setFieldValue("probability", parseFloat(e.target.value));
                    }}
                    onBlur={formik.handleBlur}
                    className="w-full bg-white text-slate-900 font-mono font-medium border border-slate-300 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-[#16a34a] focus:border-[#16a34a] outline-none shadow-sm cursor-pointer"
                  >
                    {[0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1.0].map((val) => (
                      <option key={val} value={val} className="bg-white text-slate-900 font-mono font-medium">
                        {val.toFixed(1)}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Impact */}
                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1">
                    Impact Rating (I)
                  </label>
                  <select
                    name="impact"
                    value={formik.values.impact}
                    onChange={(e) => {
                      formik.setFieldValue("impact", parseInt(e.target.value, 10));
                    }}
                    onBlur={formik.handleBlur}
                    className="w-full bg-white text-slate-900 font-mono font-medium border border-slate-300 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-[#16a34a] focus:border-[#16a34a] outline-none shadow-sm cursor-pointer"
                  >
                    {[1, 2, 3, 4, 5].map((val) => (
                      <option key={val} value={val} className="bg-white text-slate-900 font-mono font-medium">
                        {val}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Automatic Calculation Preview */}
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg flex items-center justify-between text-xs">
                <div>
                  <span className="text-slate-700 font-medium">Calculated Intensity (P×I): </span>
                  <span className="font-bold font-mono text-[#0f172a] text-sm">
                    {liveCalc.intensity.toFixed(2)}
                  </span>
                </div>
                <div>
                  <span className="text-slate-700 font-medium">Assessment: </span>
                  <span className={`font-bold border px-2.5 py-0.5 rounded-full ${liveCalc.badgeColor}`}>
                    {liveCalc.assessment}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Risk Owner */}
                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1">
                    Risk Owner
                  </label>
                  <input
                    type="text"
                    name="riskOwner"
                    placeholder="e.g. Project coordinator"
                    value={formik.values.riskOwner}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    className="w-full bg-white text-slate-900 font-medium border border-slate-300 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-[#16a34a] focus:border-[#16a34a] outline-none shadow-sm placeholder:text-slate-400"
                  />
                  {formik.touched.riskOwner && formik.errors.riskOwner && (
                    <p className="text-xs text-rose-600 font-semibold mt-1">{formik.errors.riskOwner}</p>
                  )}
                </div>

                {/* Status */}
                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1">
                    Status
                  </label>
                  <select
                    name="status"
                    value={formik.values.status}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    className="w-full bg-white text-slate-900 font-medium border border-slate-300 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-[#16a34a] focus:border-[#16a34a] outline-none shadow-sm cursor-pointer"
                  >
                    {["Open", "In progress", "closed"].map((st) => (
                      <option key={st} value={st} className="bg-white text-slate-900 font-medium">
                        {st}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Actions */}
              <div className="flex justify-end gap-3 pt-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg text-sm font-semibold hover:bg-slate-100 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={formik.isSubmitting || isPending}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-[#16a34a] text-white rounded-lg text-sm font-semibold hover:bg-green-700 transition-colors disabled:opacity-50 shadow-sm"
                >
                  {(formik.isSubmitting || isPending) && (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  )}
                  Save Risk
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}