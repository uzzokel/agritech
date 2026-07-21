"use client";

import { useEffect, useState, useTransition } from "react";
import { getPendingUsers, updateUserStatus } from "@/app/actions/admin-actions";

interface UserRecord {
  id: string;
  uniqueAdminId: string;
  fullName: string;
  email: string;
  state: string;
  lga: string;
  designation: string;
  phoneNumber: string | null;
  status: string;
  createdAt: Date;
}

type StatusType = "APPROVED" | "REJECTED";

export default function AdminDashboardPage() {
  const [users, setUsers] = useState<UserRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();
  const [activeUserId, setActiveUserId] = useState<string | null>(null);

  const loadUsers = async () => {
    setLoading(true);
    setError("");
    const res = await getPendingUsers();
    if (res.success && res.users) {
      setUsers(res.users as UserRecord[]);
    } else {
      setError(res.error || "Failed to fetch pending applications.");
    }
    setLoading(false);
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const handleStatusChange = (userId: string, newStatus: StatusType) => {
    setActiveUserId(userId);
    startTransition(async () => {
      const res = await updateUserStatus(userId, newStatus);
      if (res.success) {
        // Optimistically remove the user from the list once updated
        setUsers((prev) => prev.filter((u) => u.id !== userId));
      } else {
        alert(res.error || "Failed to update status.");
      }
      setActiveUserId(null);
    });
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white px-6 pb-6 pt-24 md:px-12 md:pb-12 md:pt-28">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-6">
          <div>
            <h1 className="text-3xl font-bold text-emerald-400">
              Admin Approval Dashboard
            </h1>
            <p className="text-slate-400 text-sm mt-1">
              Review regional registration requests and manage user authorization status.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <span className="px-3.5 py-1.5 bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-semibold rounded-full">
              {users.length} Pending Application{users.length !== 1 ? "s" : ""}
            </span>
            <button
              onClick={loadUsers}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium rounded-lg border border-slate-700 transition"
            >
              Refresh Table
            </button>
          </div>
        </div>

        {/* Dashboard Content */}
        {loading ? (
          <div className="p-12 text-center text-slate-400 bg-slate-900 border border-slate-800 rounded-2xl">
            Loading applications...
          </div>
        ) : error ? (
          <div className="p-6 bg-red-500/10 border border-red-500/30 text-red-400 rounded-2xl text-center text-sm">
            {error}
          </div>
        ) : users.length === 0 ? (
          <div className="p-12 text-center bg-slate-900 border border-slate-800 rounded-2xl space-y-2">
            <div className="text-3xl">🎉</div>
            <h3 className="text-lg font-semibold text-slate-200">All caught up!</h3>
            <p className="text-slate-400 text-sm">
              There are currently no pending applications requiring review.
            </p>
          </div>
        ) : (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-300">
                <thead className="bg-slate-800/80 text-xs text-slate-400 uppercase tracking-wider border-b border-slate-800">
                  <tr>
                    <th className="px-6 py-4">Applicant</th>
                    <th className="px-6 py-4">Location</th>
                    <th className="px-6 py-4">Designation</th>
                    <th className="px-6 py-4">Assigned AGRI-ID</th>
                    <th className="px-6 py-4">Submitted</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {users.map((user) => {
                    const isProcessingThisUser = isPending && activeUserId === user.id;

                    return (
                      <tr key={user.id} className="hover:bg-slate-800/40 transition">
                        <td className="px-6 py-4">
                          <div className="font-semibold text-white">{user.fullName}</div>
                          <div className="text-xs text-slate-400">{user.email}</div>
                          {user.phoneNumber && (
                            <div className="text-xs text-emerald-400 mt-0.5">
                              {user.phoneNumber}
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-slate-200">{user.state} State</div>
                          <div className="text-xs text-slate-400">{user.lga} LGA</div>
                        </td>
                        <td className="px-6 py-4">
                          <span className="inline-block px-2.5 py-1 bg-slate-800 text-slate-300 text-xs font-medium rounded-md border border-slate-700">
                            {user.designation}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <code className="text-xs bg-slate-950 px-2.5 py-1 rounded border border-slate-800 text-emerald-400 font-mono">
                            {user.uniqueAdminId}
                          </code>
                        </td>
                        <td className="px-6 py-4 text-xs text-slate-400">
                          {new Date(user.createdAt).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          })}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              disabled={isProcessingThisUser}
                              onClick={() => handleStatusChange(user.id, "APPROVED")}
                              className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-xs font-semibold rounded-lg transition"
                            >
                              {isProcessingThisUser ? "Approving..." : "Approve"}
                            </button>
                            <button
                              disabled={isProcessingThisUser}
                              onClick={() => handleStatusChange(user.id, "REJECTED")}
                              className="px-3.5 py-1.5 bg-rose-500/10 hover:bg-rose-600 border border-rose-500/30 hover:border-transparent text-rose-300 hover:text-white disabled:opacity-50 text-xs font-semibold rounded-lg transition"
                            >
                              {isProcessingThisUser ? "Rejecting..." : "Reject"}
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}