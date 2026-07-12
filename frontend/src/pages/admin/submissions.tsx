import React, { useState, useEffect } from "react";
import axios from "axios";
import Link from "next/link";
import { AdminLayout } from "@/components/AdminLayout";
import { Trash2, RefreshCw, AlertCircle, FileCode, User as UserIcon } from "lucide-react";
import { useAuth } from "@/context/AuthContext";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

interface SubmissionRecord {
  id: string;
  user_id: string;
  problem_id: string;
  problem_title?: string;
  language: string;
  status: string;
  tests_passed?: number;
  tests_total?: number;
  execution_time_ms?: number;
  memory_kb?: number;
  created_at: string;
}

export default function AdminSubmissionsPage() {
  const { authReady } = useAuth();
  const [submissions, setSubmissions] = useState<SubmissionRecord[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const fetchSubmissions = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await axios.get(`${API_URL}/submissions`);
      setSubmissions(res.data?.submissions || []);
    } catch (err: any) {
      setError(err.response?.data?.error || "Failed to load submissions.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (authReady) {
      fetchSubmissions();
    }
  }, [authReady]);

  const handleDelete = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this submission record?")) {
      return;
    }

    setDeletingId(id);
    try {
      await axios.delete(`${API_URL}/admin/submissions/${id}`);
      setSubmissions((prev) => prev.filter((s) => s.id !== id));
    } catch (err: any) {
      alert(err.response?.data?.error || "Failed to delete submission.");
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <AdminLayout
      title="Submission Logs & EDM Auditing"
      subtitle="Monitor all code execution attempts across the Judge0 sandbox containers."
      action={
        <button
          onClick={fetchSubmissions}
          disabled={loading}
          className="flex items-center space-x-2 text-xs font-mono text-slate-700 bg-ivory-200 hover:bg-ivory-300 border border-slate-900/10 px-3 py-1.5 rounded transition-colors"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
          <span>Refresh</span>
        </button>
      }
    >
      {error && (
        <div className="mb-6 p-4 bg-amber-50 border border-amber-300 rounded-md flex items-start space-x-3 text-sm text-amber-900">
          <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div>{error}</div>
        </div>
      )}

      <div className="bg-ivory-200/40 border border-slate-900/10 rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-900/10 bg-ivory-300/40 text-[11px] font-mono uppercase tracking-wider text-slate-600">
                <th className="py-3 px-5 font-semibold">Submission ID & Problem</th>
                <th className="py-3 px-5 font-semibold">Language</th>
                <th className="py-3 px-5 font-semibold">Verdict</th>
                <th className="py-3 px-5 font-semibold">Tests Passed</th>
                <th className="py-3 px-5 font-semibold">Metrics</th>
                <th className="py-3 px-5 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-900/5 text-sm">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-500 font-mono text-xs">
                    Loading submission records...
                  </td>
                </tr>
              ) : submissions.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-500 font-mono text-xs">
                    No submissions recorded yet.
                  </td>
                </tr>
              ) : (
                submissions.map((s) => {
                  const statusBg =
                    s.status === "Accepted"
                      ? "bg-emerald-900/10 text-emerald-800 border-emerald-900/20"
                      : s.status === "Pending" || s.status === "Executing"
                      ? "bg-amber-900/10 text-amber-800 border-amber-900/20"
                      : "bg-red-900/10 text-red-800 border-red-900/20";

                  return (
                    <tr key={s.id} className="hover:bg-ivory-200/60 transition-colors">
                      <td className="py-3.5 px-5">
                        <div className="font-semibold text-slate-900">
                          {s.problem_title || "Algorithmic Task"}
                        </div>
                        <span className="text-[10px] font-mono text-slate-400 block truncate max-w-[160px]">
                          {s.id}
                        </span>
                      </td>
                      <td className="py-3.5 px-5 text-xs font-mono text-slate-700">
                        {s.language}
                      </td>
                      <td className="py-3.5 px-5">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-mono uppercase font-semibold border ${statusBg}`}>
                          {s.status}
                        </span>
                      </td>
                      <td className="py-3.5 px-5 text-xs font-mono text-slate-700">
                        {s.tests_total ? `${s.tests_passed || 0}/${s.tests_total}` : "-"}
                      </td>
                      <td className="py-3.5 px-5 text-xs font-mono text-slate-600">
                        {s.execution_time_ms ? `${s.execution_time_ms}ms / ${s.memory_kb ? Math.round(s.memory_kb / 1024) + "MB" : "-"}` : "-"}
                      </td>
                      <td className="py-3.5 px-5 text-right">
                        <button
                          onClick={() => handleDelete(s.id)}
                          disabled={deletingId === s.id}
                          title="Delete submission record"
                          className="p-1.5 rounded text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
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
    </AdminLayout>
  );
}
