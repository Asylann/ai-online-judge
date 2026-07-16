import React, { useState, useEffect } from "react";
import Link from "next/link";
import axios from "axios";
import { AdminLayout } from "@/components/AdminLayout";
import { useAuth } from "@/context/AuthContext";
import {
  ShieldAlert,
  CheckCircle2,
  AlertTriangle,
  SplitSquareHorizontal,
  X,
  FileCode,
  RefreshCw,
  Hash,
  Filter
} from "lucide-react";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

interface ProblemRecord {
  id: string;
  title: string;
  difficulty: string;
}

interface SimilarityPair {
  user_a_id: string;
  user_a_username: string;
  submission_a_id: string;
  submission_a_code: string;
  user_b_id: string;
  user_b_username: string;
  submission_b_id: string;
  submission_b_code: string;
  similarity_score: number;
}

export default function AdminGlobalIntegrityPage() {
  const { token, authReady } = useAuth();
  const [problems, setProblems] = useState<ProblemRecord[]>([]);
  const [selectedProblemId, setSelectedProblemId] = useState<string>("");
  const [pairs, setPairs] = useState<SimilarityPair[]>([]);
  const [loadingProblems, setLoadingProblems] = useState<boolean>(true);
  const [loadingPairs, setLoadingPairs] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedPair, setSelectedPair] = useState<SimilarityPair | null>(null);

  useEffect(() => {
    if (authReady) {
      fetchProblems();
    }
  }, [authReady]);

  const fetchProblems = async () => {
    setLoadingProblems(true);
    try {
      const res = await axios.get(`${API_URL}/problems`);
      const list = res.data?.problems || res.data || [];
      setProblems(list);
      if (list.length > 0 && !selectedProblemId) {
        setSelectedProblemId(list[0].id);
        fetchSimilarityPairs(list[0].id);
      }
    } catch (err: any) {
      setError("Failed to load problems list.");
    } finally {
      setLoadingProblems(false);
    }
  };

  const fetchSimilarityPairs = async (problemId: string) => {
    if (!problemId) return;
    setLoadingPairs(true);
    setError(null);
    try {
      const headers: any = {};
      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }
      const res = await axios.get(`${API_URL}/admin/submissions/similarity`, {
        params: { problem_id: problemId },
        headers
      });
      setPairs(res.data?.pairs || []);
    } catch (err: any) {
      setError(err.response?.data?.error || "Failed to compute AST structural similarity.");
    } finally {
      setLoadingPairs(false);
    }
  };

  const handleProblemChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const pId = e.target.value;
    setSelectedProblemId(pId);
    fetchSimilarityPairs(pId);
  };

  return (
    <AdminLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-300 pb-5">
          <div>
            <h1 className="text-2xl font-serif font-bold text-slate-900 flex items-center space-x-3">
              <ShieldAlert className="w-7 h-7 text-amber-800" />
              <span>AST Plagiarism & Integrity Check Registry</span>
            </h1>
            <p className="text-xs font-mono text-slate-500 mt-1">
              Cross-reference gotreesitter structural topology snapshots across all Accepted solutions ($O(M^2)$ strictly per problem)
            </p>
          </div>

          <div className="flex items-center space-x-3">
            <button
              onClick={() => fetchSimilarityPairs(selectedProblemId)}
              disabled={!selectedProblemId || loadingPairs}
              className="inline-flex items-center space-x-2 px-3 py-2 rounded bg-ivory-200 hover:bg-ivory-300 text-slate-800 font-mono text-xs font-bold border border-slate-300 transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loadingPairs ? "animate-spin" : ""}`} />
              <span>Scan Current Problem</span>
            </button>
          </div>
        </div>

        {/* Problem Selector Bar */}
        <div className="p-5 rounded-lg bg-ivory-200 border border-slate-300 shadow-sm mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center space-x-3">
            <Filter className="w-4 h-4 text-slate-600 shrink-0" />
            <span className="font-mono text-xs font-bold text-slate-700 uppercase tracking-wider">
              Target Problem:
            </span>
          </div>
          <select
            value={selectedProblemId}
            onChange={handleProblemChange}
            disabled={loadingProblems}
            className="flex-1 max-w-md px-3 py-2 rounded bg-ivory-100 border border-slate-300 text-slate-900 font-serif font-bold text-sm focus:outline-none focus:ring-2 focus:ring-amber-900/30"
          >
            {problems.map((p) => (
              <option key={p.id} value={p.id}>
                {p.title} ({p.difficulty || "medium"}) - {p.id.slice(0, 8)}...
              </option>
            ))}
          </select>
        </div>

        {/* Table / Results */}
        {loadingPairs ? (
          <div className="p-12 text-center rounded-lg border border-slate-300 bg-ivory-100">
            <div className="w-8 h-8 border-3 border-amber-900 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            <p className="text-sm font-serif font-bold text-slate-900">
              Comparing AST structural frequency distributions...
            </p>
            <p className="text-xs font-mono text-slate-500 mt-1">
              Evaluating loop depths and branching logic independent of variable renamings.
            </p>
          </div>
        ) : error ? (
          <div className="p-5 rounded-lg bg-red-50 border border-red-200 text-red-900 flex items-start space-x-3">
            <AlertTriangle className="w-5 h-5 shrink-0 text-red-600 mt-0.5" />
            <div>
              <h4 className="text-sm font-bold">Similarity Check Error</h4>
              <p className="text-xs font-mono mt-1">{error}</p>
            </div>
          </div>
        ) : pairs.length === 0 ? (
          <div className="p-12 text-center rounded-lg border border-emerald-300 bg-emerald-50/60">
            <CheckCircle2 className="w-10 h-10 text-emerald-600 mx-auto mb-3" />
            <h4 className="text-base font-serif font-bold text-emerald-950">
              No High-Similarity Pairs Detected
            </h4>
            <p className="text-xs font-mono text-emerald-800 max-w-xl mx-auto mt-1 leading-relaxed">
              All accepted submissions for this problem scored below the <span className="font-bold underline">85.0% similarity threshold</span>. Each student solution exhibits distinct structural AST patterns and control flow topology.
            </p>
          </div>
        ) : (
          <div className="border border-slate-300 rounded-lg overflow-hidden bg-ivory-100 shadow-sm">
            <div className="px-5 py-3.5 bg-ivory-200 border-b border-slate-300 flex items-center justify-between">
              <span className="text-xs font-mono font-bold uppercase tracking-wider text-slate-700">
                Flagged High-Similarity Pairs (Threshold &gt; 85%)
              </span>
              <span className="text-xs font-mono text-red-700 font-bold bg-red-100 px-2 py-0.5 rounded border border-red-200">
                {pairs.length} {pairs.length === 1 ? "Pair Detected" : "Pairs Detected"}
              </span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-300 bg-ivory-200/50 text-[11px] font-mono font-bold text-slate-600 uppercase">
                    <th className="py-3 px-5">Student A (Primary Attempt)</th>
                    <th className="py-3 px-5">Student B (Comparison Attempt)</th>
                    <th className="py-3 px-5 text-center">Structural Similarity</th>
                    <th className="py-3 px-5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 text-xs font-mono">
                  {pairs.map((pair, idx) => {
                    const scorePct = Math.round(pair.similarity_score * 100);
                    const isSevere = scorePct >= 95;
                    return (
                      <tr key={idx} className="hover:bg-ivory-200/60 transition-colors">
                        <td className="py-4 px-5">
                          <div className="flex items-center space-x-2.5">
                            <div className="w-8 h-8 rounded-full bg-slate-900 text-ivory-100 flex items-center justify-center font-bold font-serif text-xs">
                              {pair.user_a_username ? pair.user_a_username[0].toUpperCase() : "A"}
                            </div>
                            <div>
                              <div className="font-bold text-slate-900 text-sm">
                                {pair.user_a_username}
                              </div>
                              <div className="text-[10px] text-slate-400 flex items-center space-x-1">
                                <Hash className="w-3 h-3" />
                                <span>Sub: {pair.submission_a_id.slice(0, 8)}...</span>
                              </div>
                            </div>
                          </div>
                        </td>

                        <td className="py-4 px-5">
                          <div className="flex items-center space-x-2.5">
                            <div className="w-8 h-8 rounded-full bg-amber-900 text-ivory-100 flex items-center justify-center font-bold font-serif text-xs">
                              {pair.user_b_username ? pair.user_b_username[0].toUpperCase() : "B"}
                            </div>
                            <div>
                              <div className="font-bold text-slate-900 text-sm">
                                {pair.user_b_username}
                              </div>
                              <div className="text-[10px] text-slate-400 flex items-center space-x-1">
                                <Hash className="w-3 h-3" />
                                <span>Sub: {pair.submission_b_id.slice(0, 8)}...</span>
                              </div>
                            </div>
                          </div>
                        </td>

                        <td className="py-4 px-5 text-center">
                          <span
                            className={`inline-flex items-center px-2.5 py-1 rounded font-bold text-xs border ${
                              isSevere
                                ? "bg-red-100 text-red-900 border-red-300 animate-pulse"
                                : "bg-amber-100 text-amber-900 border-amber-300"
                            }`}
                          >
                            {scorePct}% Structural Match
                          </span>
                        </td>

                        <td className="py-4 px-5 text-right">
                          <button
                            onClick={() => setSelectedPair(pair)}
                            className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded bg-slate-900 hover:bg-slate-800 text-ivory-100 text-xs font-bold transition-colors shadow-sm"
                          >
                            <SplitSquareHorizontal className="w-3.5 h-3.5" />
                            <span>View Side-by-Side</span>
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Side-by-Side Modal */}
        {selectedPair && (
          <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-ivory-100 border border-slate-300 rounded-xl shadow-2xl w-full max-w-6xl max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
              <div className="p-5 bg-ivory-200 border-b border-slate-300 flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="p-2 rounded bg-red-100 text-red-900 font-bold text-xs border border-red-200 font-mono">
                    {Math.round(selectedPair.similarity_score * 100)}% Structural Match
                  </div>
                  <div>
                    <h3 className="font-serif font-bold text-slate-900 text-base">
                      Side-by-Side AST Plagiarism Comparison
                    </h3>
                    <p className="text-xs font-mono text-slate-500">
                      Problem ID: {selectedProblemId} • Comparing loop depths and conditional branches across both submissions
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedPair(null)}
                  className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-300/50 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 divide-y lg:divide-y-0 lg:divide-x divide-slate-300 overflow-y-auto bg-slate-950 text-ivory-100 font-mono text-xs">
                <div className="flex flex-col h-full overflow-hidden">
                  <div className="px-4 py-3 bg-slate-900 border-b border-slate-800 flex items-center justify-between shrink-0">
                    <div className="flex items-center space-x-2">
                      <div className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                      <span className="font-bold text-sm text-ivory-100 font-serif">
                        {selectedPair.user_a_username}
                      </span>
                    </div>
                    <span className="text-[10px] text-slate-400">
                      ID: {selectedPair.submission_a_id}
                    </span>
                  </div>
                  <div className="p-4 overflow-x-auto overflow-y-auto flex-1 leading-relaxed">
                    <pre className="text-ivory-100">
                      {selectedPair.submission_a_code || "// Empty submission code"}
                    </pre>
                  </div>
                </div>

                <div className="flex flex-col h-full overflow-hidden">
                  <div className="px-4 py-3 bg-slate-900 border-b border-slate-800 flex items-center justify-between shrink-0">
                    <div className="flex items-center space-x-2">
                      <div className="w-2.5 h-2.5 rounded-full bg-red-500" />
                      <span className="font-bold text-sm text-ivory-100 font-serif">
                        {selectedPair.user_b_username}
                      </span>
                    </div>
                    <span className="text-[10px] text-slate-400">
                      ID: {selectedPair.submission_b_id}
                    </span>
                  </div>
                  <div className="p-4 overflow-x-auto overflow-y-auto flex-1 leading-relaxed">
                    <pre className="text-ivory-100">
                      {selectedPair.submission_b_code || "// Empty submission code"}
                    </pre>
                  </div>
                </div>
              </div>

              <div className="p-4 bg-ivory-200 border-t border-slate-300 flex items-center justify-between text-xs font-mono">
                <span className="text-slate-600">
                  ⚠️ Note: Even if identifiers (`i`, `j`, `temp`) are renamed, gotreesitter structural topology maps loops (`for/while`) and branching logic accurately.
                </span>
                <button
                  onClick={() => setSelectedPair(null)}
                  className="px-4 py-1.5 rounded bg-slate-900 hover:bg-slate-800 text-ivory-100 font-bold transition-colors shadow-sm"
                >
                  Close Comparison
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
