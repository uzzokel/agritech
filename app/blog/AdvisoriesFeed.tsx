"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { 
  askAdvisoryQuestion, 
  addAgentReplyToQuery, 
  deleteAdvisoryQuery,
  postAgriAlert
} from "@/app/actions/advisory-actions";

export default function AdvisoriesFeed({ initialAlerts = [], initialQueries = [] }: any) {
  const [activeTab, setActiveTab] = useState<"feed" | "ask">("feed");
  const [isPending, startTransition] = useTransition();
  const [statusMsg, setStatusMsg] = useState("");
  const [alertStatusMsg, setAlertStatusMsg] = useState("");
  const [activeReplyId, setActiveReplyId] = useState<string | null>(null);
  const router = useRouter();

  const handleAskSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);

    startTransition(async () => {
      const res = await askAdvisoryQuestion(formData);
      if (res.success) {
        setStatusMsg("Your query was submitted! Live research summary loaded below.");
        (e.target as HTMLFormElement).reset();
        router.refresh();
      } else {
        setStatusMsg(res.error || "Something went wrong.");
      }
    });
  };

  const handleAlertSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const formData = new FormData(form);

    const alertData = {
      title: formData.get("title") as string,
      severity: formData.get("severity") as string || "INFO",
      region: formData.get("region") as string || "National",
      message: formData.get("message") as string,
    };

    startTransition(async () => {
      const res = await postAgriAlert(alertData);
      if (res.success) {
        setAlertStatusMsg("Agricultural alert posted successfully!");
        form.reset();
        router.refresh();
      } else {
        setAlertStatusMsg(res.error || "Failed to post alert.");
      }
    });
  };

  const handleAgentReplySubmit = (e: React.FormEvent<HTMLFormElement>, queryId: string) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    formData.append("queryId", queryId);

    startTransition(async () => {
      const res = await addAgentReplyToQuery(formData);
      if (res.success) {
        setActiveReplyId(null);
        router.refresh();
      } else {
        alert(res.error || "Failed to post agent reply.");
      }
    });
  };

  const handleDelete = (queryId: string) => {
    if (!confirm("Are you sure you want to delete this advisory query?")) return;

    startTransition(async () => {
      const res = await deleteAdvisoryQuery(queryId);
      if (res.success) {
        router.refresh();
      } else {
        alert(res.error || "Failed to delete query.");
      }
    });
  };

  return (
    <div className="max-w-5xl mx-auto p-4 space-y-6 text-slate-100">
      {/* Navigation Tabs */}
      <div className="flex border-b border-slate-800 bg-[#0f172a] p-1.5 rounded-t-xl">
        <button
          onClick={() => setActiveTab("feed")}
          className={`py-2.5 px-5 font-medium text-sm rounded-lg transition-all border-b-2 ${
            activeTab === "feed"
              ? "border-[#16a34a] text-[#16a34a] bg-[#16a34a]/10 font-semibold"
              : "border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-800/50"
          }`}
        >
          📢 Daily Alerts & Best Practices
        </button>
        <button
          onClick={() => setActiveTab("ask")}
          className={`py-2.5 px-5 font-medium text-sm rounded-lg transition-all border-b-2 ${
            activeTab === "ask"
              ? "border-[#16a34a] text-[#16a34a] bg-[#16a34a]/10 font-semibold"
              : "border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-800/50"
          }`}
        >
          🤖 Ask AI / Expert Agent
        </button>
      </div>

      {/* Tab 1: Daily Alerts & Best Practices Feed & Admin Post Form */}
      {activeTab === "feed" && (
        <div className="space-y-6">
          {/* Admin Post Alert Form */}
          <form 
            onSubmit={handleAlertSubmit} 
            className="p-6 bg-[#0f172a] border border-slate-800 rounded-xl shadow-lg space-y-4"
          >
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-bold text-slate-100">📢 Post Regional Alert or Best Practice</h2>
              <span className="text-xs bg-[#16a34a]/15 text-[#16a34a] px-2.5 py-1 rounded-full border border-[#16a34a]/30 font-semibold">
                Admin Control
              </span>
            </div>
            
            {alertStatusMsg && (
              <div className="p-3 bg-[#16a34a]/15 border border-[#16a34a]/40 text-[#16a34a] text-sm font-semibold rounded-lg">
                {alertStatusMsg}
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <input
                name="title"
                required
                placeholder="Alert Title (e.g. Pest Outbreak Warning)"
                className="md:col-span-2 p-3 bg-slate-950 border border-slate-800 rounded-lg text-slate-100 placeholder:text-slate-500 text-sm focus:outline-none focus:border-[#16a34a] focus:ring-1 focus:ring-[#16a34a] transition-all"
              />
              <select
                name="severity"
                defaultValue="INFO"
                className="p-3 bg-slate-950 border border-slate-800 rounded-lg text-slate-100 text-sm focus:outline-none focus:border-[#16a34a] focus:ring-1 focus:ring-[#16a34a] transition-all"
              >
                <option value="INFO">Severity: Info / Best Practice</option>
                <option value="WARNING">Severity: Warning</option>
                <option value="CRITICAL">Severity: Critical Alert</option>
              </select>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <input
                name="region"
                defaultValue="Nigeria"
                placeholder="Target Region (e.g. Northern Region, Oyo State)"
                className="p-3 bg-slate-950 border border-slate-800 rounded-lg text-slate-100 placeholder:text-slate-500 text-sm focus:outline-none focus:border-[#16a34a] focus:ring-1 focus:ring-[#16a34a] transition-all"
              />
            </div>

            <textarea
              name="message"
              required
              rows={3}
              placeholder="Provide full details, preventive actions, or farming guidelines..."
              className="p-3 bg-slate-950 border border-slate-800 rounded-lg text-slate-100 placeholder:text-slate-500 text-sm w-full focus:outline-none focus:border-[#16a34a] focus:ring-1 focus:ring-[#16a34a] transition-all resize-none"
            />

            <button
              type="submit"
              disabled={isPending}
              className="px-6 py-2.5 bg-[#16a34a] hover:bg-[#15803d] text-white font-semibold text-sm rounded-lg shadow-md transition-all disabled:opacity-50"
            >
              {isPending ? "Posting Alert..." : "Publish Alert & Update Feed"}
            </button>
          </form>

          {/* Feed List */}
          <div className="space-y-4 pt-2">
            <h2 className="text-xl font-bold text-slate-100">Latest Updates & Guidance</h2>
            
            <div className="grid gap-4 md:grid-cols-2">
              {initialAlerts.length === 0 ? (
                <div className="col-span-2 p-8 text-center bg-[#0f172a] border border-slate-800 rounded-xl text-slate-400">
                  No active alerts right now. Check back soon.
                </div>
              ) : (
                initialAlerts.map((alert: any) => (
                  <div 
                    key={alert.id} 
                    className="p-5 bg-[#0f172a] border border-slate-800/80 rounded-xl shadow-md hover:border-[#16a34a]/40 transition-all space-y-3 flex flex-col justify-between"
                  >
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-xs font-bold px-2.5 py-1 bg-[#16a34a]/15 text-[#16a34a] border border-[#16a34a]/30 rounded-full">
                          {alert.region || "National"} • {alert.severity || "INFO"}
                        </span>
                        <span className="text-xs text-slate-400 font-mono">
                          {new Date(alert.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                      <h3 className="font-bold text-slate-100 text-base">{alert.title}</h3>
                      <p className="text-sm text-slate-300 leading-relaxed">{alert.message || alert.content}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Ask AI / Agent Form & Q&A Feed */}
      {activeTab === "ask" && (
        <div className="space-y-6">
          {/* Question Form */}
          <form 
            onSubmit={handleAskSubmit} 
            className="p-6 bg-[#0f172a] border border-slate-800 rounded-xl shadow-lg space-y-4"
          >
            <h2 className="text-lg font-bold text-slate-100">Seek Advisory / Ask a Question</h2>
            
            {statusMsg && (
              <div className="p-3 bg-[#16a34a]/15 border border-[#16a34a]/40 text-[#16a34a] text-sm font-semibold rounded-lg">
                {statusMsg}
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <input
                name="cropOrTopic"
                placeholder="Crop or Topic (e.g. Maize, Soil Test)"
                className="p-3 bg-slate-950 border border-slate-800 rounded-lg text-slate-100 placeholder:text-slate-500 text-sm focus:outline-none focus:border-[#16a34a] focus:ring-1 focus:ring-[#16a34a] transition-all"
              />
              <input
                name="location"
                placeholder="Your Location / Region"
                className="p-3 bg-slate-950 border border-slate-800 rounded-lg text-slate-100 placeholder:text-slate-500 text-sm focus:outline-none focus:border-[#16a34a] focus:ring-1 focus:ring-[#16a34a] transition-all"
              />
            </div>

            <textarea
              name="question"
              required
              rows={3}
              placeholder="Describe the issue or question you have..."
              className="p-3 bg-slate-950 border border-slate-800 rounded-lg text-slate-100 placeholder:text-slate-500 text-sm w-full focus:outline-none focus:border-[#16a34a] focus:ring-1 focus:ring-[#16a34a] transition-all resize-none"
            />

            <button
              type="submit"
              disabled={isPending}
              className="px-6 py-2.5 bg-[#16a34a] hover:bg-[#15803d] text-white font-semibold text-sm rounded-lg shadow-md transition-all disabled:opacity-50"
            >
              {isPending ? "Searching Web & Saving..." : "Get Advisory Response"}
            </button>
          </form>

          {/* Recent Q&A Feed */}
          <div className="space-y-4">
            <h3 className="text-md font-bold text-slate-200">Community Questions & Solutions</h3>
            
            {initialQueries.length === 0 ? (
              <div className="p-8 text-center bg-[#0f172a] border border-slate-800 rounded-xl text-slate-400">
                No advisory questions asked yet.
              </div>
            ) : (
              initialQueries.map((q: any) => (
                <div key={q.id} className="p-5 bg-[#0f172a] border border-slate-800 rounded-xl space-y-3 shadow-md relative group">
                  {/* Admin Delete Button */}
                  <div className="absolute top-4 right-4 flex items-center space-x-2">
                    <button
                      onClick={() => handleDelete(q.id)}
                      disabled={isPending}
                      className="px-2.5 py-1 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 rounded text-xs font-semibold transition-all"
                      title="Admin: Delete irrelevant thread"
                    >
                      🗑️ Delete
                    </button>
                  </div>

                  <p className="font-semibold text-slate-100 text-sm pr-20">
                    <span className="text-[#16a34a] font-bold mr-2">Q:</span>
                    {q.question}
                  </p>
                  
                  {/* Render AI / Web Search Answer */}
                  {q.aiAnswer && (
                    <div className="p-3 bg-slate-950 text-slate-200 border-l-4 border-[#16a34a] text-sm rounded-r-lg space-y-1">
                      <strong className="text-[#16a34a] block text-xs uppercase tracking-wider">
                        🤖 AI / Web Search Answer
                      </strong>
                      <p className="text-slate-300">{q.aiAnswer}</p>
                    </div>
                  )}

                  {/* Render Agent / Expert Reply if present */}
                  {(q.agentAnswer || q.expertReply) && (
                    <div className="p-3 bg-slate-950 text-slate-200 border-l-4 border-sky-500 text-sm rounded-r-lg space-y-1">
                      <strong className="text-sky-400 block text-xs uppercase tracking-wider">
                        👨‍🌾 Field Agent / Expert Reply ({q.answeredBy || "Verified Expert"})
                      </strong>
                      <p className="text-slate-300">{q.agentAnswer || q.expertReply}</p>
                    </div>
                  )}

                  {/* Human Agent Contribution Toggle & Form */}
                  <div className="pt-2">
                    {activeReplyId !== q.id ? (
                      <button
                        onClick={() => setActiveReplyId(q.id)}
                        className="text-xs text-sky-400 hover:text-sky-300 font-medium underline"
                      >
                        + Add Human Agent Contribution
                      </button>
                    ) : (
                      <form
                        onSubmit={(e) => handleAgentReplySubmit(e, q.id)}
                        className="mt-3 p-3 bg-slate-950 border border-slate-800 rounded-lg space-y-3"
                      >
                        <div className="text-xs font-bold text-sky-400 uppercase tracking-wider">
                          Contribute Field Expert Insight
                        </div>
                        <input
                          name="answeredBy"
                          required
                          placeholder="Agent Name & Title (e.g. Dr. Okafor, Agronomist)"
                          className="w-full p-2 bg-slate-900 border border-slate-800 rounded text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-sky-500"
                        />
                        <textarea
                          name="agentAnswer"
                          required
                          rows={2}
                          placeholder="Provide local field insights or correct AI findings..."
                          className="w-full p-2 bg-slate-900 border border-slate-800 rounded text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-sky-500 resize-none"
                        />
                        <div className="flex space-x-2">
                          <button
                            type="submit"
                            disabled={isPending}
                            className="px-3 py-1 bg-sky-600 hover:bg-sky-500 text-white text-xs font-semibold rounded transition-all"
                          >
                            {isPending ? "Posting..." : "Submit Expert Reply"}
                          </button>
                          <button
                            type="button"
                            onClick={() => setActiveReplyId(null)}
                            className="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded transition-all"
                          >
                            Cancel
                          </button>
                        </div>
                      </form>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}