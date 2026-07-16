import React, { useEffect, useState } from "react";
import Link from "next/link";
import axios from "axios";
import { motion } from "framer-motion";
import { EffortDashboard, SubmissionMetric } from "@/components/EffortDashboard";
import { Leaderboard } from "@/components/Leaderboard";
import { ChallengeOfTheDay } from "@/components/ChallengeOfTheDay";
import { ArrowUpRight, BookOpen, Sparkles, Activity, Code, Award, Search, Filter } from "lucide-react";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

interface Problem {
  id: string;
  title: string;
  description: string;
  difficulty?: string;
  difficulty_score: number;
  test_cases?: any[];
}

const HERO_TEXT = "AI-Powered Online Judge with Socratic Virtual TA & Effort-Based EDM.";
const HERO_SUBTEXT = "Designed for Prof. Yutaka Watanobe's lab at the University of Aizu. Experience secure sandboxed execution, gotreesitter AST structural complexity analysis, and adaptive Zone of Proximal Development (ZPD) recommendations.";

// Staggered word animation helper for the Anthropic hero reveal
const containerVariants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.06,
    },
  },
};

const wordVariants = {
  hidden: {
    opacity: 0,
    y: 24,
  },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.6,
      ease: [0.16, 1, 0.3, 1],
    },
  },
};

