// app/features/analytics/page.tsx
import PerformanceChart from "../PerformanceChart";

export default function AnalyticsPage() {
  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <h1 className="text-2xl font-bold text-white">Project Performance Dashboard</h1>
      <PerformanceChart />
    </div>
  );
}