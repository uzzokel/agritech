"use client";

import { useState, useEffect } from "react";
import { getPerformanceMonitoringData, createOrUpdateActual } from "@/app/actions/performance";
import { Loader2, TrendingUp, ShieldAlert, CheckCircle2 } from "lucide-react";

export default function PerformanceMonitoringPage() {
  const [data, setData] = useState<any[]>([]);
  const [fetching, setFetching] = useState(true);
  const [savingId, setSavingId] = useState<string | null>(null);

  // Local state for actual inputs
  const [inputs, setInputs] = useState<{ [key: string]: { actual: string; remarks: string } }>({});

  useEffect(() => {
    loadMonitoringData();
  }, []);

  const loadMonitoringData = async () => {
    setFetching(true);
    const res = await getPerformanceMonitoringData();
    if (res.success && res.data) {
      setData(res.data);
      // Pre-fill inputs with latest actuals
      const initial: any = {};
      res.data.forEach((item: any) => {
        const latest = item.actuals?.[0];
        initial[item.id] = {
          actual: latest ? String(latest.actualValue) : "",
          remarks: latest ? latest.remarks || "" : "",
        };
      });
      setInputs(initial);
    }
    setFetching(false);
  };

  const calculateMetrics = (targetVal: number, baselineVal: number, actualInput: string) => {
    const actual = parseFloat(actualInput) || 0;
    const denominator = targetVal - baselineVal;

    // Metric Aggregation Progress %
    const progressPct = denominator === 0 ? 0 : ((actual - baselineVal) / denominator) * 100;
    const roundedProgress = Math.round(progressPct);

    // Variance
    const variance = Math.abs(targetVal - roundedProgress);

    // RAG Flag Logic
    let flag: "GREEN" | "AMBER" | "RED" = "GREEN";
    if (variance > 20 && variance < 50) {
      flag = "AMBER";
    } else if (variance >= 50) {
      flag = "RED";
    }

    return { actual, roundedProgress, variance, flag };
  };

  const handleSaveActual = async (targetId: string) => {
    const entry = inputs[targetId];
    if (!entry || entry.actual === "") return;

    setSavingId(targetId);
    await createOrUpdateActual({
      targetId,
      actualValue: parseFloat(entry.actual) || 0,
      remarks: entry.remarks,
    });
    setSavingId(null);
    loadMonitoringData();
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <TrendingUp className="text-[#16a34a] w-7 h-7" /> Performance Monitoring & Variance (Table 2)
        </h1>
        <p className="text-sm text-slate-400 mt-1">
          Dynamic progress aggregation, variance analysis, and automated RAG performance flags linked from Table 1.
        </p>
      </div>

      <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-xl">
        {fetching ? (
          <div className="py-8 text-center text-slate-500 text-xs">Loading linked performance data...</div>
        ) : data.length === 0 ? (
          <div className="py-8 text-center text-slate-500 text-xs">
            No targets defined yet. Please add targets in Table 1 (Performance Planning) first.
          </div>
        ) : (
          <div className="overflow-x-auto max-h-[550px] overflow-y-auto rounded-lg">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="sticky top-0 bg-slate-900 border-b border-slate-800 text-slate-400 uppercase z-10">
                <tr>
                  <th className="pb-3 px-2">Component & Target (KPI)</th>
                  <th className="pb-3 px-2">Timeframe</th>
                  <th className="pb-3 px-2">Baseline</th>
                  <th className="pb-3 px-2">Target</th>
                  <th className="pb-3 px-2 w-28">Actual (Input)</th>
                  <th className="pb-3 px-2">Progress %</th>
                  <th className="pb-3 px-2">Variance</th>
                  <th className="pb-3 px-2">Flag</th>
                  <th className="pb-3 px-2">Remarks</th>
                  <th className="pb-3 px-2">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/50">
                {data.map((item) => {
                  const actualVal = inputs[item.id]?.actual || "";
                  const remarksVal = inputs[item.id]?.remarks || "";
                  const { roundedProgress, variance, flag } = calculateMetrics(
                    item.targetPercentage,
                    item.baselineValue,
                    actualVal
                  );

                  return (
                    <tr key={item.id} className="hover:bg-slate-800/30">
                      <td className="py-3 px-2">
                        <div className="font-semibold text-white">{item.componentName}</div>
                        <div className="text-[11px] text-slate-400 line-clamp-2 max-w-xs">{item.expectedOutcomes}</div>
                      </td>
                      <td className="py-3 px-2 text-slate-400">{item.timeFrame}</td>
                      <td className="py-3 px-2 font-mono">{item.baselineValue}</td>
                      <td className="py-3 px-2 font-mono text-emerald-400">{item.targetPercentage}%</td>
                      
                      {/* Actual Input */}
                      <td className="py-3 px-2">
                        <input
                          type="number"
                          step="any"
                          value={actualVal}
                          onChange={(e) =>
                            setInputs({
                              ...inputs,
                              [item.id]: { ...inputs[item.id], actual: e.target.value },
                            })
                          }
                          placeholder="0"
                          className="w-20 px-2 py-1.5 bg-slate-950 border border-slate-800 rounded text-emerald-400 font-bold focus:outline-none focus:border-[#16a34a]"
                        />
                      </td>

                      {/* Computed Progress % */}
                      <td className="py-3 px-2 font-mono font-bold text-white">
                        {roundedProgress}%
                      </td>

                      {/* Variance */}
                      <td className="py-3 px-2 font-mono text-slate-300">
                        {variance}%
                      </td>

                      {/* Dynamic RAG Flag Pill */}
                      <td className="py-3 px-2">
                        {flag === "GREEN" && (
                          <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                            Green (&le;20%)
                          </span>
                        )}
                        {flag === "AMBER" && (
                          <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20">
                            Amber (&gt;20%)
                          </span>
                        )}
                        {flag === "RED" && (
                          <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-red-500/10 text-red-400 border border-red-500/20">
                            Red (&ge;50%)
                          </span>
                        )}
                      </td>

                      {/* Remarks Narration Input */}
                      <td className="py-3 px-2">
                        <input
                          type="text"
                          value={remarksVal}
                          onChange={(e) =>
                            setInputs({
                              ...inputs,
                              [item.id]: { ...inputs[item.id], remarks: e.target.value },
                            })
                          }
                          placeholder="Add remark..."
                          className="w-32 px-2 py-1.5 bg-slate-950 border border-slate-800 rounded text-xs focus:outline-none focus:border-[#16a34a]"
                        />
                      </td>

                      {/* Save Button */}
                      <td className="py-3 px-2">
                        <button
                          onClick={() => handleSaveActual(item.id)}
                          disabled={savingId === item.id || !actualVal}
                          className="px-3 py-1.5 bg-[#16a34a] hover:bg-[#15803d] disabled:opacity-40 text-white rounded text-[11px] font-semibold cursor-pointer transition flex items-center gap-1"
                        >
                          {savingId === item.id ? <Loader2 className="w-3 h-3 animate-spin" /> : "Save"}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}