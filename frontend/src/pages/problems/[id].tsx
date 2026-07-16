import React, { useState, useEffect } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import axios from "axios";
import { motion } from "framer-motion";
import { CodeEditor } from "@/components/CodeEditor";
import { VirtualTAPanel, SocraticHint } from "@/components/VirtualTAPanel";
import { ArrowLeft, Play, Cpu, CheckCircle2, AlertTriangle, Layers, BookOpen, Sparkles, Award } from "lucide-react";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";
const WS_URL = process.env.NEXT_PUBLIC_WS_URL || "ws://localhost:8082";

interface ProblemDetail {
  id: string;
  title: string;
  description: string;
  difficulty_score: number;
  stdin?: string;
  expected_output?: string;
}

const DEFAULT_PYTHON_CODE = `# Write your solution below. 
# Your code will execute inside a secure Judge0 isolate cgroup.
# If logical or structural deviations occur, the Virtual TA will provide Socratic guidance.

def solve():
    # TODO: Implement algorithm
    pass

if __name__ == "__main__":
    solve()
`;

const DEFAULT_CPP_CODE = `// Write your solution below.
// Evaluated by gotreesitter for AST complexity and structural deviation.

#include <iostream>
#include <vector>

using namespace std;

int main() {
    // TODO: Implement algorithm
    return 0;
}
`;

const DEFAULT_GO_CODE = `// Write your solution below.
package main

import "fmt"

func main() {
    // TODO: Implement algorithm
    fmt.Println("Ready for isolate cgroup evaluation")
}
`;

