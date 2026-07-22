export default function DashboardPage() {
  return (
    <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center p-6">
      <div className="bg-slate-900 border border-slate-800 p-8 rounded-2xl max-w-lg text-center">
        <h1 className="text-3xl font-bold text-emerald-400 mb-2">🎉 Welcome to AgriTech Dashboard</h1>
        <p className="text-slate-400 text-sm mb-6">
          Authentication successful! Your AGRI session cookie is active.
        </p>
      </div>
    </div>
  );
}