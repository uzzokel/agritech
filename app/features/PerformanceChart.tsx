// app/features/PerformanceChart.tsx
"use client";

import { useEffect, useState } from "react";
import { getPerformanceChartData } from "./actions";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";
import { Loader2, ShieldAlert, BarChart3 } from "lucide-react";

export default function PerformanceChart() {
  const [chartData, setChartData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadData() {
      const res = await getPerformanceChartData();
      if (res.success && res.data) {
        setChartData(res.data);
      } else {
        setError(res.error || "Could not load chart data.");
      }
      setLoading(false);
    }
    loadData();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-80 bg-slate-900 border border-slate-800 rounded-2xl">
        <Loader2 className="w-8 h-8 animate-spin text-[#16a34a]" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-red-500/10 border border-red-500/30 text-red-400 rounded-xl flex items-center gap-3">
        <ShieldAlert className="w-5 h-5 shrink-0" />
        <span>{error}</span>
      </div>
    );
  }

  if (chartData.length === 0) {
    return (
      <div className="bg-slate-900 border border-slate-800 p-12 rounded-2xl text-center space-y-3">
        <BarChart3 className="w-12 h-12 text-slate-600 mx-auto" />
        <h3 className="text-white font-medium">No performance data available yet</h3>
        <p className="text-sm text-slate-400">
          Submit some workplan items and update their performance metrics to see the analytics graph.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-xl">
      <h3 className="text-lg font-semibold text-white mb-2">
        Performance Analysis: Target vs. Actual
      </h3>
      <p className="text-sm text-slate-400 mb-6">
        Automatic comparison of financial estimates and execution metrics across budget categories.
      </p>

      {/* FIXED HEIGHT CONTAINER REQUIRED FOR RECHARTS */}
      <div className="w-full h-96">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData} margin={{ top: 20, right: 30, left: 10, bottom: 20 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
            
            {/* X-Axis Setup */}
            <XAxis 
              dataKey="category" 
              stroke="#94a3b8" 
              fontSize={12} 
              tickLine={false}
              interval={0}
              angle={-15}
              textAnchor="end"
            />
            
            {/* Y-Axis Setup */}
            <YAxis 
              stroke="#94a3b8" 
              fontSize={12} 
              tickLine={false} 
              tickFormatter={(value) => `$${value.toLocaleString()}`}
            />
            
            <Tooltip 
              contentStyle={{ backgroundColor: "#0f172a", borderColor: "#334155", borderRadius: "0.75rem", color: "#fff" }}
              itemStyle={{ color: "#fff" }}
              formatter={(value: any) => [`$${Number(value).toLocaleString()}`, ""]}
            />
            
            <Legend wrapperStyle={{ paddingTop: "20px" }} />
            
            {/* Target Line */}
            <Line 
              type="monotone" 
              dataKey="Target" 
              name="Target Budget"
              stroke="#3b82f6" 
              strokeWidth={3} 
              dot={{ r: 5, fill: "#3b82f6" }} 
              activeDot={{ r: 8 }} 
            />
            
            {/* Actual Line */}
            <Line 
              type="monotone" 
              dataKey="Actual" 
              name="Actual Disbursed"
              stroke="#16a34a" 
              strokeWidth={3} 
              dot={{ r: 5, fill: "#16a34a" }} 
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}