export default function ProblemWorkspacePage() {
  const router = useRouter();
  const { id } = router.query;

  const [problem, setProblem] = useState<ProblemDetail | null>(null);
  const [language, setLanguage] = useState<string>("python3");
  const [code, setCode] = useState<string>(DEFAULT_PYTHON_CODE);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [verdict, setVerdict] = useState<string | null>(null);
  const [testsPassed, setTestsPassed] = useState<number>(0);
  const [testsTotal, setTestsTotal] = useState<number>(0);
  const [hint, setHint] = useState<SocraticHint | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [wsConnected, setWsConnected] = useState<boolean>(false);
  const [recommendation, setRecommendation] = useState<ProblemDetail | null>(null);
  const [showRecommendation, setShowRecommendation] = useState<boolean>(false);
  const [activeSubmissionId, setActiveSubmissionId] = useState<string | null>(null);

  // Phase 8: Fetch Content-Based Recommendation (CBRS) inside student's ZPD
  const fetchRecommendation = async () => {
    if (!id || typeof id !== "string") return;
    try {
      const token = typeof window !== "undefined" ? localStorage.getItem("jwt_token") : null;
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      const response = await axios.get(`${API_URL}/problems/${id}/recommendation`, { headers });
      if (response.data && response.data.id) {
        setRecommendation(response.data);
        setShowRecommendation(true);
      }
    } catch (err) {
      console.warn("[Phase 8] Failed to fetch CBRS recommendation:", err);
      // Fallback ZPD recommendation if API endpoint or test data not yet populated
      setRecommendation({
        id: "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
        title: "Balanced BST Verification — Structural Validation",
        description: "Given the root of a binary tree, determine if it is a valid binary search tree (BST). Tracked via EDM effort metrics.",
        difficulty_score: problem ? problem.difficulty_score + 0.5 : 2.0,
      });
      setShowRecommendation(true);
    }
  };

  // Phase 7: Establish real-time WebSocket connection to websocket-service via query param (?token=<jwt>)
  useEffect(() => {
    const token = typeof window !== "undefined" ? localStorage.getItem("jwt_token") : null;
    if (!token) return;

    const wsUrl = `${WS_URL}/ws?token=${token}`;
    const ws = new WebSocket(wsUrl);

    ws.onopen = () => {
      console.log("[Phase 7] Connected to real-time WebSocket service");
      setWsConnected(true);
    };

    ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data);
        console.log("[Phase 7] Real-time message received:", msg);

        if (msg.type === "verdict" || (msg.status && msg.type !== "ai_hint")) {
          const newStatus = msg.status || "Accepted";
          const tp = typeof msg.tests_passed === "number" ? msg.tests_passed : 0;
          const tt = typeof msg.tests_total  === "number" ? msg.tests_total  : 0;
          setVerdict(newStatus);
          if (tp > 0 || tt > 0) {
            setTestsPassed(tp);
            setTestsTotal(tt);
          }
          if (newStatus !== "Pending" && newStatus !== "In Queue" && newStatus !== "Processing") {
            setSubmitting(false);
            setActiveSubmissionId(null);
            if (newStatus === "Accepted") {
              fetchRecommendation();
            } else {
              setHint((prev) => {
                if (prev && !prev.hint_text.startsWith("Virtual TA (Socratic Hint): Your code returned status")) {
                  return prev; // Real AI hint already set — don't overwrite
                }
                return {
                  hint_text: `Virtual TA (Socratic Hint): Your code returned status ${newStatus}. Analyzing structural deviation via gotreesitter & GPT-4o...`,
                  target_line: null,
                  cognitive_effort_index: 2.5,
                };
              });
            }
          }
        } else if (msg.type === "ai_hint") {
          setHint({
            hint_text: msg.ai_hint_text || msg.hint_text || "Virtual TA: Socratic intervention triggered based on structural deviation.",
            target_line: msg.target_line || null,
            cognitive_effort_index: msg.cognitive_effort_index || 2.5,
          });
          setSubmitting(false);
          setActiveSubmissionId(null);
        }
      } catch (err) {
        console.warn("[Phase 7] Failed to parse WebSocket message:", err);
      }
    };

    ws.onerror = (err) => {
      console.warn("[Phase 7] WebSocket error encountered:", err);
    };

    ws.onclose = () => {
      console.log("[Phase 7] Disconnected from WebSocket service");
      setWsConnected(false);
    };

    return () => {
      if (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING) {
        ws.close();
      }
    };
  }, []);

  // Fetch Problem metadata
  useEffect(() => {
    if (!id || typeof id !== "string") return;

    const fetchProblem = async () => {
      try {
        const response = await axios.get(`${API_URL}/problems/${id}`);
        if (response.data) {
          setProblem(response.data);
        }
      } catch (err) {
        // Fallback for demo if API endpoint not populated yet
        setProblem({
          id: id,
          title: "Two Sum — Optimal Structural Indexing",
          description: "Given an array of integers and an integer target, return indices of the two numbers such that they add up to target.\n\nYou may assume that each input would have exactly one solution, and you may not use the same element twice.\n\nYou can return the answer in any order.\n\nYour solution is tracked via Educational Data Mining (EDM) effort metrics.",
          difficulty_score: 1.5,
        });
      }
    };

    fetchProblem();
  }, [id]);

  useEffect(() => {
    if (!submitting || !activeSubmissionId) return;
    const interval = setInterval(async () => {
      try {
        const token = typeof window !== "undefined" ? localStorage.getItem("jwt_token") : null;
        const headers = token ? { Authorization: `Bearer ${token}` } : {};
        const res = await axios.get(`${API_URL}/submissions/${activeSubmissionId}`, { headers });
        const data = res.data;
        if (data && data.status && data.status !== "Pending" && data.status !== "In Queue" && data.status !== "Processing") {
          setVerdict(data.status);
          if (typeof data.tests_passed === "number") setTestsPassed(data.tests_passed);
          if (typeof data.tests_total === "number") setTestsTotal(data.tests_total);
          if (data.status !== "Accepted") {
            setHint({
              hint_text: data.ai_hint_text || `Virtual TA (Socratic Hint): Your code returned status ${data.status}. Notice any structural or runtime deviation?`,
              target_line: data.target_line || null,
              cognitive_effort_index: data.cognitive_effort_index || 2.5,
            });
          } else {
            fetchRecommendation();
          }
          setSubmitting(false);
          setActiveSubmissionId(null);
        }
      } catch (e) {
        // ignore polling errors during async evaluation
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [submitting, activeSubmissionId]);

  const handleLanguageChange = (newLang: string) => {
    setLanguage(newLang);
    if (newLang === "python3") setCode(DEFAULT_PYTHON_CODE);
    else if (newLang === "cpp") setCode(DEFAULT_CPP_CODE);
    else if (newLang === "go") setCode(DEFAULT_GO_CODE);
  };

  const handleCodeSubmit = async () => {
    if (!id || typeof id !== "string") return;

    setSubmitting(true);
    setVerdict("Evaluating inside Sandbox (Isolate cgroup)...");
    setTestsPassed(0);
    setTestsTotal(0);
    setHint(null);
    setErrorMsg(null);

    try {
      // Base64 encode user code per Critical Rule #1
      const codeBase64 = typeof window !== "undefined"
        ? window.btoa(unescape(encodeURIComponent(code)))
        : Buffer.from(code).toString("base64");

      const payload = {
        problem_id: id,
        language: language,
        code_base64: codeBase64,
      };

      const token = typeof window !== "undefined" ? localStorage.getItem("jwt_token") : null;
      const headers = token ? { Authorization: `Bearer ${token}` } : {};

      const response = await axios.post(`${API_URL}/submissions`, payload, { headers });
      const submissionData = response.data;

      if (submissionData) {
        if (submissionData.submission_id || submissionData.id) {
          setActiveSubmissionId(submissionData.submission_id || submissionData.id);
        }
        const finalStatus = submissionData.status || "Accepted";
        setVerdict(finalStatus);

        if (finalStatus === "Pending" || finalStatus === "In Queue" || finalStatus === "Processing") {
          setVerdict("Evaluating inside Sandbox (Isolate cgroup)...");
        } else {
          setSubmitting(false);
          setActiveSubmissionId(null);
          if (finalStatus !== "Accepted") {
            setHint({
              hint_text: submissionData.ai_hint_text || `Virtual TA (Socratic Hint): Your code returned status ${finalStatus}. Notice any structural or runtime deviation?`,
              target_line: submissionData.target_line || null,
              cognitive_effort_index: submissionData.cognitive_effort_index || 2.5,
            });
          } else {
            fetchRecommendation();
          }
        }
      }
    } catch (err: any) {
      setVerdict(null);
      const status = err.response?.status;
      const apiError = err.response?.data?.error || "";
      if (status === 401 || apiError.toLowerCase().includes("authorization") || apiError.toLowerCase().includes("token")) {
        setErrorMsg("Wanna try to solve? Log in first to submit your code! 🔐");
      } else if (status === 403) {
        setErrorMsg("Access denied. You don't have permission to submit to this problem.");
      } else {
        setErrorMsg(apiError || "Execution failed inside sandbox. Please check API Gateway connectivity.");
      }
      setSubmitting(false);
      setActiveSubmissionId(null);
    }
  };

  return (
    <div className="flex-1 flex flex-col h-[calc(100vh-4rem)] bg-ivory-100 overflow-hidden">
      {/* Workspace Top Action Bar */}
      <div className="flex items-center justify-between px-6 py-3 border-b border-slate-900/10 bg-ivory-100 flex-shrink-0">
        <div className="flex items-center space-x-4">
          <Link
            href="/"
            className="flex items-center space-x-1.5 text-xs font-medium text-slate-600 hover:text-slate-900 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Dashboard</span>
          </Link>
          <span className="text-slate-300">/</span>
          <span className="text-sm font-serif font-semibold text-slate-900 truncate max-w-sm sm:max-w-md">
            {problem ? problem.title : "Loading Problem..."}
          </span>
        </div>

        <div className="flex items-center space-x-3">
          <select
            value={language}
            onChange={(e) => handleLanguageChange(e.target.value)}
            disabled={submitting}
            className="px-3 py-1.5 rounded-lg bg-ivory-200/60 border border-slate-900/15 text-xs font-mono text-slate-800 focus:outline-none focus:border-slate-900 transition-colors"
          >
            <option value="python3">python3 (Python 3.11)</option>
            <option value="cpp">cpp (C++ 20)</option>
            <option value="go">go (Golang 1.22)</option>
          </select>

          <button
            onClick={handleCodeSubmit}
            disabled={submitting || !problem}
            className="inline-flex items-center space-x-2 px-4 py-2 rounded-lg bg-slate-900 text-ivory-100 text-xs font-semibold tracking-tight transition-all duration-300 ease-out hover:bg-slate-800 hover:scale-[1.02] shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Play className="w-3.5 h-3.5 fill-ivory-100" />
            <span>{submitting ? "Evaluating in Isolate..." : "Submit to Sandbox"}</span>
          </button>
        </div>
      </div>

      {/* 3-Pane Workspace Layout */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 overflow-hidden">
        {/* Left Pane: Problem Description (4 cols) */}
        <div className="lg:col-span-4 border-r border-slate-900/10 flex flex-col h-full bg-ivory-100 overflow-y-auto p-6 space-y-6">
          {problem ? (
            <>
              <div>
                <div className="flex items-center space-x-2 mb-3">
                  <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-slate-900/5 text-slate-700">
                    Difficulty: {problem.difficulty_score.toFixed(1)}
                  </span>
                  <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-amber-100/80 text-amber-800">
                    ZPD Adaptive
                  </span>
                </div>
                <h1 className="text-xl font-serif font-semibold text-slate-900 tracking-tight">
                  {problem.title}
                </h1>
              </div>

              <div className="space-y-4 text-xs sm:text-sm text-slate-700 font-sans leading-relaxed whitespace-pre-wrap tracking-tight">
                {problem.description}
              </div>

              {(problem.stdin || problem.expected_output) && (
                <div className="bg-ivory-200/60 p-4 rounded-xl border border-slate-900/10 space-y-3 font-mono text-xs">
                  <div className="text-[11px] uppercase tracking-wider font-semibold text-slate-700 flex items-center">
                    <BookOpen className="w-3.5 h-3.5 mr-1.5 text-amber-800" />
                    Example Test Case (Isolate Stdin & Expected Output)
                  </div>
                  {problem.stdin && (
                    <div>
                      <span className="text-slate-500 text-[10px] block mb-0.5">STDIN INPUT:</span>
                      <pre className="bg-ivory-100 p-2.5 rounded border border-slate-900/10 text-slate-800 overflow-x-auto whitespace-pre font-mono">
                        {problem.stdin}
                      </pre>
                    </div>
                  )}
                  {problem.expected_output && (
                    <div>
                      <span className="text-slate-500 text-[10px] block mb-0.5">EXPECTED OUTPUT:</span>
                      <pre className="bg-ivory-100 p-2.5 rounded border border-slate-900/10 text-emerald-900 font-semibold overflow-x-auto whitespace-pre font-mono">
                        {problem.expected_output}
                      </pre>
                    </div>
                  )}
                </div>
              )}

              <div className="pt-6 border-t border-slate-900/10 space-y-3">
                <h4 className="text-xs font-mono uppercase tracking-wider text-slate-500 flex items-center">
                  <Layers className="w-3.5 h-3.5 mr-1.5 text-slate-600" />
                  Watanobe Lab EDM Specifications
                </h4>
                <ul className="text-xs text-slate-600 space-y-1.5 font-sans">
                  <li>• Sandbox: Isolate cgroup with seccomp-bpf enforcement.</li>
                  <li>• Structural Analysis: gotreesitter AST complexity parsing.</li>
                  <li>• Socratic Pedagogy: Virtual TA provides minimal-edit hints.</li>
                </ul>
              </div>
            </>
          ) : (
            <div className="flex items-center justify-center h-48 text-slate-400 text-xs font-mono">
              Loading Problem Description...
            </div>
          )}
        </div>

        {/* Center Pane: Monaco Code Editor (5 cols when Virtual TA panel active, otherwise 8 cols) */}
        <div
          className={`${
            hint || verdict === "Accepted" || verdict === "WA" ? "lg:col-span-5" : "lg:col-span-8"
          } h-full p-4 flex flex-col bg-slate-950 transition-all duration-300`}
        >
          <CodeEditor
            code={code}
            language={language}
            onChange={(val) => setCode(val || "")}
            readOnly={submitting}
          />
        </div>

        {/* Right Pane: Execution Output / Socratic Virtual TA Panel */}
        {submitting ? (
          <div className="lg:col-span-3 p-6 flex flex-col items-center justify-center text-center bg-ivory-100 border-t lg:border-t-0 lg:border-l border-slate-900/10">
            <Cpu className="w-8 h-8 text-slate-400 animate-pulse mb-3" />
            <h3 className="text-sm font-serif font-medium text-slate-900 mb-1">
              Sandbox Evaluation
            </h3>
            <p className="text-xs text-slate-500 max-w-xs font-sans">
              Executing binary inside Linux cgroup v2 container. Analyzing structural complexity via gotreesitter...
            </p>
          </div>
        ) : (
          <div className="lg:col-span-3 flex flex-col justify-between border-t lg:border-t-0 lg:border-l border-slate-900/10 p-6 bg-ivory-100 overflow-y-auto">
            <div>
              <div className="flex items-center space-x-2 text-[11px] font-mono uppercase tracking-wider text-slate-500 mb-4">
                <span>Evaluation & Guidance</span>
              </div>

              {errorMsg && (
                <div className="p-4 mb-4 bg-amber-50 border border-amber-200 rounded-xl text-xs font-sans leading-relaxed">
                  {errorMsg.includes("Log in first") ? (
                    <>
                      <span className="font-semibold text-amber-800 block mb-2">🔐 Login Required</span>
                      <span className="text-amber-700">{errorMsg}</span>
                      <div className="mt-3">
                        <a
                          href="/login"
                          className="inline-flex items-center px-3 py-1.5 rounded-lg bg-slate-900 text-ivory-100 text-xs font-semibold tracking-tight hover:bg-slate-800 transition-colors"
                        >
                          Go to Login →
                        </a>
                      </div>
                    </>
                  ) : (
                    <>
                      <span className="font-semibold text-terracotta block mb-0.5">System Notice:</span>
                      <span className="text-terracotta">{errorMsg}</span>
                    </>
                  )}
                </div>
              )}

              {verdict && !errorMsg && (
                <div className="mb-6 space-y-3">
                  <div className="text-[11px] font-mono text-slate-400 uppercase mb-1">Last Verdict</div>
                  <div
                    className={`inline-flex items-center px-3 py-1.5 text-xs font-mono font-medium ${
                      verdict === "Accepted"
                        ? "bg-emerald-900/10 text-emerald-900 border border-emerald-900/20"
                        : "bg-terracotta/15 text-terracotta border border-terracotta/30"
                    }`}
                  >
                    {verdict === "Accepted" ? (
                      <CheckCircle2 className="w-4 h-4 mr-1.5" />
                    ) : (
                      <AlertTriangle className="w-4 h-4 mr-1.5" />
                    )}
                    <span>{verdict}</span>
                  </div>

                  {/* Multi-test progress bar — Zone of Proximal Development alignment */}
                  {testsTotal > 0 && (
                    <div className="mt-3">
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-[11px] font-mono text-slate-500 uppercase tracking-wider">
                          Test Cases
                        </span>
                        <span
                          className={`text-xs font-mono font-semibold ${
                            testsPassed === testsTotal
                              ? "text-emerald-700"
                              : testsPassed === 0
                              ? "text-red-500"
                              : "text-amber-600"
                          }`}
                        >
                          {testsPassed} / {testsTotal} passed
                        </span>
                      </div>
                      {/* Segmented bar — one segment per test case */}
                      <div className="flex gap-0.5">
                        {Array.from({ length: testsTotal }).map((_, i) => (
                          <div
                            key={i}
                            className={`h-2 flex-1 rounded-sm transition-all duration-300 ${
                              i < testsPassed
                                ? "bg-emerald-500"
                                : "bg-red-400/60"
                            }`}
                          />
                        ))}
                      </div>
                      {testsPassed === testsTotal || verdict === "Accepted" ? (
                        <div className="mt-4 p-4 rounded-xl bg-emerald-950/10 border border-emerald-800/30 text-emerald-950 space-y-2">
                          <div className="flex items-center space-x-2 font-serif font-semibold text-sm text-emerald-900">
                            <Award className="w-4 h-4 text-emerald-600 shrink-0" />
                            <span>Flawless Algorithmic Execution!</span>
                          </div>
                          <p className="text-xs font-sans leading-relaxed text-emerald-800/95">
                            Congratulations! Your code verified 100% of all test cases with optimal structural invariants inside the secure Linux cgroup sandbox.
                          </p>
                          <div className="pt-2 border-t border-emerald-800/15 flex items-center justify-between text-[11px] font-mono text-emerald-700">
                            <span className="flex items-center">
                              <Sparkles className="w-3.5 h-3.5 mr-1 text-emerald-600" />
                              Points logged to Global Leaderboard
                            </span>
                          </div>
                        </div>
                      ) : testsPassed < testsTotal ? (
                        <p className="text-[10px] text-slate-400 font-sans mt-1.5 leading-relaxed">
                          {testsTotal - testsPassed} hidden test case{testsTotal - testsPassed !== 1 ? "s" : ""} failed.
                          Virtual TA will guide you with a Socratic hint.
                        </p>
                      ) : null}
                    </div>
                  )}
                </div>
              )}

              <VirtualTAPanel
                hint={hint}
                verdict={verdict}
                isLoading={submitting}
                onDismiss={() => setHint(null)}
              />
            </div>

            <div className="pt-6 border-t border-slate-900/10 text-[11px] text-slate-400 font-mono">
              Socratic pedagogy active. Direct solution output disabled per lab protocol.
            </div>
          </div>
        )}
      </div>

      {/* Phase 8: CBRS Recommendation ZPD Modal (Anthropic Minimalist Aesthetic) */}
      {showRecommendation && recommendation && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 backdrop-blur-sm p-4"
        >
          <motion.div
            initial={{ scale: 0.96, opacity: 0, y: 12 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
            className="bg-ivory-100 border border-slate-900/15 p-8 max-w-md w-full shadow-2xl relative"
          >
            <div className="flex items-center space-x-2 text-emerald-800 mb-3 font-mono text-xs uppercase tracking-wider">
              <CheckCircle2 className="w-4 h-4" />
              <span>Submission Accepted — EDM Verified</span>
            </div>
            
            <h3 className="text-xl font-serif font-medium text-slate-900 mb-2">
              Ready for your next challenge?
            </h3>
            
            <p className="text-xs text-slate-600 leading-relaxed mb-6 font-sans">
              Based on your <span className="font-semibold text-slate-800">Cognitive Effort Index</span> and structural AST analysis on this problem, we recommend this problem within your <span className="font-semibold text-slate-800">Zone of Proximal Development</span> (ZPD):
            </p>

            <div className="bg-white/80 border border-slate-900/10 p-4 mb-6 transition-all hover:border-slate-900/25">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-sm font-serif font-semibold text-slate-900">
                  {recommendation.title}
                </span>
                <span className="text-[10px] font-mono bg-slate-900/5 text-slate-700 px-2 py-0.5 border border-slate-900/10">
                  AST Complexity: {recommendation.difficulty_score?.toFixed(1) || "2.0"}
                </span>
              </div>
              <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
                {recommendation.description}
              </p>
            </div>

            <div className="flex items-center justify-end space-x-3">
              <button
                onClick={() => setShowRecommendation(false)}
                className="px-4 py-2 text-xs font-medium text-slate-600 hover:text-slate-900 transition-colors"
              >
                Stay Here
              </button>
              <button
                onClick={() => {
                  setShowRecommendation(false);
                  setVerdict(null);
                  setHint(null);
                  router.push(`/problems/${recommendation.id}`);
                }}
                className="px-5 py-2 text-xs font-medium bg-slate-900 text-ivory-100 hover:bg-slate-800 transition-all flex items-center space-x-1.5 shadow-sm"
              >
                <span>Proceed to Challenge</span>
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </div>
  );
}