const mockProblems: Problem[] = [
  {
    id: "a0000000-0000-4000-a000-000000000001",
    title: "Two Sum — Optimal Structural Indexing",
    description: "Given an array of integers `nums` and an integer `target`, return indices of the two numbers such that they add up to `target`.\nYou may assume that each input would have exactly one solution, and you may not use the same element twice.\nEvaluate algorithmic complexity inside the isolate cgroup.\n\n### Example 1:\n**Input:**\n2 7 11 15\n9\n**Output:**\n0 1",
    difficulty_score: 1.2,
    difficulty: "easy",
  },
  {
    id: "a0000000-0000-4000-a000-000000000002",
    title: "Palindrome Number — Digit Reversal AST",
    description: "Given an integer `x`, determine if `x` is a palindrome integer (reads the same backward as forward).\nDo not convert the integer into a string if possible; structural loop analysis will evaluate your space efficiency.\n\n### Example 1:\n**Input:**\n121\n**Output:**\ntrue",
    difficulty_score: 1.5,
    difficulty: "easy",
  },
  {
    id: "a0000000-0000-4000-a000-000000000003",
    title: "Valid Parentheses — Stack Invariants",
    description: "Given a string `s` containing just the characters '(', ')', '{', '}', '[' and ']', determine if the input string is valid.\nAn input string is valid if open brackets are closed by the same type of brackets in the correct order.\n\n### Example 1:\n**Input:**\n()[]{}\n**Output:**\ntrue",
    difficulty_score: 1.8,
    difficulty: "easy",
  },
  {
    id: "a0000000-0000-4000-a000-000000000004",
    title: "Maximum Subarray — Kadane's Algorithm",
    description: "Given an integer array `nums`, find the contiguous subarray with the largest sum, and return its sum.\nYour algorithm should run in O(N) time inside the sandboxed cgroup.\n\n### Example 1:\n**Input:**\n-2 1 -3 4 -1 2 1 -5 4\n**Output:**\n6",
    difficulty_score: 1.9,
    difficulty: "easy",
  },
  {
    id: "a0000000-0000-4000-a000-000000000005",
    title: "Balanced BST Verification — AST Recursion Depth",
    description: "Verify if a binary tree (represented in level-order traversal format) is height-balanced. A height-balanced binary tree is one in which the depth of the two subtrees of every node never differs by more than one.\n\n### Example 1:\n**Input:**\n3 9 20 -1 -1 15 7\n**Output:**\ntrue",
    difficulty_score: 2.3,
    difficulty: "medium",
  },
  {
    id: "a0000000-0000-4000-a000-000000000006",
    title: "Longest Substring Without Repeating Characters",
    description: "Given a string `s`, find the length of the longest substring without repeating characters using the sliding window structural pattern.\n\n### Example 1:\n**Input:**\nabcabcbb\n**Output:**\n3",
    difficulty_score: 2.6,
    difficulty: "medium",
  },
  {
    id: "a0000000-0000-4000-a000-000000000007",
    title: "Group Anagrams — Structural Hash Mapping",
    description: "Given an array of strings, group the anagrams together. You can output the groups sorted lexicographically.\n\n### Example 1:\n**Input:**\neat tea tan ate nat bat\n**Output:**\nbat\nnat tan\nate eat tea",
    difficulty_score: 2.9,
    difficulty: "medium",
  },
  {
    id: "a0000000-0000-4000-a000-000000000008",
    title: "Coin Change — Dynamic Programming Bottom-Up",
    description: "You are given an integer array `coins` representing coins of different denominations and an integer `amount` representing a total amount of money. Return the fewest number of coins that you need to make up that amount.\n\n### Example 1:\n**Input:**\n1 2 5\n11\n**Output:**\n3",
    difficulty_score: 3.2,
    difficulty: "medium",
  },
  {
    id: "a0000000-0000-4000-a000-000000000009",
    title: "0/1 Knapsack Optimization — ZPD Challenge",
    description: "Solve the 0/1 knapsack optimization problem within minimal memory constraints. Given `N` items with weights and values, find the maximum value you can pack into a knapsack of capacity `W`.\n\n### Example 1:\n**Input:**\n3 50\n10 60\n20 100\n30 120\n**Output:**\n220",
    difficulty_score: 3.5,
    difficulty: "medium",
  },
  {
    id: "a0000000-0000-4000-a000-000000000010",
    title: "Course Schedule — Topological Sort (Kahn's Algorithm)",
    description: "There are `numCourses` courses you have to take. Given the total number of courses and a list of prerequisite pairs `[a, b]`, return `true` if it is possible to finish all courses, or `false` otherwise (detect cycle).\n\n### Example 1:\n**Input:**\n2 1\n1 0\n**Output:**\ntrue",
    difficulty_score: 3.8,
    difficulty: "medium",
  },
  {
    id: "a0000000-0000-4000-a000-000000000011",
    title: "Merge K Sorted Lists — Priority Queue / Divide & Conquer",
    description: "You are given `k` linked-lists, each sorted in ascending order. Merge all the linked-lists into one sorted linked-list and return it. Evaluate runtime heap operations inside the sandboxed container.\n\n### Example 1:\n**Input:**\n3\n1 4 5\n1 3 4\n2 6\n**Output:**\n1 1 2 3 4 4 5 6",
    difficulty_score: 4.1,
    difficulty: "hard",
  },
  {
    id: "a0000000-0000-4000-a000-000000000012",
    title: "Trapping Rain Water — Two Pointer Monotonic Stack",
    description: "Given `n` non-negative integers representing an elevation map where the width of each bar is 1, compute how much water it can trap after raining.\n\n### Example 1:\n**Input:**\n0 1 0 2 1 0 1 3 2 1 2 1\n**Output:**\n6",
    difficulty_score: 4.4,
    difficulty: "hard",
  },
  {
    id: "a0000000-0000-4000-a000-000000000013",
    title: "N-Queens — Backtracking with Bitwise Optimization",
    description: "The N-Queens puzzle is the problem of placing `N` chess queens on an `N x N` chessboard such that no two queens attack each other. Given `N`, return the number of distinct solutions.\n\n### Example 1:\n**Input:**\n4\n**Output:**\n2",
    difficulty_score: 4.8,
    difficulty: "hard",
  },
  {
    id: "a0000000-0000-4000-a000-000000000014",
    title: "Alien Dictionary — Graph Topological Ordering",
    description: "There is a new alien language that uses the Latin alphabet. Derive the order of letters in this language from a sorted list of alien words.\n\n### Example 1:\n**Input:**\nwrt wrf er ett rftt\n**Output:**\nwertf",
    difficulty_score: 5.2,
    difficulty: "hard",
  },
];

const mockMetrics: SubmissionMetric[] = [];

