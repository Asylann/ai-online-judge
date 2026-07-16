import React, { useState, useEffect } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import axios from "axios";
import { motion } from "framer-motion";
import { useAuth } from "@/context/AuthContext";
import { EffortDashboard, SubmissionMetric } from "@/components/EffortDashboard";
import { User, Mail, Shield, Award, Activity, Code, Clock, CheckCircle2, AlertTriangle, ArrowLeft, Save, Sparkles, RefreshCw, PlayCircle } from "lucide-react";
import { TimeTravelPlayer, PlaybackAttempt } from "@/components/TimeTravelPlayer";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

interface SubmissionHistoryItem {
  id: string;
  problem_id?: string;
  problem_title: string;
  code_base64?: string;
  language: string;
  status: string;
  tests_passed: number;
  tests_total: number;
  execution_time_ms: number;
  memory_kb: number;
  ast_complexity_score: number;
  cognitive_effort_index: number;
  ai_hint_text?: string;
  created_at: string;
  raw_created_at?: string;
}

const mockHistory: SubmissionHistoryItem[] = [
  {
    id: "sub-101",
    problem_id: "prob-101",
    problem_title: "Two Sum — Optimal Structural Indexing",
    code_base64: "ZGVmIHR3b19zdW0obnVtcywgdGFyZ2V0KToKICAgICMgT3B0aW1hbCBoYXNoIG1hcCBpbmRleGluZyBhcFByb2FjaAogICAgc2VlbiA9IHt9CiAgICBmb3IgaSwgbnVtIGluIGVudW1lcmF0ZShudW1zKToKICAgICAgICBkaWZmID0gdGFyZ2V0IC0gbnVtCiAgICAgICAgaWYgZGlmZiBpbiBzZWVuOgogICAgICAgICAgICByZXR1cm4gW3NlZW5bZGlmZl0sIGldCiAgICAgICAgc2VlbltudW1dID0gaQogICAgcmV0dXJuIFtd",
    language: "python3",
    status: "Accepted",
    tests_passed: 10,
    tests_total: 10,
    execution_time_ms: 15,
    memory_kb: 4120,
    ast_complexity_score: 1.2,
    cognitive_effort_index: 4.8,
    created_at: "Just now",
    raw_created_at: new Date().toISOString(),
  },
  {
    id: "sub-102",
    problem_id: "prob-102",
    problem_title: "Balanced BST Verification — AST Recursion",
    code_base64: "ZGVmIGlzX2JhbGFuY2VkKHJvb3QpOgogICAgIyBNSVNTSU5HIEJBU0UgQ0FTRQogICAgbGVmdF9oID0gaGVpZ2h0KHJvb3QubGVmdCkKICAgIHJpZ2h0X2ggPSBoZWlnaHQocm9vdC5yaWdodCkKICAgIHJldHVybiBhYnMobGVmdF9oIC0gcmlnaHRfaCkgPD0gMQ==",
    language: "python3",
    status: "WA",
    tests_passed: 3,
    tests_total: 10,
    execution_time_ms: 28,
    memory_kb: 4890,
    ast_complexity_score: 2.1,
    cognitive_effort_index: 4.31,
    ai_hint_text: "What is the base condition for a recursive function that checks if a binary tree is height-balanced?",
    created_at: "10 minutes ago",
    raw_created_at: new Date(Date.now() - 600000).toISOString(),
  },
  {
    id: "sub-103",
    problem_id: "prob-101",
    problem_title: "Two Sum — Optimal Structural Indexing",
    code_base64: "ZGVmIHR3b19zdW0obnVtcywgdGFyZ2V0KToKICAgICMgSW5pdGlhbCBuYWl2ZSBhcFByb2FjaCAoTygxMCkgdGVzdHMgZmFpbGVkKQogICAgZm9yIGkgaW4gcmFuZ2UobGVuKG51bXMpKToKICAgICAgICBmb3IgaiBpbiByYW5nZShpICsgMSwgbGVuKG51bXMpKToKICAgICAgICAgICAgaWYgbnVtc1tpXSArIG51bXNbal0gPT0gdGFyZ2V0OgogICAgICAgICAgICAgICAgcmV0dXJuIFtpLCBqXQogICAgcmV0dXJuIFtd",
    language: "python3",
    status: "WA",
    tests_passed: 0,
    tests_total: 10,
    execution_time_ms: 42,
    memory_kb: 4950,
    ast_complexity_score: 1.8,
    cognitive_effort_index: 10.31,
    ai_hint_text: "How can you utilize a dictionary to keep track of the numbers you've seen and their indices to efficiently find the two numbers that add up to the target?",
    created_at: "25 minutes ago",
    raw_created_at: new Date(Date.now() - 1500000).toISOString(),
  },
];

