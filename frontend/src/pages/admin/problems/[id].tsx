import React, { useState, useEffect } from "react";
import { useRouter } from "next/router";
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
  Code2,
  ArrowLeft,
  RefreshCw,
  User,
  Hash,
  Clock,
  Cpu,
  Layers
} from "lucide-react";
import { ProblemDescriptionRenderer } from "@/components/ProblemDescriptionRenderer";

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
  stdin?: string;
  expected_output?: string;
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

export default function AdminProblemWorkspacePage() {
  const router = useRouter();
  const { id } = router.query;
  const { token, authReady } = useAuth();

  const [problem, setProblem] = useState<ProblemRecord | null>(null);
  const [pairs, setPairs] = useState<SimilarityPair[]>([]);
  const [loadingProblem, setLoadingProblem] = useState<boolean>(true);
  const [loadingPairs, setLoadingPairs] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"integrity" | "overview">("integrity");
  const [selectedPair, setSelectedPair] = useState<SimilarityPair | null>(null);

  const fetchProblem = async (problemId: string) => {
    setLoadingProblem(true);
    try {
      const res = await axios.get(`${API_URL}/problems/${problemId}`);
      setProblem(res.data?.problem || res.data || null);
    } catch (err: any) {
      console.error("Failed to fetch problem overview:", err);
    } finally {
      setLoadingProblem(false);
    }
  };

  const fetchSimilarityPairs = async (problemId: string) => {
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

  useEffect(() => {
    if (authReady && id && typeof id === "string") {
      fetchProblem(id);
      fetchSimilarityPairs(id);
    }
  }, [authReady, id, token]);

  const handleRefresh = () => {
    if (id && typeof id === "string") {
      fetchSimilarityPairs(id);
    }
  };

  return (
    <AdminLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header Navigation */}
        <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-300 pb-5">
          <div>
            <Link
              href="/admin/problems"
              className="inline-flex items-center space-x-1.5 text-xs font-mono text-slate-500 hover:text-slate-900 transition-colors mb-2"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Problem Registry</span>
            </Link>
            <h1 className="text-2xl font-serif font-bold text-slate-900 flex items-center space-x-3">
              <span>{problem ? problem.title : "Problem Workspace"}</span>
              <span className="text-xs font-mono px-2.5 py-0.5 rounded bg-amber-900/10 text-amber-900 border border-amber-900/20 uppercase font-semibold">
                {problem?.difficulty || "Problem"}
              </span>
            </h1>
            <p className="text-xs font-mono text-slate-500 mt-1">
              ID: {id} • AST Structural Analysis & Educational Data Mining (EDM)
            </p>
          </div>

          <div className="flex items-center space-x-3">
            <button
              onClick={handleRefresh}
              disabled={loadingPairs}
              className="inline-flex items-center space-x-2 px-3 py-2 rounded bg-ivory-200 hover:bg-ivory-300 text-slate-800 font-mono text-xs font-bold border border-slate-300 transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loadingPairs ? "animate-spin" : ""}`} />
              <span>Recompute AST Similarity</span>
            </button>
            {problem && (
              <Link
                href={`/admin/problems/new?id=${problem.id}`}
                className="inline-flex items-center space-x-2 px-3 py-2 rounded bg-slate-900 hover:bg-slate-800 text-ivory-100 font-mono text-xs font-bold transition-colors shadow-sm"
              >
                <span>Edit Problem Spec</span>
              </Link>
            )}
          </div>
        </div>

        {/* Tab Selection */}
        <div className="flex space-x-2 border-b border-slate-300 mb-6">
          <button
            onClick={() => setActiveTab("integrity")}
            className={`flex items-center space-x-2 py-3 px-5 border-b-2 font-mono text-xs font-bold transition-all ${
              activeTab === "integrity"
                ? "border-amber-900 text-amber-950 bg-amber-900/5"
                : "border-transparent text-slate-500 hover:text-slate-900 hover:bg-ivory-200/50"
            }`}
          >
            <ShieldAlert className="w-4 h-4 text-amber-800" />
            <span>Integrity Check (AST Plagiarism Detection)</span>
            {pairs.length > 0 && (
              <span className="ml-1.5 px-2 py-0.5 rounded-full bg-red-600 text-white text-[10px] font-bold animate-pulse">
                {pairs.length} Flagged
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab("overview")}
            className={`flex items-center space-x-2 py-3 px-5 border-b-2 font-mono text-xs font-bold transition-all ${
              activeTab === "overview"
                ? "border-amber-900 text-amber-950 bg-amber-900/5"
                : "border-transparent text-slate-500 hover:text-slate-900 hover:bg-ivory-200/50"
            }`}
          >
            <Code2 className="w-4 h-4 text-slate-600" />
            <span>Problem Overview & Specs</span>
          </button>
        </div>

        {/* Tab 1: AST Plagiarism Detection & Integrity Check */}
        {activeTab === "integrity" && (
          <div className="space-y-6">
            <div className="p-5 rounded-lg bg-ivory-200/70 border border-slate-300 shadow-sm">
              <div className="flex items-start space-x-3">
                <div className="p-2 rounded bg-amber-900/10 text-amber-900 shrink-0 mt-0.5">
                  <ShieldAlert className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-serif font-bold text-slate-900 text-base">
                    Gotreesitter Structural Logic Comparison
                  </h3>
                  <p className="text-xs font-mono text-slate-600 mt-1 leading-relaxed">
                    This admin tool cross-references all <span className="font-semibold text-slate-900">Accepted</span> student submissions for this specific problem ID ($O(M^2)$ strictly bounded per problem). It evaluates Abstract Syntax Tree (AST) node frequency distributions and structural loop/branching depths (<code className="bg-ivory-300 px-1 py-0.5 rounded">for_statement</code>, <code className="bg-ivory-300 px-1 py-0.5 rounded">if_statement</code>, <code className="bg-ivory-300 px-1 py-0.5 rounded">binary_expression</code>) to detect logic copying and plagiarism, even when students modify 100% of variable and function identifiers.
                  </p>
                </div>
              </div>
            </div>

            {loadingPairs ? (
              <div className="p-12 text-center rounded-lg border border-slate-300 bg-ivory-100">
                <div className="w-8 h-8 border-3 border-amber-900 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                <p className="text-sm font-serif font-bold text-slate-900">
                  Cross-referencing AST structural snapshots...
                </p>
                <p className="text-xs font-mono text-slate-500 mt-1">
                  Walking gotreesitter frequency profiles across all accepted attempts.
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
                  Clean Academic Integrity Verified
                </h4>
                <p className="text-xs font-mono text-emerald-800 max-w-xl mx-auto mt-1 leading-relaxed">
                  No structural similarity scores exceeded the <span className="font-bold underline">85.0% threshold</span> among distinct students. All accepted submissions for this problem demonstrate unique algorithmic structure and AST node distributions.
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
          </div>
        )}

        {/* Tab 2: Problem Overview & Specifications */}
        {activeTab === "overview" && (
          <div className="space-y-6">
            <div className="p-6 rounded-lg bg-ivory-100 border border-slate-300 shadow-sm space-y-4">
              <h2 className="text-xl font-serif font-bold text-slate-900">
                {problem?.title || "Problem Details"}
              </h2>
              <div className="flex items-center space-x-6 text-xs font-mono text-slate-600 border-y border-slate-200 py-3">
                <span className="flex items-center space-x-1.5">
                  <Clock className="w-4 h-4 text-slate-400" />
                  <span>Time Limit: {problem?.time_limit_ms || 2000} ms</span>
                </span>
                <span className="flex items-center space-x-1.5">
                  <Cpu className="w-4 h-4 text-slate-400" />
                  <span>Memory Limit: {((problem?.memory_limit_kb || 128000) / 1024).toFixed(0)} MB</span>
                </span>
                <span className="flex items-center space-x-1.5">
                  <Layers className="w-4 h-4 text-slate-400" />
                  <span>AST Complexity Index: {(problem?.ast_complexity_score || problem?.difficulty_score || 2.5).toFixed(2)}</span>
                </span>
              </div>
              <div className="py-2 text-sm font-sans text-slate-800">
                <ProblemDescriptionRenderer content={problem?.description || ""} />
              </div>
            </div>
          </div>
        )}

        {/* Side-by-Side Comparison Modal */}
        {selectedPair && (
          <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-ivory-100 border border-slate-300 rounded-xl shadow-2xl w-full max-w-6xl max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
              {/* Modal Header */}
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
                      Problem ID: {id} • Comparing loop depths and conditional branches across both submissions
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

              {/* Modal Content - Two panes */}
              <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 divide-y lg:divide-y-0 lg:divide-x divide-slate-300 overflow-y-auto bg-slate-950 text-ivory-100 font-mono text-xs">
                {/* Left Pane: Student A */}
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

                {/* Right Pane: Student B */}
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

              {/* Modal Footer */}
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