export default function DashboardPage() {
  const [problems, setProblems] = useState<Problem[]>(mockProblems);
  const [metrics, setMetrics] = useState<SubmissionMetric[]>([]);
  const [loadingProblems, setLoadingProblems] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [difficultyFilter, setDifficultyFilter] = useState<string>("all");

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const response = await axios.get(`${API_URL}/problems`);
        const probData = response.data?.problems || response.data;
        if (probData && Array.isArray(probData) && probData.length > 0) {
          setProblems(probData);
        }
      } catch (err) {
        console.warn("Could not fetch problems from backend API, defaulting to mock canonical problems.", err);
      } finally {
        setLoadingProblems(false);
      }
    };

    const fetchEDMMetrics = async () => {
      try {
        const token = typeof window !== "undefined" ? localStorage.getItem("jwt_token") : null;
        const userStr = typeof window !== "undefined" ? localStorage.getItem("user") : null;
        if (!token || !userStr) return;
        const user = JSON.parse(userStr);
        if (!user?.id) return;
        const res = await axios.get(`${API_URL}/users/${user.id}/submissions`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = res.data;
        const subs: any[] = data?.submissions || data || [];
        if (subs.length > 0) {
          const mapped: SubmissionMetric[] = subs.slice(0, 30).map((s: any, idx: number) => ({
            attempt: idx + 1,
            cognitive_effort_index: Number(s.cognitive_effort_index) || 0,
            execution_time_ms: Number(s.execution_time_ms) || 0,
            ast_complexity_score: Number(s.ast_complexity_score) || 0,
            status: s.status ?? "WA",
          }));
          setMetrics(mapped);
        }
      } catch (err) {
        console.warn("Could not fetch EDM metrics:", err);
      }
    };

    fetchDashboardData();
    fetchEDMMetrics();
  }, []);

  const filteredProblems = problems.filter((prob) => {
    const matchesSearch =
      prob.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      prob.description.toLowerCase().includes(searchQuery.toLowerCase());

    if (!matchesSearch) return false;

    if (difficultyFilter === "easy") return prob.difficulty_score < 2.0 || prob.difficulty === "easy";
    if (difficultyFilter === "medium") return (prob.difficulty_score >= 2.0 && prob.difficulty_score < 3.8) || prob.difficulty === "medium";
    if (difficultyFilter === "hard") return prob.difficulty_score >= 3.8 || prob.difficulty === "hard";
    return true;
  });

  return (
    <div className="flex-1 flex flex-col max-w-7xl w-full mx-auto px-6 py-12 sm:py-16 space-y-20">
      {/* Hero Section with Staggered Word Reveal */}
      <section className="max-w-4xl">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4 }}
          className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-ivory-200/80 border border-slate-900/10 text-xs font-mono tracking-wider text-amber-800 uppercase mb-6"
        >
          <Sparkles className="w-3.5 h-3.5 text-amber-600" />
          <span>Society 5.0 Smart Learning & Educational Data Mining</span>
        </motion.div>

        <motion.h1
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="text-4xl sm:text-5xl lg:text-6xl font-serif font-medium text-slate-900 tracking-tight leading-[1.15] flex flex-wrap gap-x-3 gap-y-1"
        >
          {HERO_TEXT.split(" ").map((word, index) => (
            <motion.span key={index} variants={wordVariants} className="inline-block">
              {word}
            </motion.span>
          ))}
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.5, ease: [0.16, 1, 0.3, 1] }}
          className="text-base sm:text-lg text-slate-600 font-sans tracking-tight leading-relaxed mt-6 max-w-3xl"
        >
          {HERO_SUBTEXT}
        </motion.p>
      </section>

      {/* Challenge of the Day (24h Featured Banner) */}
      <ChallengeOfTheDay />

      {/* Algorithmic Problems List */}
      <section className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-4 border-b border-slate-900/10">
          <div>
            <h2 className="text-2xl font-serif font-semibold text-slate-900 tracking-tight flex items-center">
              <Code className="w-5 h-5 mr-2.5 text-slate-700" />
              Zone of Proximal Development (ZPD) Problem Set
            </h2>
            <p className="text-sm text-slate-500 mt-1">
              Select an algorithmic challenge tailored to your current structural competence.
            </p>
          </div>
          <span className="text-xs font-mono text-slate-400 self-start sm:self-auto">
            {filteredProblems.length} / {problems.length} Canonical Problems
          </span>
        </div>

        {/* Search & Difficulty Filter Bar */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 bg-ivory-200/50 p-4 rounded-2xl border border-slate-900/10">
          <div className="md:col-span-7 relative">
            <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
            <input
              type="text"
              placeholder="Search problems by name or algorithmic concept..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-xl bg-ivory-100 border border-slate-900/15 text-xs text-slate-800 font-sans focus:outline-none focus:border-slate-900 transition-colors placeholder:text-slate-400"
            />
          </div>

          <div className="md:col-span-5 flex items-center space-x-2">
            <Filter className="w-4 h-4 text-slate-500 hidden sm:block ml-1" />
            <div className="flex-1 grid grid-cols-4 gap-1.5 bg-ivory-100 p-1 rounded-xl border border-slate-900/15">
              {[
                { label: "All", value: "all" },
                { label: "Easy", value: "easy" },
                { label: "Medium", value: "medium" },
                { label: "Hard", value: "hard" },
              ].map((tab) => (
                <button
                  key={tab.value}
                  onClick={() => setDifficultyFilter(tab.value)}
                  className={`py-1.5 rounded-lg text-[11px] font-mono tracking-tight font-medium transition-all ${
                    difficultyFilter === tab.value
                      ? "bg-slate-900 text-ivory-100 shadow-sm"
                      : "text-slate-600 hover:text-slate-900 hover:bg-slate-900/5"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-2">
          {filteredProblems.map((prob, idx) => (
            <motion.div
              key={prob.id}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.1 * idx }}
              className="group flex flex-col justify-between bg-ivory-100 p-6 rounded-2xl border border-slate-900/10 transition-all duration-300 ease-out hover:border-slate-900/30 hover:scale-[1.02] shadow-sm relative overflow-hidden"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-mono uppercase px-2 py-0.5 rounded bg-slate-900/5 text-slate-700">
                    Difficulty: {prob.difficulty_score.toFixed(1)}
                  </span>
                  <Award className="w-4 h-4 text-slate-400 group-hover:text-amber-600 transition-colors" />
                </div>

                <h3 className="text-lg font-serif font-semibold text-slate-900 tracking-tight group-hover:text-amber-800 transition-colors">
                  {prob.title}
                </h3>

                <p className="text-xs text-slate-600 font-sans line-clamp-3 leading-relaxed tracking-tight">
                  {prob.description}
                </p>
              </div>

              <div className="pt-6 mt-4 border-t border-slate-900/5 flex items-center justify-between">
                <span className="text-[11px] font-mono text-slate-500">
                  Sandboxed Isolate Cgroup
                </span>
                <Link
                  href={`/problems/${prob.id}`}
                  className="inline-flex items-center text-xs font-semibold text-slate-900 group-hover:text-amber-800 tracking-tight transition-colors"
                >
                  <span>Solve Problem</span>
                  <ArrowUpRight className="w-3.5 h-3.5 ml-1 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                </Link>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Effort-Based Metrics Dashboard (EDM Section) */}
      <section id="edm-dashboard" className="space-y-6 pt-6">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-4 border-b border-slate-900/10">
          <div>
            <span className="text-[11px] font-mono uppercase tracking-wider text-amber-800 block mb-1">
              Educational Data Mining (EDM) Architecture
            </span>
            <h2 className="text-2xl font-serif font-semibold text-slate-900 tracking-tight flex items-center">
              <Activity className="w-5 h-5 mr-2.5 text-slate-700" />
              Student Cognitive Effort & AST Complexity Analytics
            </h2>
          </div>
          <span className="text-xs font-sans text-slate-500 max-w-xs">
            Tracking non-binary metrics across your ZPD trajectory per Prof. Watanobe&apos;s effort-based evaluation model.
          </span>
        </div>

        <div className="bg-ivory-100 p-6 sm:p-8 rounded-2xl border border-slate-900/10 shadow-sm">
          <EffortDashboard metrics={metrics} />
        </div>
      </section>

      {/* Engagement & Gamification (Leaderboard Section) */}
      <section id="leaderboard" className="space-y-6 pt-6 pb-12">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-4 border-b border-slate-900/10">
          <div>
            <span className="text-[11px] font-mono uppercase tracking-wider text-amber-800 block mb-1">
              Phase 11: Engagement & Gamification
            </span>
            <h2 className="text-2xl font-serif font-semibold text-slate-900 tracking-tight flex items-center">
              <Award className="w-5 h-5 mr-2.5 text-slate-700" />
              Real-Time Global Rankings
            </h2>
          </div>
          <span className="text-xs font-sans text-slate-500 max-w-xs">
            Powered by Redis O(log N) Sorted Sets (ZADD / ZRANGE) tracking solved problems and points across the platform.
          </span>
        </div>

        <Leaderboard />
      </section>
    </div>
  );
}
