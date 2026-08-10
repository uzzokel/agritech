// app/features/analysis/PerformanceLineGraph.tsx
"use client";

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
  if (!data || data.length === 0) {
    return (
      <div className="bg-slate-900 border border-slate-800 p-8 rounded-2xl shadow-xl h-80 flex flex-col items-center justify-center text-center">
        <p className="text-slate-500 text-sm">No data available for {title.toLowerCase()}.</p>
      </div>
    );
  }

  return (
    <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-xl">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-lg font-semibold text-white flex items-center gap-2">
          {icon} {title}
        </h2>
      </div>

      <div className="w-full h-80">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 10, right: 30, left: 10, bottom: 20 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
            
            {/* X Axis */}
            <XAxis 
              dataKey="category" 
              stroke="#94a3b8" 
              fontSize={11} 
              tickLine={false} 
              interval={0}
              angle={-10}
              textAnchor="end"
            />
            
            {/* Y Axis */}
            <YAxis 
              stroke="#94a3b8" 
              fontSize={11} 
              tickLine={false} 
              tickFormatter={(value) => `$${value >= 1000 ? `${value / 1000}k` : value}`}
            />
            
            <Tooltip 
              contentStyle={{ backgroundColor: "#0f172a", borderColor: "#334155", borderRadius: "0.75rem", color: "#fff" }}
              itemStyle={{ color: "#fff" }}
              formatter={(value: any) => [`$${Number(value).toLocaleString()}`, ""]}
            />
            
            <Legend wrapperStyle={{ paddingTop: "10px" }} />
            
            {/* Target Line */}
            <Line 
              type="monotone" 
              dataKey="Target" 
              name="Target"
              stroke="#38bdf8" 
              strokeWidth={3} 
              dot={{ r: 4, fill: "#38bdf8" }} 
              activeDot={{ r: 7 }} 
            />
            
            {/* Actual Disbursed Line */}
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
      </div>
    </div>
  );
}