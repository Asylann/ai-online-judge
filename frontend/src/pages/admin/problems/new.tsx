import React, { useState, useEffect } from "react";
import { useRouter } from "next/router";
import axios from "axios";
import { motion, AnimatePresence } from "framer-motion";
import { AdminLayout } from "@/components/AdminLayout";
import { useAuth } from "@/context/AuthContext";
import {
  Sparkles,
  Save,
  Trash2,
  Plus,
  AlertCircle,
  CheckCircle2,
  HelpCircle,
  ArrowRight,
  ShieldCheck,
  Zap,
} from "lucide-react";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

interface TestCaseFormItem {
  id?: string;
  stdin: string;
  expected_output: string;
  difficulty_rank: number;
  is_sample?: boolean;
}

export default function AdminProblemNewPage() {
  const router = useRouter();
  const { id } = router.query;
  const { authReady } = useAuth();
  const isEditing = Boolean(id);

  const [title, setTitle] = useState<string>("");
  const [description, setDescription] = useState<string>("");
  const [difficulty, setDifficulty] = useState<string>("medium");
  const [timeLimit, setTimeLimit] = useState<number>(2000);
  const [memoryLimit, setMemoryLimit] = useState<number>(128000);
  const [tagsInput, setTagsInput] = useState<string>("arrays, logic, two-pointers");
  const [sampleStdin, setSampleStdin] = useState<string>("5\n1 2 3 4 5\n");
  const [sampleExpectedOutput, setSampleExpectedOutput] = useState<string>("15\n");

  const [testCases, setTestCases] = useState<TestCaseFormItem[]>([
    {
      stdin: "5\n1 2 3 4 5\n",
      expected_output: "15\n",
      difficulty_rank: 1,
      is_sample: true,
    },
  ]);

  const [generating, setGenerating] = useState<boolean>(false);
  const [saving, setSaving] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Load problem details if query string has ?id=...
  useEffect(() => {
    if (authReady && id && typeof id === "string") {
      axios
        .get(`${API_URL}/problems/${id}`)
        .then((res) => {
          const p = res.data;
          if (p) {
            setTitle(p.title || "");
            setDescription(p.description || "");
            setDifficulty(p.difficulty || "medium");
            setTimeLimit(p.time_limit_ms || 2000);
            setMemoryLimit(p.memory_limit_kb || 128000);
            setTagsInput((p.tags || []).join(", "));
            setSampleStdin(p.stdin || "");
            setSampleExpectedOutput(p.expected_output || "");
            if (p.test_cases && Array.isArray(p.test_cases) && p.test_cases.length > 0) {
              setTestCases(p.test_cases);
            }
          }
        })
        .catch((err) => {
          console.error("Failed to load problem for edit:", err);
        });
    }
  }, [id, authReady]);

  // Sync rank 1 sample whenever sampleStdin/sampleExpectedOutput change
  useEffect(() => {
    setTestCases((prev) => {
      if (prev.length === 0) {
        return [
          {
            stdin: sampleStdin,
            expected_output: sampleExpectedOutput,
            difficulty_rank: 1,
            is_sample: true,
          },
        ];
      }
      const updated = [...prev];
      if (updated[0].is_sample || updated[0].difficulty_rank === 1) {
        updated[0] = {
          ...updated[0],
          stdin: sampleStdin,
          expected_output: sampleExpectedOutput,
        };
      }
      return updated;
    });
  }, [sampleStdin, sampleExpectedOutput]);

  const handleGenerateAI = async () => {
    if (!title.trim() || !description.trim()) {
      setError("Please provide a Problem Title and Description before requesting AI test cases.");
      return;
    }

    setGenerating(true);
    setError(null);
    setSuccessMsg(null);

    try {
      const res = await axios.post(`${API_URL}/admin/problems/generate-tests`, {
        title,
        description,
        sample_stdin: sampleStdin,
        sample_expected_output: sampleExpectedOutput,
      });

      const generated: TestCaseFormItem[] = res.data?.test_cases || [];
      if (generated.length > 0) {
        setTestCases(generated);
        setSuccessMsg("✨ Successfully generated 10 ranked test cases via Virtual TA Problem Setter!");
      } else {
        setError("AI generation returned no test cases. Please check the problem description.");
      }
    } catch (err: any) {
      setError(err.response?.data?.error || "AI Test Case Generation failed. Please check service connectivity.");
    } finally {
      setGenerating(false);
    }
  };

  const handleTestCaseChange = (index: number, field: keyof TestCaseFormItem, value: any) => {
    setTestCases((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: value };
      return next;
    });
  };

  const handleAddTestCase = () => {
    const nextRank = testCases.length + 1;
    setTestCases((prev) => [
      ...prev,
      {
        stdin: "",
        expected_output: "",
        difficulty_rank: nextRank,
        is_sample: false,
      },
    ]);
  };

  const handleRemoveTestCase = (index: number) => {
    if (testCases[index]?.is_sample) {
      alert("Cannot remove the primary sample test case (Rank 1).");
      return;
    }
    setTestCases((prev) => prev.filter((_, idx) => idx !== index));
  };

  const handleSaveProblem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !description.trim()) {
      setError("Title and Description are required.");
      return;
    }

    setSaving(true);
    setError(null);
    setSuccessMsg(null);

    const tags = tagsInput
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);

    const payload = {
      title,
      description,
      difficulty,
      time_limit_ms: Number(timeLimit),
      memory_limit_kb: Number(memoryLimit),
      tags,
      stdin: sampleStdin,
      expected_output: sampleExpectedOutput,
      test_cases: testCases,
    };

    try {
      if (isEditing && typeof id === "string") {
        await axios.put(`${API_URL}/admin/problems/${id}`, payload);
        setSuccessMsg("Problem updated successfully!");
      } else {
        await axios.post(`${API_URL}/admin/problems`, payload);
        setSuccessMsg("Problem and 10 test cases created successfully!");
      }

      setTimeout(() => {
        if (isEditing && typeof id === "string") {
          router.push(`/admin/problems/${id}`);
        } else {
          router.push("/admin/problems");
        }
      }, 1200);
    } catch (err: any) {
      setError(err.response?.data?.error || "Failed to save problem. Please check your admin permissions.");
      setSaving(false);
    }
  };

  return (
    <AdminLayout
      title={isEditing ? `Edit Problem` : `Create Problem Workspace`}
      subtitle="Define algorithmic requirements, configure Judge0 cgroup limits, and generate multi-test evaluation suites."
    >
      {error && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 p-4 bg-amber-50 border border-amber-300 rounded-lg flex items-start space-x-3 text-sm text-amber-900"
        >
          <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div>{error}</div>
        </motion.div>
      )}

      {successMsg && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 p-4 bg-emerald-50 border border-emerald-300 rounded-lg flex items-start space-x-3 text-sm text-emerald-900"
        >
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
          <div>{successMsg}</div>
        </motion.div>
      )}

      <form onSubmit={handleSaveProblem} className="space-y-8">
        {/* Section 1: Core Problem Definition */}
        <div className="bg-ivory-200/40 border border-slate-900/10 rounded-xl p-6 space-y-6">
          <div className="flex items-center space-x-2 pb-4 border-b border-slate-900/10">
            <div className="w-6 h-6 rounded bg-slate-900 text-ivory-100 flex items-center justify-center font-mono text-xs font-bold">
              1
            </div>
            <h2 className="font-serif font-bold text-lg text-slate-900">
              Problem Specifications & Judge0 Parameters
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-2 space-y-2">
              <label className="block text-xs font-mono uppercase tracking-wider text-slate-700 font-semibold">
                Problem Title <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Range Sum Query Mutable (Binary Indexed Tree)"
                className="w-full bg-ivory-100 border border-slate-900/20 rounded-md px-3.5 py-2 text-sm font-serif text-slate-900 focus:outline-none focus:border-slate-900 transition-colors"
              />
            </div>

            <div className="space-y-2">
              <label className="block text-xs font-mono uppercase tracking-wider text-slate-700 font-semibold">
                ZPD Difficulty Level
              </label>
              <select
                value={difficulty}
                onChange={(e) => setDifficulty(e.target.value)}
                className="w-full bg-ivory-100 border border-slate-900/20 rounded-md px-3.5 py-2 text-sm font-mono text-slate-900 focus:outline-none focus:border-slate-900 transition-colors"
              >
                <option value="easy">Easy (Score &lt; 2.0)</option>
                <option value="medium">Medium (Score 2.0–3.5)</option>
                <option value="hard">Hard (Score &gt; 3.5)</option>
              </select>
            </div>
          </div>

          <div className="space-y-2">
            <label className="block text-xs font-mono uppercase tracking-wider text-slate-700 font-semibold">
              Problem Statement & Requirements <span className="text-red-500">*</span>
            </label>
            <textarea
              required
              rows={6}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Provide clear algorithmic requirements, input/output specifications, and constraints (e.g. 1 <= N <= 10^5)..."
              className="w-full bg-ivory-100 border border-slate-900/20 rounded-md p-3.5 text-sm font-sans text-slate-900 focus:outline-none focus:border-slate-900 transition-colors leading-relaxed"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-2">
              <label className="block text-xs font-mono uppercase tracking-wider text-slate-700 font-semibold">
                Time Limit (ms)
              </label>
              <input
                type="number"
                min={100}
                max={30000}
                value={timeLimit}
                onChange={(e) => setTimeLimit(Number(e.target.value))}
                className="w-full bg-ivory-100 border border-slate-900/20 rounded-md px-3.5 py-2 text-sm font-mono text-slate-900 focus:outline-none focus:border-slate-900"
              />
            </div>

            <div className="space-y-2">
              <label className="block text-xs font-mono uppercase tracking-wider text-slate-700 font-semibold">
                Memory Limit (KB)
              </label>
              <input
                type="number"
                min={16384}
                max={1048576}
                value={memoryLimit}
                onChange={(e) => setMemoryLimit(Number(e.target.value))}
                className="w-full bg-ivory-100 border border-slate-900/20 rounded-md px-3.5 py-2 text-sm font-mono text-slate-900 focus:outline-none focus:border-slate-900"
              />
              <span className="text-[10px] font-mono text-slate-500 block">
                128000 KB = 125 MB cgroup v2 RAM ceiling
              </span>
            </div>

            <div className="space-y-2">
              <label className="block text-xs font-mono uppercase tracking-wider text-slate-700 font-semibold">
                Algorithmic Tags (Comma separated)
              </label>
              <input
                type="text"
                value={tagsInput}
                onChange={(e) => setTagsInput(e.target.value)}
                placeholder="e.g. arrays, dynamic-programming, graphs"
                className="w-full bg-ivory-100 border border-slate-900/20 rounded-md px-3.5 py-2 text-sm font-mono text-slate-900 focus:outline-none focus:border-slate-900"
              />
            </div>
          </div>
        </div>

        {/* Section 2: Sample Test Case & AI Test Case Generation */}
        <div className="bg-ivory-200/40 border border-slate-900/10 rounded-xl p-6 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-4 border-b border-slate-900/10 gap-4">
            <div className="flex items-center space-x-2">
              <div className="w-6 h-6 rounded bg-slate-900 text-ivory-100 flex items-center justify-center font-mono text-xs font-bold">
                2
              </div>
              <div>
                <h2 className="font-serif font-bold text-lg text-slate-900 leading-tight">
                  Evaluation Suite (10 Test Cases)
                </h2>
                <span className="text-[11px] font-sans text-slate-600 block">
                  Provide 1 sample input/output below, then let the Virtual TA generate the full 10-case stress test suite.
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={handleGenerateAI}
              disabled={generating}
              className="flex items-center justify-center space-x-2.5 bg-gradient-to-r from-amber-900 via-amber-800 to-amber-950 text-ivory-100 hover:from-amber-800 hover:to-slate-900 px-5 py-2.5 rounded-lg font-serif font-bold text-xs tracking-wide transition-all duration-300 shadow-md hover:shadow-lg hover:scale-[1.02] disabled:opacity-60 disabled:pointer-events-none shrink-0"
            >
              <Sparkles className={`w-4 h-4 text-amber-300 ${generating ? "animate-spin" : "animate-pulse"}`} />
              <span>{generating ? "Generating 10 Ranked Cases via GPT-4o..." : "✨ Generate Test Cases with AI"}</span>
            </button>
          </div>

          {/* Sample Test Case (Rank 1) Inputs */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-4 bg-ivory-300/30 rounded-lg border border-slate-900/10">
            <div className="space-y-2">
              <label className="block text-xs font-mono uppercase tracking-wider text-slate-700 font-semibold flex items-center justify-between">
                <span>Sample Stdin (Rank 1)</span>
                <span className="text-[10px] text-amber-900 bg-amber-100 px-1.5 py-0.5 rounded font-mono">
                  UI Sidebar Sample
                </span>
              </label>
              <textarea
                rows={3}
                value={sampleStdin}
                onChange={(e) => setSampleStdin(e.target.value)}
                placeholder="5\n1 2 3 4 5\n"
                className="w-full font-mono text-xs bg-ivory-100 border border-slate-900/20 rounded p-2.5 text-slate-900 focus:outline-none focus:border-slate-900"
              />
            </div>

            <div className="space-y-2">
              <label className="block text-xs font-mono uppercase tracking-wider text-slate-700 font-semibold">
                Sample Expected Output (Rank 1)
              </label>
              <textarea
                rows={3}
                value={sampleExpectedOutput}
                onChange={(e) => setSampleExpectedOutput(e.target.value)}
                placeholder="15\n"
                className="w-full font-mono text-xs bg-ivory-100 border border-slate-900/20 rounded p-2.5 text-slate-900 focus:outline-none focus:border-slate-900"
              />
            </div>
          </div>

          {/* Loading Animation during AI Generation */}
          <AnimatePresence>
            {generating && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="p-8 bg-ivory-100/90 border border-amber-900/20 rounded-xl text-center space-y-3"
              >
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-amber-900/10 text-amber-900 animate-bounce">
                  <Sparkles className="w-6 h-6 text-amber-600 animate-spin" />
                </div>
                <h3 className="font-serif font-bold text-base text-slate-900">
                  Virtual TA Problem Setter is analyzing code structure...
                </h3>
                <p className="text-xs font-mono text-slate-600 max-w-md mx-auto leading-relaxed">
                  Generating exactly 9 additional test cases ranked from basic edge cases (ranks 2–3) to maximum input size stress tests (ranks 9–10)...
                </p>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Dynamic Test Case Table/Cards */}
          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between text-xs font-mono uppercase tracking-wider text-slate-600 px-1">
              <span>Configured Evaluation Suite ({testCases.length} Cases)</span>
              <button
                type="button"
                onClick={handleAddTestCase}
                className="flex items-center space-x-1 text-slate-700 hover:text-slate-900 font-semibold transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Custom Case</span>
              </button>
            </div>

            <div className="grid grid-cols-1 gap-3">
              {testCases.map((tc, idx) => {
                const rank = tc.difficulty_rank || idx + 1;
                const isSample = tc.is_sample || idx === 0;

                return (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.2, delay: idx * 0.03 }}
                    className={`p-4 rounded-lg border transition-colors ${
                      isSample
                        ? "bg-amber-900/5 border-amber-900/30"
                        : "bg-ivory-100 border-slate-900/10 hover:border-slate-900/30"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2 pb-2 border-b border-slate-900/10">
                      <div className="flex items-center space-x-2.5">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-mono uppercase font-bold ${
                            isSample
                              ? "bg-amber-900 text-ivory-100"
                              : rank >= 8
                              ? "bg-red-900 text-ivory-100"
                              : "bg-slate-900/10 text-slate-800"
                          }`}
                        >
                          Rank {rank} {isSample ? "(Primary Sample)" : rank >= 9 ? "(Stress Test)" : ""}
                        </span>
                      </div>
                      {!isSample && (
                        <button
                          type="button"
                          onClick={() => handleRemoveTestCase(idx)}
                          className="text-slate-400 hover:text-red-600 p-1 transition-colors"
                          title="Remove test case"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[10px] font-mono uppercase text-slate-500 mb-1">
                          Stdin
                        </label>
                        <textarea
                          rows={2}
                          value={tc.stdin}
                          onChange={(e) => handleTestCaseChange(idx, "stdin", e.target.value)}
                          className="w-full font-mono text-xs bg-ivory-200/50 border border-slate-900/15 rounded p-2 text-slate-900 focus:outline-none focus:border-slate-900"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-mono uppercase text-slate-500 mb-1">
                          Expected Output
                        </label>
                        <textarea
                          rows={2}
                          value={tc.expected_output}
                          onChange={(e) => handleTestCaseChange(idx, "expected_output", e.target.value)}
                          className="w-full font-mono text-xs bg-ivory-200/50 border border-slate-900/15 rounded p-2 text-slate-900 focus:outline-none focus:border-slate-900"
                        />
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Form Action Bar */}
        <div className="flex items-center justify-end space-x-4 pt-4 border-t border-slate-900/10">
          <button
            type="button"
            onClick={() => router.push("/admin/problems")}
            className="px-5 py-2.5 rounded-lg text-xs font-mono text-slate-600 hover:text-slate-900 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving}
            className="flex items-center space-x-2 bg-slate-900 hover:bg-slate-800 text-ivory-100 px-6 py-2.5 rounded-lg font-serif font-bold text-sm tracking-wide transition-all duration-200 shadow-md hover:shadow-lg hover:scale-[1.01] disabled:opacity-50"
          >
            <Save className="w-4 h-4 text-amber-400" />
            <span>{saving ? "Saving Problem & Suite..." : "Save Problem & Evaluation Suite"}</span>
          </button>
        </div>
      </form>
    </AdminLayout>
  );
}
