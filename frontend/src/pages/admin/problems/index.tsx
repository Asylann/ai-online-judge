import React, { useState, useEffect } from "react";
import Link from "next/link";
import axios from "axios";
import { AdminLayout } from "@/components/AdminLayout";
import { PlusCircle, Trash2, Edit3, FileCode, RefreshCw, AlertCircle, Clock, Cpu, ShieldAlert } from "lucide-react";
import { useAuth } from "@/context/AuthContext";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

interface ProblemRecord {
  id: string;
  title: string;
  description: string;
  difficulty: string;
  time_limit_ms: number;
  memory_limit_kb: number;
  ast_complexity_score?: number;
  difficulty_score?: number;
  test_cases?: {
    id?: string;
    stdin: string;
    expected_output: string;
    difficulty_rank: number;
    is_sample?: boolean;
  }[];
  created_at: string;
}

export default function AdminProblemsIndexPage() {
  const { authReady } = useAuth();
  const [problems, setProblems] = useState<ProblemRecord[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const fetchProblems = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await axios.get(`${API_URL}/problems`);
      setProblems(res.data?.problems || res.data || []);
    } catch (err: any) {
      setError(err.response?.data?.error || "Failed to load problems from API Gateway.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (authReady) {
      fetchProblems();
    }
  }, [authReady]);

  const handleDelete = async (id: string, title: string) => {
    if (!window.confirm(`Delete problem '${title}' and its 10 test cases? All associated student submissions will also be deleted.`)) {
      return;
    }

    setDeletingId(id);
    try {
      await axios.delete(`${API_URL}/admin/problems/${id}`);
      setProblems((prev) => prev.filter((p) => p.id !== id));
    } catch (err: any) {
      alert(err.response?.data?.error || "Failed to delete problem.");
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <AdminLayout
      title="Problem Library"
      subtitle="Curate algorithmic challenges, configure Judge0 resource limits, and generate multi-test evaluation suites."
      action={
        <div className="flex items-center space-x-3">
          <button
            onClick={fetchProblems}
            disabled={loading}
            className="flex items-center space-x-2 text-xs font-mono text-slate-700 bg-ivory-200 hover:bg-ivory-300 border border-slate-900/10 px-3 py-2 rounded transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
            <span>Refresh</span>
          </button>
          <Link
            href="/admin/problems/new"
            className="flex items-center space-x-2 text-xs font-semibold bg-slate-900 hover:bg-slate-800 text-ivory-100 px-4 py-2 rounded-md transition-all duration-200 hover:scale-[1.02] shadow-sm"
          >
            <PlusCircle className="w-4 h-4 text-amber-400" />
            <span>Create New Problem</span>
          </Link>
        </div>
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
                <th className="py-3 px-5 font-semibold">Title & ID</th>
                <th className="py-3 px-5 font-semibold">Difficulty</th>
                <th className="py-3 px-5 font-semibold">Limits (Time / RAM)</th>
                <th className="py-3 px-5 font-semibold">AST Complexity</th>
                <th className="py-3 px-5 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-900/5 text-sm">
              {loading ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-slate-500 font-mono text-xs">
                    Loading problem repository...
                  </td>
                </tr>
              ) : problems.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-slate-500 font-mono text-xs">
                    No algorithmic problems defined yet. Click "Create New Problem" to start setting up tasks.
                  </td>
                </tr>
              ) : (
                problems.map((p) => {
                  const diffColor =
                    p.difficulty === "easy"
                      ? "bg-emerald-900/10 text-emerald-800 border-emerald-900/20"
                      : p.difficulty === "medium"
                      ? "bg-amber-900/10 text-amber-800 border-amber-900/20"
                      : "bg-red-900/10 text-red-800 border-red-900/20";

                  const isExpanded = expandedId === p.id;
                  const tcCount = p.test_cases?.length || 10;

                  return (
                    <React.Fragment key={p.id}>
                      <tr className="hover:bg-ivory-200/60 transition-colors group">
                        <td className="py-3.5 px-5">
                          <div className="flex items-start space-x-3">
                            <div className="w-8 h-8 rounded bg-slate-900/5 text-slate-700 flex items-center justify-center shrink-0 mt-0.5 font-mono text-xs font-bold">
                              <FileCode className="w-4 h-4 text-slate-600" />
                            </div>
                            <div>
                              <Link
                                href={`/problems/${p.id}`}
                                className="font-serif font-bold text-slate-900 hover:text-amber-900 transition-colors block leading-tight"
                              >
                                {p.title}
                              </Link>
                              <span className="text-[10px] font-mono text-slate-400 block truncate max-w-[180px]">
                                {p.id}
                              </span>
                            </div>
                          </div>
                        </td>
                        <td className="py-3.5 px-5">
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-mono uppercase font-semibold border ${diffColor}`}
                          >
                            {p.difficulty || "medium"}
                          </span>
                        </td>
                        <td className="py-3.5 px-5 text-xs font-mono text-slate-600">
                          <div className="flex items-center space-x-4">
                            <span className="flex items-center space-x-1">
                              <Clock className="w-3.5 h-3.5 text-slate-400" />
                              <span>{p.time_limit_ms || 2000} ms</span>
                            </span>
                            <span className="flex items-center space-x-1">
                              <Cpu className="w-3.5 h-3.5 text-slate-400" />
                              <span>{((p.memory_limit_kb || 128000) / 1024).toFixed(0)} MB</span>
                            </span>
                            <button
                                onClick={() => setExpandedId(isExpanded ? null : p.id)}
                                className="inline-flex items-center space-x-1 px-2 py-0.5 rounded bg-amber-900/10 hover:bg-amber-900/20 text-amber-900 font-bold border border-amber-900/30 transition-colors"
                              >
                                <span>🧪 {tcCount} Cases</span>
                                <span className="text-[10px]">{isExpanded ? "▲" : "▼"}</span>
                              </button>
                          </div>
                        </td>
                        <td className="py-3.5 px-5 text-xs font-mono">
                          <span className="px-2 py-1 rounded bg-slate-900/5 text-slate-800 font-semibold">
                            {(p.ast_complexity_score || p.difficulty_score || 2.5).toFixed(2)}
                          </span>
                        </td>
                        <td className="py-3.5 px-5 text-right">
                          <div className="flex items-center justify-end space-x-2">
                            <Link
                              href={`/admin/problems/${p.id}`}
                              title="AST Integrity Check & Plagiarism Detection"
                              className="p-1.5 rounded text-amber-800 hover:text-amber-950 hover:bg-amber-900/10 transition-colors"
                            >
                              <ShieldAlert className="w-4 h-4" />
                            </Link>
                            <Link
                              href={`/admin/problems/new?id=${p.id}`}
                              title="Edit Problem"
                              className="p-1.5 rounded text-slate-400 hover:text-slate-900 hover:bg-slate-900/5 transition-colors"
                            >
                              <Edit3 className="w-4 h-4" />
                            </Link>
                            <button
                              onClick={() => handleDelete(p.id, p.title)}
                              disabled={deletingId === p.id}
                              title="Delete Problem"
                              className="p-1.5 rounded text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                      {isExpanded && (
                        <tr className="bg-ivory-200/60">
                          <td colSpan={5} className="py-4 px-6 border-t border-slate-900/5">
                            <div className="space-y-3">
                              <h4 className="text-xs font-mono font-bold text-slate-800 uppercase tracking-wider">Evaluation Suite</h4>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-60 overflow-y-auto p-1">
                                {(p.test_cases || []).map((tc, idx) => (
                                  <div key={idx} className="p-2.5 rounded bg-white border border-slate-900/10 text-xs font-mono space-y-1">
                                    <div className="flex items-center justify-between text-slate-500 font-bold border-b border-slate-900/5 pb-1 mb-1">
                                      <span>Rank #{tc.difficulty_rank || idx + 1}</span>
                                    </div>
                                    <div className="grid grid-cols-2 gap-2">
                                      <div>
                                        <span className="text-[10px] text-slate-400 block uppercase">Stdin</span>
                                        <pre className="bg-slate-900/5 p-1 rounded text-slate-800 truncate max-h-12 overflow-hidden">{tc.stdin}</pre>
                                      </div>
                                      <div>
                                        <span className="text-[10px] text-slate-400 block uppercase">Expected</span>
                                        <pre className="bg-slate-900/5 p-1 rounded text-slate-800 truncate max-h-12 overflow-hidden">{tc.expected_output}</pre>
                                      </div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
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