const mockMetrics: SubmissionMetric[] = [
  { attempt: 1, cognitive_effort_index: 10.31, execution_time_ms: 42, ast_complexity_score: 1.8, status: "WA" },
  { attempt: 2, cognitive_effort_index: 4.31, execution_time_ms: 28, ast_complexity_score: 2.1, status: "WA" },
  { attempt: 3, cognitive_effort_index: 3.50, execution_time_ms: 22, ast_complexity_score: 1.5, status: "WA" },
  { attempt: 4, cognitive_effort_index: 4.80, execution_time_ms: 15, ast_complexity_score: 1.2, status: "Accepted" },
];

export default function ProfileDashboardPage() {
  const router = useRouter();
  const { user, isAuthenticated, login } = useAuth();

  const [username, setUsername] = useState<string>("Student Researcher");
  const [email, setEmail] = useState<string>("student@u-aizu.ac.jp");
  const [role, setRole] = useState<string>("Watanobe Lab Candidate");
  const [saving, setSaving] = useState<boolean>(false);
  const [saveSuccess, setSaveSuccess] = useState<boolean>(false);
  const [submissions, setSubmissions] = useState<SubmissionHistoryItem[]>(mockHistory);
  const [metrics, setMetrics] = useState<SubmissionMetric[]>(mockMetrics);
  const [selectedReplay, setSelectedReplay] = useState<{ problemTitle: string; attempts: PlaybackAttempt[] } | null>(null);

  const openReplayForProblem = (sub: SubmissionHistoryItem) => {
    const matchingAttempts: PlaybackAttempt[] = submissions
      .filter((s) => s.problem_title === sub.problem_title || (s.problem_id && sub.problem_id && s.problem_id === sub.problem_id))
      .map((s) => ({
        id: s.id,
        code_base64: s.code_base64 || "IyBObyBoaXN0b3JpY2FsIGNvZGUgc3NuYXBzaG90IHJlY29yZGVkIGZvciB0aGlzIGF0dGVtcHQu",
        status: s.status,
        execution_time_ms: s.execution_time_ms,
        cognitive_effort_index: s.cognitive_effort_index,
        ast_complexity_score: s.ast_complexity_score,
        created_at: s.created_at,
        raw_created_at: s.raw_created_at || s.created_at,
        language: s.language,
      }));
    setSelectedReplay({ problemTitle: sub.problem_title, attempts: matchingAttempts });
  };

  const [statsSummary, setStatsSummary] = useState<{
    solved_problems: number;
    total_problems: number;
    cognitive_effort_index: number;
    avg_ast_complexity: number;
    hints_received: number;
  }>({
    solved_problems: 1,
    total_problems: 14,
    cognitive_effort_index: 4.80,
    avg_ast_complexity: 1.65,
    hints_received: 2,
  });

  useEffect(() => {
    const fetchUserDataAndStats = async () => {
      if (user) {
        if (user.username) setUsername(user.username);
        if (user.email) setEmail(user.email);
        if (user.role) setRole(user.role);
      } else {
        const savedUser = typeof window !== "undefined" ? localStorage.getItem("custom_user_profile") : null;
        if (savedUser) {
          try {
            const parsed = JSON.parse(savedUser);
            if (parsed.username) setUsername(parsed.username);
            if (parsed.email) setEmail(parsed.email);
          } catch (e) {}
        }
      }

      try {
        const token = typeof window !== "undefined" ? localStorage.getItem("jwt_token") : null;
        const headers = token ? { Authorization: `Bearer ${token}` } : {};
        const userID = user?.id || "00000000-0000-0000-0000-000000000001";

        const statsRes = await axios.get(`${API_URL}/api/v1/users/${userID}/stats`, { headers });
        if (statsRes.data) {
          const d = statsRes.data;
          setStatsSummary({
            solved_problems: d.solved_problems !== undefined ? d.solved_problems : 1,
            total_problems: d.total_problems !== undefined ? d.total_problems : 14,
            cognitive_effort_index: d.cognitive_effort_index !== undefined ? Number(d.cognitive_effort_index.toFixed(2)) : 4.80,
            avg_ast_complexity: d.avg_ast_complexity !== undefined ? Number(d.avg_ast_complexity.toFixed(2)) : 1.65,
            hints_received: d.hints_received !== undefined ? d.hints_received : 2,
          });
        }

        const subsRes = await axios.get(`${API_URL}/api/v1/users/${userID}/submissions`, { headers });
        if (subsRes.data && Array.isArray(subsRes.data.submissions)) {
          const fetchedSubs = subsRes.data.submissions.map((item: any) => ({
            id: item.id || `sub-${Math.random().toString(36).substring(2, 7)}`,
            problem_id: item.problem_id || "",
            problem_title: item.problem_title || "Algorithmic Challenge",
            code_base64: item.code_base64 || "",
            language: item.language || "python3",
            status: item.status || "Pending",
            tests_passed: item.tests_passed !== undefined ? item.tests_passed : 0,
            tests_total: item.tests_total !== undefined ? item.tests_total : 10,
            execution_time_ms: item.execution_time_ms !== undefined ? item.execution_time_ms : 15,
            memory_kb: item.memory_kb !== undefined ? item.memory_kb : 4120,
            ast_complexity_score: item.ast_complexity_score !== undefined ? item.ast_complexity_score : 1.2,
            cognitive_effort_index: item.cognitive_effort_index !== undefined ? item.cognitive_effort_index : 2.5,
            ai_hint_text: item.ai_hint_text || undefined,
            created_at: item.created_at ? new Date(item.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }) : "Just now",
            raw_created_at: item.created_at || new Date().toISOString(),
          }));
          setSubmissions(fetchedSubs);

          const dynamicChart = fetchedSubs
            .slice()
            .reverse()
            .map((sub: any, index: number) => ({
              attempt: index + 1,
              cognitive_effort_index: sub.cognitive_effort_index || 2.5,
              execution_time_ms: sub.execution_time_ms || 15,
              ast_complexity_score: sub.ast_complexity_score || 1.2,
              status: sub.status || "Pending",
            }));
          setMetrics(dynamicChart);
        }
      } catch (err) {
        console.warn("Could not fetch dynamic EDM profile data, using fallback:", err);
      }
    };

    fetchUserDataAndStats();
  }, [user]);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSaveSuccess(false);

    // Save locally immediately for snappy responsive update
    if (typeof window !== "undefined") {
      const profileData = { username, email, role };
      localStorage.setItem("custom_user_profile", JSON.stringify(profileData));
      
      // Update existing JWT auth context user object in storage if logged in
      const existingUserStr = localStorage.getItem("user");
      if (existingUserStr) {
        try {
          const existingUser = JSON.parse(existingUserStr);
          existingUser.username = username;
          existingUser.email = email;
          localStorage.setItem("user", JSON.stringify(existingUser));
        } catch (err) {}
      }
    }

    // Try updating backend API if endpoint is available
    try {
      const token = typeof window !== "undefined" ? localStorage.getItem("jwt_token") : null;
      if (token) {
        await axios.put(
          `${API_URL}/users/profile`,
          { username, email },
          { headers: { Authorization: `Bearer ${token}` } }
        );
      }
    } catch (err) {
      // Ignore API errors for profile demo if backend endpoint is read-only
    }

    setTimeout(() => {
      setSaving(false);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3500);
      // Reload window briefly so Navbar catches the new username immediately
      if (typeof window !== "undefined") {
        window.location.reload();
      }
    }, 400);
  };

  return (
    <div className="flex-1 flex flex-col max-w-7xl w-full mx-auto px-6 py-10 space-y-12">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-900/10">
        <div>
          <Link
            href="/"
            className="inline-flex items-center text-xs font-mono text-slate-500 hover:text-slate-900 transition-colors mb-2"
          >
            <ArrowLeft className="w-3.5 h-3.5 mr-1" />
            Back to Problem Set
          </Link>
          <h1 className="text-3xl font-serif font-semibold text-slate-900 tracking-tight flex items-center">
            <User className="w-7 h-7 mr-3 text-amber-800" />
            Student Profile & EDM Analytics Dashboard
          </h1>
          <p className="text-sm text-slate-600 mt-1">
            Manage your personal researcher identity and inspect your effort-based metrics across the ZPD trajectory.
          </p>
        </div>
        <div className="flex items-center space-x-3 bg-amber-50/80 border border-amber-900/15 px-4 py-2.5 rounded-xl">
          <Sparkles className="w-4 h-4 text-amber-800 animate-pulse" />
          <span className="text-xs font-mono text-amber-950 font-medium">
            Cognitive Effort Index: {statsSummary.cognitive_effort_index} (Optimal ZPD Zone)
          </span>
        </div>
      </div>

      {/* Grid: Left Column (Edit Profile), Right Column (EDM Summary Cards) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Edit Profile Form (5 cols) */}
        <div className="lg:col-span-5 bg-ivory-100 p-6 sm:p-8 rounded-2xl border border-slate-900/10 shadow-sm space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-slate-900/10">
            <h2 className="text-lg font-serif font-semibold text-slate-900 tracking-tight flex items-center">
              <Shield className="w-4 h-4 mr-2 text-slate-700" />
              Profile Configuration
            </h2>
            <span className="text-[10px] font-mono uppercase bg-slate-900/5 text-slate-600 px-2 py-0.5 rounded">
              {role}
            </span>
          </div>

          <form onSubmit={handleSaveProfile} className="space-y-4">
            <div>
              <label className="block text-xs font-mono text-slate-600 uppercase tracking-wider mb-1.5">
                Full Username / Display Name
              </label>
              <div className="relative">
                <User className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                  className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-ivory-200/60 border border-slate-900/15 text-sm text-slate-900 font-sans focus:outline-none focus:border-slate-900 transition-colors"
                  placeholder="e.g. Asylann Candidate"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-mono text-slate-600 uppercase tracking-wider mb-1.5">
                Academic Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-ivory-200/60 border border-slate-900/15 text-sm text-slate-900 font-sans focus:outline-none focus:border-slate-900 transition-colors"
                  placeholder="s1234567@u-aizu.ac.jp"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-mono text-slate-600 uppercase tracking-wider mb-1.5">
                Research Affiliation Role
              </label>
              <input
                type="text"
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl bg-ivory-200/60 border border-slate-900/15 text-sm text-slate-900 font-sans focus:outline-none focus:border-slate-900 transition-colors"
              />
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={saving}
                className="w-full inline-flex items-center justify-center space-x-2 px-6 py-3 rounded-xl bg-slate-900 text-ivory-100 text-xs font-semibold uppercase tracking-wider transition-all duration-300 ease-out hover:bg-slate-800 hover:scale-[1.01] shadow-sm disabled:opacity-50"
              >
                {saving ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin mr-2" />
                    <span>Saving Changes...</span>
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    <span>Save Profile Changes</span>
                  </>
                )}
              </button>
            </div>

            {saveSuccess && (
              <motion.div
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-3 rounded-xl bg-emerald-50 border border-emerald-900/20 text-xs font-sans text-emerald-900 flex items-center space-x-2"
              >
                <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
                <span>Profile successfully updated! Reloading preferences...</span>
              </motion.div>
            )}
          </form>
        </div>

        {/* Right Column: Key EDM Metrics & Progression Stats (7 cols) */}
        <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-6 content-start">
          <div className="bg-ivory-100 p-6 rounded-2xl border border-slate-900/10 shadow-sm flex flex-col justify-between space-y-4">
            <div className="flex items-center justify-between text-slate-500 font-mono text-xs">
              <span>SOLVED PROBLEMS</span>
              <Award className="w-4 h-4 text-amber-600" />
            </div>
            <div>
              <span className="text-3xl font-serif font-bold text-slate-900 tracking-tight block">
                {statsSummary.solved_problems} / {statsSummary.total_problems}
              </span>
              <span className="text-xs text-slate-500 mt-1 block">
                Sandboxed Isolate Cgroup Verification
              </span>
            </div>
          </div>

          <div className="bg-ivory-100 p-6 rounded-2xl border border-slate-900/10 shadow-sm flex flex-col justify-between space-y-4">
            <div className="flex items-center justify-between text-slate-500 font-mono text-xs">
              <span>COGNITIVE EFFORT INDEX</span>
              <Activity className="w-4 h-4 text-emerald-600" />
            </div>
            <div>
              <span className="text-3xl font-serif font-bold text-slate-900 tracking-tight block">
                {statsSummary.cognitive_effort_index}
              </span>
              <span className="text-xs text-slate-500 mt-1 block">
                Effort-Based Analytics (Non-Binary Grading)
              </span>
            </div>
          </div>

          <div className="bg-ivory-100 p-6 rounded-2xl border border-slate-900/10 shadow-sm flex flex-col justify-between space-y-4">
            <div className="flex items-center justify-between text-slate-500 font-mono text-xs">
              <span>AVG AST COMPLEXITY</span>
              <Code className="w-4 h-4 text-indigo-600" />
            </div>
            <div>
              <span className="text-3xl font-serif font-bold text-slate-900 tracking-tight block">
                {statsSummary.avg_ast_complexity}
              </span>
              <span className="text-xs text-slate-500 mt-1 block">
                gotreesitter Structural Syntax Analysis
              </span>
            </div>
          </div>

          <div className="bg-ivory-100 p-6 rounded-2xl border border-slate-900/10 shadow-sm flex flex-col justify-between space-y-4">
            <div className="flex items-center justify-between text-slate-500 font-mono text-xs">
              <span>SOCRATIC HINTS RECEIVED</span>
              <Sparkles className="w-4 h-4 text-amber-800" />
            </div>
            <div>
              <span className="text-3xl font-serif font-bold text-slate-900 tracking-tight block">
                {statsSummary.hints_received} {statsSummary.hints_received === 1 ? "Hint" : "Hints"}
              </span>
              <span className="text-xs text-slate-500 mt-1 block">
                Zero Full-Solution Leakage Guaranteed
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Effort-Based Recharts Visualization Section */}
      <div className="bg-ivory-100 p-6 sm:p-8 rounded-2xl border border-slate-900/10 shadow-sm space-y-6">
        <div>
          <span className="text-[11px] font-mono uppercase tracking-wider text-amber-800 block mb-1">
            Watanobe Lab EDM Progression Chart
          </span>
          <h3 className="text-xl font-serif font-semibold text-slate-900 tracking-tight flex items-center">
            <Activity className="w-5 h-5 mr-2.5 text-slate-700" />
            Historical Submission Effort Trajectory
          </h3>
        </div>
        <EffortDashboard metrics={metrics} />
      </div>

      {/* Recent Submissions Feed Table */}
      <div className="bg-ivory-100 p-6 sm:p-8 rounded-2xl border border-slate-900/10 shadow-sm space-y-6">
        <div>
          <span className="text-[11px] font-mono uppercase tracking-wider text-slate-500 block mb-1">
            Detailed EDM Log
          </span>
          <h3 className="text-xl font-serif font-semibold text-slate-900 tracking-tight flex items-center">
            <Clock className="w-5 h-5 mr-2.5 text-slate-700" />
            Recent Sandboxed Submissions
          </h3>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-900/10 text-[11px] font-mono uppercase tracking-wider text-slate-500">
                <th className="py-3 px-4">Problem Challenge</th>
                <th className="py-3 px-4">Language</th>
                <th className="py-3 px-4">Verdict</th>
                <th className="py-3 px-4">Tests</th>
                <th className="py-3 px-4">Isolate CPU / RAM</th>
                <th className="py-3 px-4">Effort Index</th>
                <th className="py-3 px-4">Virtual TA Guidance</th>
                <th className="py-3 px-4 text-center">Time-Travel</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-900/5 text-xs font-sans text-slate-800">
              {submissions.map((sub) => (
                <tr key={sub.id} className="hover:bg-slate-900/[0.02] transition-colors">
                  <td className="py-4 px-4 font-serif font-semibold text-slate-900">
                    {sub.problem_title}
                  </td>
                  <td className="py-4 px-4 font-mono text-slate-600 uppercase">
                    {sub.language}
                  </td>
                  <td className="py-4 px-4">
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded font-mono text-[11px] uppercase font-medium ${
                        sub.status === "Accepted"
                          ? "bg-emerald-100 text-emerald-800"
                          : sub.status === "WA" || sub.status === "Wrong Answer"
                          ? "bg-rose-100 text-rose-800"
                          : "bg-amber-100 text-amber-800"
                      }`}
                    >
                      {sub.status === "Accepted" ? (
                        <CheckCircle2 className="w-3 h-3 mr-1" />
                      ) : (
                        <AlertTriangle className="w-3 h-3 mr-1" />
                      )}
                      {sub.status}
                    </span>
                  </td>
                  {/* Tests column: mini progress bar showing X/Y passed */}
                  <td className="py-4 px-4">
                    {sub.tests_total > 0 ? (
                      <div className="flex flex-col gap-1 min-w-[80px]">
                        <span className={`text-[11px] font-mono font-semibold ${
                          sub.tests_passed === sub.tests_total ? "text-emerald-700" :
                          sub.tests_passed === 0 ? "text-red-500" : "text-amber-600"
                        }`}>
                          {sub.tests_passed}/{sub.tests_total}
                        </span>
                        <div className="flex gap-0.5">
                          {Array.from({ length: sub.tests_total }).map((_, i) => (
                            <div key={i} className={`h-1 flex-1 rounded-sm ${
                              i < sub.tests_passed ? "bg-emerald-400" : "bg-red-300/70"
                            }`} />
                          ))}
                        </div>
                      </div>
                    ) : (
                      <span className="text-[11px] font-mono text-slate-400">—</span>
                    )}
                  </td>
                  <td className="py-4 px-4 font-mono text-slate-600">
                    {sub.execution_time_ms} ms / {sub.memory_kb} KB
                  </td>
                  <td className="py-4 px-4 font-mono font-semibold text-amber-900">
                    {sub.cognitive_effort_index.toFixed(2)}
                  </td>
                  <td className="py-4 px-4 text-slate-600 max-w-md line-clamp-2 italic">
                    {sub.ai_hint_text ? `"${sub.ai_hint_text}"` : "— (Clean Acceptance)"}
                  </td>
                  <td className="py-4 px-4 text-center">
                    <button
                      onClick={() => openReplayForProblem(sub)}
                      className="inline-flex items-center space-x-1 px-2.5 py-1.5 rounded-md bg-slate-900 hover:bg-slate-800 text-ivory-100 font-mono text-xs font-bold transition-all shadow-sm"
                      title="Replay code changes across all attempts for this problem"
                    >
                      <PlayCircle className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                      <span>Replay</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Overlay for Time-Travel Code Playback */}
      {selectedReplay && (
        <TimeTravelPlayer
          problemTitle={selectedReplay.problemTitle}
          attempts={selectedReplay.attempts}
          onClose={() => setSelectedReplay(null)}
        />
      )}
    </div>
  );
}
