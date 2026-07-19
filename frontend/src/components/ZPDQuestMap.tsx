import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import {
  CheckCircle2,
  Lock,
  Compass,
  MapPin,
  Flame,
  Award,
  Layers,
  Code,
  ChevronRight,
  Zap,
  Activity,
  Cpu,
  RefreshCw,
  GitBranch,
  Box,
  Terminal,
  Trophy,
} from "lucide-react";

interface Problem {
  id: string;
  title: string;
  description?: string;
  difficulty_score?: number;
  difficulty?: string;
  module_id?: string | null;
  sequential_order?: number;
}

interface Module {
  id: string;
  title: string;
  description?: string;
  sequential_order: number;
}

interface ZPDQuestMapProps {
  modules?: Module[];
  problems: Problem[];
  userSubmissions?: any[];
}

/**
 * 3D Topic Hologram Renderer
 * Analyzes problem title and description to render a live, dynamic 3D-styled animated simulation
 * (e.g. Palindrome string converter, Array Pointer Scanner, LIFO Stack, AST Tree, or Graph Mesh).
 */
const renderTopicHologram = (title: string = "", description: string = "", isPassed: boolean = false) => {
  const combined = `${title} ${description}`.toLowerCase();

  // 1. Palindrome / String / Reverse / Character Simulation
  if (
    combined.includes("palindrome") ||
    combined.includes("reverse") ||
    combined.includes("string") ||
    combined.includes("word") ||
    combined.includes("anagram") ||
    combined.includes("char")
  ) {
    return (
      <div className="my-3 p-3.5 rounded-xl bg-slate-950 border border-amber-500/30 text-ivory-100 font-mono text-xs relative overflow-hidden shadow-inner [perspective:600px]">
        <div className="flex items-center justify-between border-b border-slate-800 pb-1.5 mb-2.5">
          <span className="text-[10px] uppercase font-bold text-amber-400 flex items-center gap-1.5">
            <RefreshCw className="w-3 h-3 animate-spin text-amber-400" />
            <span>3D Palindrome Symmetry Engine</span>
          </span>
          <span className="text-[10px] text-emerald-400 bg-emerald-950/80 px-1.5 py-0.5 rounded border border-emerald-500/30 font-bold">
            O(N) Dual-Pointer
          </span>
        </div>
        <div className="flex items-center justify-center gap-2 py-2 transform-gpu rotate-x-6">
          {["R", "A", "D", "A", "R"].map((char, cIdx) => (
            <motion.div
              key={cIdx}
              animate={{
                scale: cIdx === 2 ? [1, 1.15, 1] : [1, 1.05, 1],
                y: cIdx % 2 === 0 ? [-2, 2, -2] : [2, -2, 2],
                rotateY: [0, 180, 360],
              }}
              transition={{
                duration: 4 + cIdx * 0.5,
                repeat: Infinity,
                ease: "easeInOut",
              }}
              className={`w-8 h-9 rounded-lg border flex items-center justify-center font-bold text-sm shadow-md ${
                cIdx === 0 || cIdx === 4
                  ? "border-amber-500 bg-amber-500/20 text-amber-300"
                  : cIdx === 1 || cIdx === 3
                  ? "border-emerald-500 bg-emerald-500/20 text-emerald-300"
                  : "border-slate-600 bg-slate-900 text-ivory-100"
              }`}
            >
              {char}
            </motion.div>
          ))}
        </div>
        <div className="flex items-center justify-between text-[10px] text-slate-400 mt-2 border-t border-slate-900 pt-1.5">
          <span>Ptr Left: [0] &apos;R&apos; ──►</span>
          <span className="font-bold text-amber-300 animate-pulse">Mirror Verified ⇄</span>
          <span>◄── Ptr Right: [4] &apos;R&apos;</span>
        </div>
      </div>
    );
  }

  // 2. Array / Iteration / Two Sum / Pointers Simulation
  if (
    combined.includes("sum") ||
    combined.includes("array") ||
    combined.includes("iteration") ||
    combined.includes("two") ||
    combined.includes("pointer") ||
    combined.includes("fundamental")
  ) {
    return (
      <div className="my-3 p-3.5 rounded-xl bg-slate-950 border border-slate-800 text-ivory-100 font-mono text-xs relative overflow-hidden shadow-inner [perspective:600px]">
        <div className="flex items-center justify-between border-b border-slate-800 pb-1.5 mb-2.5">
          <span className="text-[10px] uppercase font-bold text-emerald-400 flex items-center gap-1.5">
            <Cpu className="w-3 h-3 text-emerald-400" />
            <span>3D Array Index & Target Scanner</span>
          </span>
          <span className="text-[10px] text-amber-400 bg-amber-950/80 px-1.5 py-0.5 rounded border border-amber-500/30 font-bold">
            Target = 9
          </span>
        </div>
        <div className="grid grid-cols-4 gap-2 py-1.5">
          {[{ v: 2, idx: 0, hit: true }, { v: 7, idx: 1, hit: true }, { v: 11, idx: 2, hit: false }, { v: 15, idx: 3, hit: false }].map((item, idx) => (
            <motion.div
              key={idx}
              whileHover={{ scale: 1.05 }}
              animate={item.hit ? { y: [-2, 2, -2], borderColor: ["#f59e0b", "#10b981", "#f59e0b"] } : {}}
              transition={{ duration: 3, repeat: Infinity }}
              className={`p-2 rounded-lg border text-center relative ${
                item.hit
                  ? "bg-amber-500/15 border-amber-500/60 shadow-[0_0_12px_rgba(245,158,11,0.3)]"
                  : "bg-slate-900 border-slate-800 text-slate-500"
              }`}
            >
              <div className="text-[9px] text-slate-400 uppercase">Index [{item.idx}]</div>
              <div className={`font-black text-sm mt-0.5 ${item.hit ? "text-amber-300" : "text-slate-400"}`}>
                {item.v}
              </div>
            </motion.div>
          ))}
        </div>
        <div className="flex items-center justify-center gap-1.5 text-[10px] text-emerald-400 mt-2 bg-emerald-950/40 py-1 rounded border border-emerald-500/20">
          <span>⚡ Match Found: nums[0] (2) + nums[1] (7) = 9</span>
        </div>
      </div>
    );
  }

  // 3. Stacks / Brackets / Hash Map / Monotonic Simulation
  if (
    combined.includes("stack") ||
    combined.includes("bracket") ||
    combined.includes("parenthes") ||
    combined.includes("hash") ||
    combined.includes("map") ||
    combined.includes("window") ||
    combined.includes("monotonic")
  ) {
    return (
      <div className="my-3 p-3.5 rounded-xl bg-slate-950 border border-slate-800 text-ivory-100 font-mono text-xs relative overflow-hidden shadow-inner [perspective:600px]">
        <div className="flex items-center justify-between border-b border-slate-800 pb-1.5 mb-2.5">
          <span className="text-[10px] uppercase font-bold text-amber-400 flex items-center gap-1.5">
            <Layers className="w-3 h-3 text-amber-400" />
            <span>3D Isometric LIFO Stack Cylinder</span>
          </span>
          <span className="text-[10px] text-slate-400 bg-slate-900 px-1.5 py-0.5 rounded border border-slate-700">
            O(1) Push/Pop
          </span>
        </div>
        <div className="flex items-center justify-around py-1.5">
          <div className="flex flex-col-reverse items-center gap-1.5 w-28 bg-slate-900/80 p-2 rounded-xl border border-slate-800 shadow-inner">
            <div className="w-full text-center py-1 bg-amber-500/20 border border-amber-500/50 rounded text-amber-300 font-bold text-xs shadow-sm">
              [0] `{'{'}`
            </div>
            <div className="w-full text-center py-1 bg-emerald-500/20 border border-emerald-500/50 rounded text-emerald-300 font-bold text-xs shadow-sm">
              [1] `[`
            </div>
            <motion.div
              animate={{ y: [-4, 4, -4], opacity: [0.8, 1, 0.8] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="w-full text-center py-1 bg-sky-500/20 border border-sky-500/50 rounded text-sky-300 font-bold text-xs shadow-sm"
            >
              ▲ Push `(`
            </motion.div>
          </div>
          <div className="space-y-1 text-[10px] text-slate-400 max-w-[150px]">
            <div className="text-emerald-400 font-bold flex items-center gap-1">
              <span>✔ Invariant True</span>
            </div>
            <div>Top-of-Stack matches closing brace in constant time.</div>
          </div>
        </div>
      </div>
    );
  }

  // 4. Trees / Recursion / Dynamic Programming Simulation
  if (
    combined.includes("tree") ||
    combined.includes("recurs") ||
    combined.includes("dp") ||
    combined.includes("dynamic") ||
    combined.includes("coin") ||
    combined.includes("bottom-up") ||
    combined.includes("fibonacci")
  ) {
    return (
      <div className="my-3 p-3.5 rounded-xl bg-slate-950 border border-slate-800 text-ivory-100 font-mono text-xs relative overflow-hidden shadow-inner [perspective:600px]">
        <div className="flex items-center justify-between border-b border-slate-800 pb-1.5 mb-2.5">
          <span className="text-[10px] uppercase font-bold text-amber-400 flex items-center gap-1.5">
            <GitBranch className="w-3 h-3 text-amber-400" />
            <span>3D Recursive AST / DP Transition Engine</span>
          </span>
          <span className="text-[10px] text-emerald-400 bg-emerald-950/80 px-1.5 py-0.5 rounded border border-emerald-500/30 font-bold">
            Memoized Matrix
          </span>
        </div>
        <div className="flex flex-col items-center py-1 gap-2">
          <motion.div
            animate={{ scale: [1, 1.08, 1] }}
            transition={{ duration: 3, repeat: Infinity }}
            className="px-3 py-1 bg-amber-500/20 border border-amber-500/60 rounded-lg text-amber-300 font-bold text-xs shadow-sm"
          >
            Root Node: dp[11] = 3 coins
          </motion.div>
          <div className="flex items-center justify-center gap-6 w-full relative">
            <div className="absolute top-0 left-1/4 right-1/4 h-3 border-t-2 border-slate-700 pointer-events-none" />
            <div className="px-2.5 py-1 bg-slate-900 border border-slate-700 rounded text-[11px] text-slate-300 mt-2">
              ├─ dp[6] (2 coins)
            </div>
            <div className="px-2.5 py-1 bg-slate-900 border border-slate-700 rounded text-[11px] text-slate-300 mt-2">
              └─ dp[9] (2 coins)
            </div>
          </div>
        </div>
      </div>
    );
  }

  // 5. Graphs / Topological / Heaps / Priority / Kahn Simulation
  if (
    combined.includes("graph") ||
    combined.includes("topological") ||
    combined.includes("heap") ||
    combined.includes("priority") ||
    combined.includes("kahn") ||
    combined.includes("cycle") ||
    combined.includes("dijkstra")
  ) {
    return (
      <div className="my-3 p-3.5 rounded-xl bg-slate-950 border border-slate-800 text-ivory-100 font-mono text-xs relative overflow-hidden shadow-inner [perspective:600px]">
        <div className="flex items-center justify-between border-b border-slate-800 pb-1.5 mb-2.5">
          <span className="text-[10px] uppercase font-bold text-sky-400 flex items-center gap-1.5">
            <Activity className="w-3 h-3 text-sky-400" />
            <span>3D DAG & Priority Heap Network Mesh</span>
          </span>
          <span className="text-[10px] text-amber-400 bg-amber-950/80 px-1.5 py-0.5 rounded border border-amber-500/30 font-bold">
            Kahn&apos;s O(V+E)
          </span>
        </div>
        <div className="flex items-center justify-around py-2">
          <motion.div
            animate={{ y: [-3, 3, -3] }}
            transition={{ duration: 4, repeat: Infinity }}
            className="p-2 bg-slate-900 border border-sky-500/50 rounded-lg text-center text-[11px] font-bold text-sky-300"
          >
            In-Degree [0]
          </motion.div>
          <div className="text-slate-600 font-bold animate-pulse">──►</div>
          <motion.div
            animate={{ y: [3, -3, 3] }}
            transition={{ duration: 4, repeat: Infinity }}
            className="p-2 bg-slate-900 border border-amber-500/50 rounded-lg text-center text-[11px] font-bold text-amber-300"
          >
            Queue Pop()
          </motion.div>
          <div className="text-slate-600 font-bold animate-pulse">──►</div>
          <div className="p-2 bg-emerald-950/60 border border-emerald-500/50 rounded-lg text-center text-[11px] font-bold text-emerald-300">
            Topological Order
          </div>
        </div>
      </div>
    );
  }

  // 6. Default / General Algorithmic Isolate Sandbox Visualizer
  return (
    <div className="my-3 p-3.5 rounded-xl bg-slate-950 border border-slate-800 text-ivory-100 font-mono text-xs relative overflow-hidden shadow-inner [perspective:600px]">
      <div className="flex items-center justify-between border-b border-slate-800 pb-1.5 mb-2">
        <span className="text-[10px] uppercase font-bold text-slate-300 flex items-center gap-1.5">
          <Terminal className="w-3 h-3 text-amber-400" />
          <span>Isolate Sandbox AST Analyzer</span>
        </span>
        <span className="text-[10px] text-emerald-400 font-bold">ZPD Verified</span>
      </div>
      <div className="flex items-center justify-between py-1 text-[11px] text-slate-300">
        <span className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
          <span>Seccomp-BPF & cgroups v2 active</span>
        </span>
        <span className="text-slate-500 font-mono">gotreesitter: O(1)</span>
      </div>
    </div>
  );
};

export const ZPDQuestMap: React.FC<ZPDQuestMapProps> = ({
  modules = [],
  problems = [],
  userSubmissions = [],
}) => {
  const [selectedRealm, setSelectedRealm] = useState<number | null>(0);

  // Determine accepted problem IDs from user history
  const acceptedProblemIDs = new Set<string>();
  if (Array.isArray(userSubmissions)) {
    userSubmissions.forEach((sub: any) => {
      if (sub.status === "Accepted" || sub.verdict === "Accepted") {
        acceptedProblemIDs.add(sub.problem_id || sub.problemId);
      }
    });
  }

  // Built-in canonical Realms if modules are empty or few
  const defaultRealms = [
    {
      id: "realm-1",
      title: "Realm I: Fundamentals of Iteration & Memory Pointers",
      description: "Master optimal O(N) array indexing, two-pointer invariants, and basic structural complexity.",
      sequential_order: 1,
      minScore: 1.0,
      maxScore: 2.1,
    },
    {
      id: "realm-2",
      title: "Realm II: Monotonic Stacks & Hash Map Invariants",
      description: "Navigate sliding windows, bracket invariants, and structural hash group maps.",
      sequential_order: 2,
      minScore: 2.1,
      maxScore: 3.0,
    },
    {
      id: "realm-3",
      title: "Realm III: Recursive Trees & Bottom-Up Dynamic Programming",
      description: "Traverse AST height bounds and formulate minimal state transitions for coin change optimization.",
      sequential_order: 3,
      minScore: 3.0,
      maxScore: 4.0,
    },
    {
      id: "realm-4",
      title: "Realm IV: Topological Graphs & Heap Priorities",
      description: "Conquer Kahn's cycle detection and multi-pointer priority queue divide-and-conquer.",
      sequential_order: 4,
      minScore: 4.0,
      maxScore: 6.0,
    },
  ];

  const realmsToRender = modules.length > 0
    ? modules.sort((a, b) => a.sequential_order - b.sequential_order)
    : defaultRealms;

  // Helper to get problems belonging to a realm/module
  const getRealmProblems = (realm: any, index: number) => {
    if (modules.length > 0) {
      return problems
        .filter((p) => p.module_id === realm.id)
        .sort((a, b) => (a.sequential_order || 999) - (b.sequential_order || 999));
    }
    return problems.filter((p) => {
      const score = p.difficulty_score || 2.0;
      return score >= realm.minScore && score < realm.maxScore;
    }).sort((a, b) => (a.sequential_order || 999) - (b.sequential_order || 999));
  };

  // Compute realm statuses based on problem mastery
  let foundActiveFrontier = false;
  const processedRealms = realmsToRender.map((realm, index) => {
    const realmProbs = getRealmProblems(realm, index);
    const total = realmProbs.length;
    const completedCount = realmProbs.filter((p) => acceptedProblemIDs.has(p.id)).length;

    let status: "Completed" | "Active ZPD" | "Locked" = "Locked";
    if (total > 0 && completedCount === total) {
      status = "Completed";
    } else if (!foundActiveFrontier) {
      status = "Active ZPD";
      foundActiveFrontier = true;
    } else {
      status = "Locked";
    }

    if (index === 0 && status === "Locked") status = "Active ZPD";

    return {
      ...realm,
      problems: realmProbs,
      total,
      completedCount,
      status,
      index,
    };
  });

  const activeRealmObj = selectedRealm !== null ? processedRealms[selectedRealm] : processedRealms[0] || null;

  return (
    <section className="bg-gradient-to-br from-ivory-100 via-ivory-200/60 to-amber-50/40 border-2 border-slate-900 rounded-2xl sm:rounded-3xl p-4 sm:p-8 shadow-xl relative overflow-hidden space-y-6 sm:space-y-8 [perspective:1400px]">
      {/* Decorative Background Technical Blueprint Grid */}
      <div className="absolute inset-0 bg-[radial-gradient(#d1d5db_1px,transparent_1px)] [background-size:20px_20px] opacity-40 pointer-events-none" />

      {/* Section Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-900/15 pb-6 relative z-10">
        <div className="space-y-1.5">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-slate-900 text-amber-300 text-xs font-mono font-bold tracking-wider uppercase shadow-sm">
            <Compass className="w-3.5 h-3.5 text-amber-400 animate-spin" />
            <span>Interactive 3D Curriculum Highway Expedition</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-serif font-black text-slate-900 tracking-tight flex items-center">
            Visual ZPD &quot;Adventure&quot; Quest Map
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 font-sans max-w-2xl leading-relaxed">
            Your adaptive learning trajectory rendered as a winding 3D expedition highway. Every node simulates live algorithmic topics. As admins add or reorder problems, the highway dynamically adapts right before your eyes.
          </p>
        </div>

        <div className="flex items-center space-x-3 bg-ivory-100 p-3 rounded-2xl border border-slate-900/15 shadow-sm shrink-0 self-start md:self-center">
          <div className="p-2 rounded-xl bg-amber-500/20 text-amber-800">
            <Award className="w-6 h-6 text-amber-700" />
          </div>
          <div>
            <span className="text-[10px] font-mono uppercase tracking-wider text-slate-500 block">
              Global Mastery Rate
            </span>
            <span className="text-sm font-mono font-black text-slate-900">
              {processedRealms.reduce((acc, r) => acc + r.completedCount, 0)} / {problems.length || 14} Problems Solved
            </span>
          </div>
        </div>
      </div>

      {/* Top Realm Navigation Tabs */}
      <div className="relative z-10 pt-1 pb-2">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 relative">
          {processedRealms.map((realm, idx) => {
            const isSelected = selectedRealm === idx;
            const isCompleted = realm.status === "Completed";
            const isActiveZPD = realm.status === "Active ZPD";
            const isLocked = realm.status === "Locked";

            return (
              <motion.div
                key={realm.id || idx}
                onClick={() => setSelectedRealm(idx)}
                whileHover={{ scale: 1.02, y: -3 }}
                whileTap={{ scale: 0.98 }}
                className={`relative rounded-2xl p-5 border-2 transition-all cursor-pointer select-none overflow-hidden ${
                  isSelected
                    ? "ring-4 ring-amber-500/50 border-slate-900 shadow-xl bg-ivory-100 transform-gpu -translate-y-1"
                    : isActiveZPD
                    ? "border-amber-500 bg-amber-100/90 shadow-md hover:border-slate-900"
                    : isCompleted
                    ? "border-emerald-600/60 bg-emerald-50/70 hover:bg-ivory-100"
                    : "border-slate-900/20 bg-slate-900/80 text-slate-400 opacity-75 hover:opacity-90 backdrop-blur-sm"
                }`}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-2">
                    <span
                      className={`w-7 h-7 rounded-xl flex items-center justify-center font-mono text-xs font-black shadow-inner ${
                        isActiveZPD
                          ? "bg-amber-500 text-slate-950 ring-2 ring-amber-300 animate-pulse"
                          : isCompleted
                          ? "bg-emerald-600 text-white"
                          : "bg-slate-800 text-slate-400"
                      }`}
                    >
                      {isCompleted ? <CheckCircle2 className="w-4 h-4" /> : isLocked ? <Lock className="w-3.5 h-3.5" /> : idx + 1}
                    </span>
                    <span
                      className={`text-[10px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                        isActiveZPD
                          ? "bg-amber-400 text-slate-950 font-black animate-bounce"
                          : isCompleted
                          ? "bg-emerald-200 text-emerald-900"
                          : "bg-slate-800 text-slate-300"
                      }`}
                    >
                      {isActiveZPD ? "Current ZPD" : isCompleted ? "Mastered" : "Fog of War"}
                    </span>
                  </div>
                </div>

                <h3
                  className={`font-serif font-bold text-base leading-snug line-clamp-2 ${
                    isLocked ? "text-slate-300 font-mono text-xs" : "text-slate-900"
                  }`}
                >
                  {isLocked ? "Realm Locked behind Fog of War" : realm.title}
                </h3>

                <div className="mt-4 space-y-1.5">
                  <div className="flex items-center justify-between text-[11px] font-mono">
                    <span className={isLocked ? "text-slate-400" : "text-slate-600"}>
                      Milestone Progress
                    </span>
                    <span className={`font-bold ${isCompleted ? "text-emerald-700" : isActiveZPD ? "text-amber-800" : "text-slate-400"}`}>
                      {realm.completedCount} / {realm.total || 1}
                    </span>
                  </div>
                  <div className="w-full h-2 bg-slate-900/10 rounded-full overflow-hidden p-0.5">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${(realm.completedCount / Math.max(1, realm.total)) * 100}%` }}
                      transition={{ duration: 0.8, ease: "easeOut" }}
                      className={`h-full rounded-full ${
                        isCompleted ? "bg-emerald-600" : isActiveZPD ? "bg-amber-500" : "bg-slate-600"
                      }`}
                    />
                  </div>
                </div>

                {isLocked && (
                  <div className="absolute inset-0 bg-slate-950/45 backdrop-blur-[2px] flex items-center justify-center pointer-events-none">
                    <div className="text-center space-y-1 px-4">
                      <Lock className="w-6 h-6 text-amber-400 mx-auto opacity-80" />
                      <p className="text-[10px] font-mono text-ivory-100 uppercase tracking-widest font-bold">
                        Solve Previous Nodes to Disperse Fog
                      </p>
                    </div>
                  </div>
                )}
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Selected Realm Winding 3D Expedition Highway */}
      <AnimatePresence mode="wait">
        {activeRealmObj && (
          <motion.div
            key={activeRealmObj.id || activeRealmObj.index}
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.35 }}
            className="bg-ivory-100 border-2 border-slate-900 rounded-2xl sm:rounded-3xl p-4 sm:p-8 shadow-xl relative z-10 overflow-hidden transform-gpu"
          >
            {/* Stage Title Box */}
            <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-6 border-b border-slate-900/10 pb-6 mb-8">
              <div className="space-y-2 max-w-3xl">
                <div className="flex items-center space-x-2.5">
                  <span className="px-3 py-1 rounded-lg bg-slate-900 text-amber-300 font-mono text-xs font-bold uppercase tracking-wider shadow-sm">
                    Realm Stage #{activeRealmObj.index + 1}
                  </span>
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-mono font-bold uppercase tracking-wide ${
                      activeRealmObj.status === "Completed"
                        ? "bg-emerald-200 text-emerald-900"
                        : activeRealmObj.status === "Active ZPD"
                        ? "bg-amber-300 text-slate-950 animate-pulse"
                        : "bg-slate-800 text-slate-300"
                    }`}
                  >
                    Status: {activeRealmObj.status === "Active ZPD" ? "Active ZPD Exploration" : activeRealmObj.status}
                  </span>
                </div>
                <h3 className="text-2xl sm:text-3xl font-serif font-black text-slate-900">
                  {activeRealmObj.title}
                </h3>
                <p className="text-xs sm:text-sm text-slate-600 font-sans leading-relaxed">
                  {activeRealmObj.description || "Conquer these sequential nodes along the curriculum highway to prove your structural code mastery and unlock higher-tier realms."}
                </p>
              </div>

              <div className="flex items-center space-x-4 bg-ivory-200/70 px-6 py-4 rounded-2xl border border-slate-900/15 shrink-0 shadow-sm">
                <div className="w-12 h-12 rounded-2xl bg-amber-500 text-slate-950 flex items-center justify-center font-mono text-base font-black shadow-inner">
                  {activeRealmObj.completedCount}/{activeRealmObj.total || 1}
                </div>
                <div>
                  <span className="text-sm font-serif font-bold text-slate-900 block">
                    Expedition Road Progress
                  </span>
                  <span className="text-xs font-mono text-slate-500">
                    {activeRealmObj.completedCount === activeRealmObj.total && activeRealmObj.total > 0
                      ? "100% Highway Mastered 🎉"
                      : "Sequential order updates automatically"}
                  </span>
                </div>
              </div>
            </div>

            {/* Winding 3D Expedition Highway Path */}
            <div className="relative py-6 px-2 sm:px-6">
              {/* Central Winding Highway Line SVG */}
              {activeRealmObj.problems.length > 0 && (
                <div className="absolute inset-y-0 left-1/2 -translate-x-1/2 w-3 bg-slate-900/10 rounded-full hidden md:block overflow-hidden">
                  <div className="w-full h-full border-r-2 border-dashed border-amber-500/70 animate-[pulse_3s_infinite]" />
                </div>
              )}

              {activeRealmObj.problems.length === 0 ? (
                <div className="p-12 border-2 border-dashed border-slate-900/20 rounded-3xl text-center space-y-3 bg-ivory-200/40">
                  <Code className="w-10 h-10 text-slate-400 mx-auto" />
                  <h4 className="text-base font-serif font-bold text-slate-800">
                    Expedition Highway Under Construction
                  </h4>
                  <p className="text-xs font-mono text-slate-600 max-w-md mx-auto">
                    No problems linked to this realm yet. When an admin adds or orders problems via Curriculum Studio, they automatically snap onto this 3D highway.
                  </p>
                </div>
              ) : (
                <div className="space-y-4 sm:space-y-12 relative">
                  {activeRealmObj.problems.map((prob: any, pIdx: number) => {
                    const isPassed = acceptedProblemIDs.has(prob.id);
                    const diffScore = prob.difficulty_score || 2.0;
                    const expReward = Math.round(diffScore * 100);
                    const isEven = pIdx % 2 === 0;
                    const isNextTarget = activeRealmObj.status === "Active ZPD" && pIdx === activeRealmObj.completedCount;

                    return (
                      <div
                        key={prob.id}
                        className={`relative flex flex-col md:flex-row items-center justify-between gap-6 ${
                          isEven ? "md:flex-row" : "md:flex-row-reverse"
                        }`}
                      >
                        {/* Highway Node Connector Pin */}
                        <div className="absolute left-1/2 -translate-x-1/2 top-1/2 -translate-y-1/2 z-20 hidden md:flex items-center justify-center">
                          <motion.div
                            whileHover={{ scale: 1.25 }}
                            className={`w-12 h-12 rounded-full border-4 flex items-center justify-center font-mono font-black text-xs shadow-lg transition-colors ${
                              isPassed
                                ? "bg-emerald-600 border-ivory-100 text-white ring-4 ring-emerald-500/30"
                                : isNextTarget
                                ? "bg-amber-500 border-slate-950 text-slate-950 ring-4 ring-amber-400 animate-bounce"
                                : "bg-slate-800 border-slate-700 text-slate-400"
                            }`}
                          >
                            {isPassed ? <CheckCircle2 className="w-5 h-5" /> : pIdx + 1}
                          </motion.div>
                        </div>

                        {/* Node Card Container along the Winding Highway */}
                        <motion.div
                          whileHover={{ scale: 1.015, y: -4 }}
                          className={`w-full md:w-[46%] rounded-2xl sm:rounded-3xl p-3 sm:p-6 border-2 transition-all shadow-md relative overflow-hidden bg-ivory-100 ${
                            isPassed
                              ? "border-emerald-600/70 bg-emerald-50/40"
                              : isNextTarget
                              ? "border-amber-500 bg-amber-50/80 ring-4 ring-amber-400/40 shadow-xl"
                              : "border-slate-900/15 hover:border-slate-900"
                          }`}
                        >
                          {/* Node Header & EXP Reward Badge */}
                          <div className="flex items-center justify-between gap-3 pb-3 border-b border-slate-900/10">
                            <span className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-slate-900 text-ivory-100 text-xs font-mono font-bold uppercase tracking-wider">
                              <MapPin className="w-3.5 h-3.5 text-amber-400" />
                              <span>Node #{activeRealmObj.index + 1}.{pIdx + 1}</span>
                            </span>

                            <span
                              className={`inline-flex items-center space-x-1.5 px-3 py-1 rounded-full font-mono text-xs font-bold uppercase ${
                                isPassed
                                  ? "bg-emerald-200 text-emerald-900 border border-emerald-400"
                                  : isNextTarget
                                  ? "bg-amber-400 text-slate-950 border border-amber-500 animate-pulse font-black"
                                  : "bg-slate-200 text-slate-700"
                              }`}
                            >
                              {isPassed ? (
                                <>
                                  <Trophy className="w-3.5 h-3.5 text-emerald-700" />
                                  <span>Claimed (+{expReward} EXP)</span>
                                </>
                              ) : isNextTarget ? (
                                <>
                                  <Zap className="w-3.5 h-3.5 text-slate-950" />
                                  <span>Active Quest (+{expReward} EXP)</span>
                                </>
                              ) : (
                                <span>Reward: +{expReward} ZPD EXP</span>
                              )}
                            </span>
                          </div>

                          {/* Problem Title & Description */}
                          <div className="pt-3 space-y-2">
                            <h4 className="text-lg sm:text-xl font-serif font-black text-slate-900 leading-snug">
                              {prob.title}
                            </h4>
                            {prob.description && (
                              <p className="text-xs sm:text-sm text-slate-600 font-sans line-clamp-2 leading-relaxed">
                                {prob.description}
                              </p>
                            )}
                          </div>

                          {/* Dynamic Topic 3D Hologram Simulator */}
                          <div className="hidden sm:block">
                            {renderTopicHologram(prob.title, prob.description || "", isPassed)}
                          </div>

                          {/* Node Footer Actions */}
                          <div className="pt-4 mt-3 border-t border-slate-900/10 flex items-center justify-between text-xs font-mono">
                            <span className="text-slate-600 flex items-center font-semibold">
                              <Zap className="w-3.5 h-3.5 mr-1 text-amber-600" />
                              <span>Mastery Index: {diffScore.toFixed(1)} / 5.0</span>
                            </span>

                            <Link
                              href={`/problems/${prob.id}`}
                              className={`inline-flex items-center space-x-1.5 px-4 py-2 rounded-xl font-mono font-bold transition-all shadow-sm ${
                                isNextTarget
                                  ? "bg-amber-500 hover:bg-amber-600 text-slate-950 scale-105"
                                  : isPassed
                                  ? "bg-slate-900 hover:bg-slate-800 text-ivory-100"
                                  : "bg-slate-900/90 hover:bg-slate-900 text-ivory-100"
                              }`}
                            >
                              <span>{isPassed ? "Review Code" : isNextTarget ? "Enter Quest Node" : "Attempt Node"}</span>
                              <ChevronRight className="w-4 h-4 ml-0.5" />
                            </Link>
                          </div>
                        </motion.div>

                        {/* Spacer for Alternate Column on Desktop */}
                        <div className="hidden md:block w-[46%]" />
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
};
