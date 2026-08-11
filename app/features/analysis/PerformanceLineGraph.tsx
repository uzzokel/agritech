"use client";

import { useEffect, useState, useRef } from "react";
import { toPng } from "html-to-image"; 
import { Download } from "lucide-react";
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

interface LineGraphProps {
  title: string;
  icon: React.ReactNode;
  data: Array<{ category: string; Target: number; Actual: number }>;
}

export default function PerformanceLineGraph({ title, icon, data }: LineGraphProps) {
  const [isMounted, setIsMounted] = useState(false);
  const chartRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const handleExportPNG = async () => {
    if (!chartRef.current) return;
    try {
      const dataUrl = await toPng(chartRef.current, { cacheBust: true });
      const link = document.createElement("a");
      link.download = `${title.toLowerCase().replace(/\s+/g, "-")}-graph.png`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error("Failed to export graph PNG:", err);
    }
  };

  if (!data || data.length === 0) {
    return (
      <div className="bg-slate-900 border border-slate-800 p-8 rounded-2xl shadow-xl h-80 flex flex-col items-center justify-center text-center">
        <p className="text-slate-500 text-sm">No data available for {title.toLowerCase()}.</p>
      </div>
    );
  }

  return (
    <div ref={chartRef} className="bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-xl">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-lg font-semibold text-white flex items-center gap-2">
          {icon} {title}
        </h2>

        <button
          type="button"
          onClick={handleExportPNG}
          className="flex items-center gap-2 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-lg transition border border-slate-700 cursor-pointer"
        >
          <Download className="w-4 h-4 text-emerald-400" />
          Export PNG
        </button>
      </div>

      <div className="w-full h-80">
        {isMounted ? (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data} margin={{ top: 10, right: 30, left: 10, bottom: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis
                dataKey="category"
                stroke="#94a3b8"
                fontSize={11}
                tickLine={false}
                interval={0}
                angle={-10}
                textAnchor="end"
              />
              <YAxis
                stroke="#94a3b8"
                fontSize={11}
                tickLine={false}
                tickFormatter={(value: number) =>
                  `$${value >= 1000 ? `${value / 1000}k` : value}`
                }
              />
              
              {/* FIXED TOOLTIP COMPONENT HERE */}
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: "#0f172a", 
                  borderColor: "#334155", 
                  borderRadius: "0.75rem", 
                  color: "#fff" 
                }}
                itemStyle={{ color: "#fff" }}
                formatter={(value) => [
                  `$${Number(value ?? 0).toLocaleString()}`, 
                  ""
                ]}
              />

              <Legend wrapperStyle={{ paddingTop: "10px" }} />
              <Line
                type="monotone"
                dataKey="Target"
                name="Target"
                stroke="#38bdf8"
                strokeWidth={3}
                dot={{ r: 4, fill: "#38bdf8" }}
                activeDot={{ r: 7 }}
              />
              <Line
                type="monotone"
                dataKey="Actual"
                name="Actual"
                stroke="#16a34a"
                strokeWidth={3}
                dot={{ r: 4, fill: "#16a34a" }}
              />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <div className="w-full h-full bg-slate-900/50 animate-pulse rounded-xl border border-slate-800/50" />
        )}
      </div>
    </div>
  );
}