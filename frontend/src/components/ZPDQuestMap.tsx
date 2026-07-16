import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import {
  Sparkles,
  CheckCircle2,
  Lock,
  Compass,
  MapPin,
  Flame,
  ArrowRight,
  ShieldAlert,
  Award,
  Layers,
  Code,
  ChevronRight,
  Zap,
} from "lucide-react";

interface Problem {
  id: string;
  title: string;
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

export const ZPDQuestMap: React.FC<ZPDQuestMapProps> = ({
  modules = [],
  problems = [],
  userSubmissions = [],
}) => {
  const [selectedRealm, setSelectedRealm] = useState<number | null>(0); // Index of active Realm

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
    // Fallback classification by difficulty score for canonical default realms
    return problems.filter((p) => {
      const score = p.difficulty_score || 2.0;
      return score >= realm.minScore && score < realm.maxScore;
    });
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

    // Ensure at least Realm 0 is active if no problems mastered yet
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
    <section className="bg-gradient-to-br from-ivory-100 via-ivory-200/50 to-amber-50/30 border-2 border-slate-900 rounded-3xl p-6 sm:p-8 shadow-xl relative overflow-hidden space-y-8">
      {/* Decorative Background Grid */}
      <div className="absolute inset-0 bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:16px_16px] opacity-40 pointer-events-none" />

      {/* Section Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-900/10 pb-6 relative z-10">
        <div className="space-y-1.5">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-slate-900 text-amber-300 text-xs font-mono font-bold tracking-wider uppercase shadow-sm">
            <Compass className="w-3.5 h-3.5 text-amber-400 animate-spin" />
            <span>Interactive Curriculum Expedition</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-serif font-black text-slate-900 tracking-tight flex items-center">
            Visual ZPD &quot;Adventure&quot; Quest Map
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 font-sans max-w-2xl leading-relaxed">
            Your adaptive learning trajectory visualized as a node-based progression expedition. Master structural invariants in your Zone of Proximal Development to disperse the thematic Fog of War and unlock next-level realms.
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
              {processedRealms.reduce((acc, r) => acc + r.completedCount, 0)} / {problems.length || 14} Problems Solved ⭐
            </span>
          </div>
        </div>
      </div>

      {/* Node-Based Quest Path Navigation Bar */}
      <div className="relative z-10 pt-2 pb-4">
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
                    ? "ring-4 ring-amber-500/40 border-slate-900 shadow-lg bg-ivory-100"
                    : isActiveZPD
                    ? "border-amber-500 bg-gradient-to-b from-amber-50/90 to-ivory-100 shadow-md hover:border-slate-900"
                    : isCompleted
                    ? "border-emerald-600/60 bg-emerald-50/40 hover:bg-ivory-100"
                    : "border-slate-900/20 bg-slate-900/80 text-slate-400 opacity-75 hover:opacity-90 backdrop-blur-sm"
                }`}
              >
                {/* Status Badge & Icon */}
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
                      {isActiveZPD ? "Current ZPD ⭐" : isCompleted ? "Mastered ⭐" : "Fog of War 🔒"}
                    </span>
                  </div>

                  {isActiveZPD && (
                    <div className="flex items-center text-amber-600 animate-spin">
                      <Sparkles className="w-4 h-4" />
                    </div>
                  )}
                </div>

                {/* Realm Title */}
                <h3
                  className={`font-serif font-bold text-base leading-snug line-clamp-2 ${
                    isLocked ? "text-slate-300 font-mono text-xs" : "text-slate-900"
                  }`}
                >
                  {isLocked ? "Realm Locked behind Fog of War" : realm.title}
                </h3>

                {/* Progress Bar */}
                <div className="mt-4 space-y-1.5">
                  <div className="flex items-center justify-between text-[11px] font-mono">
                    <span className={isLocked ? "text-slate-400" : "text-slate-600"}>
                      Progress Milestones
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
                        isCompleted ? "bg-emerald-600" : isActiveZPD ? "bg-gradient-to-r from-amber-500 to-amber-400" : "bg-slate-600"
                      }`}
                    />
                  </div>
                </div>

                {/* Decorative Fog Overlay for Locked Nodes */}
                {isLocked && (
                  <div className="absolute inset-0 bg-slate-950/40 backdrop-blur-[2px] flex items-center justify-center pointer-events-none">
                    <div className="text-center space-y-1 px-4">
                      <Lock className="w-6 h-6 text-amber-400 mx-auto opacity-80" />
                      <p className="text-[10px] font-mono text-ivory-100 uppercase tracking-widest font-bold">
                        Solve Previous ZPD Nodes to Disperse Fog
                      </p>
                    </div>
                  </div>
                )}
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Selected Realm Expansion / Quest Node Stage */}
      <AnimatePresence mode="wait">
        {activeRealmObj && (
          <motion.div
            key={activeRealmObj.id || activeRealmObj.index}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.35 }}
            className="bg-ivory-100 border-2 border-slate-900 rounded-2xl p-6 sm:p-8 shadow-md relative z-10"
          >
            <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-6 border-b border-slate-900/10 pb-6">
              <div className="space-y-2 max-w-3xl">
                <div className="flex items-center space-x-2.5">
                  <span className="px-2.5 py-1 rounded-lg bg-slate-900 text-ivory-100 font-mono text-xs font-bold uppercase tracking-wider">
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
                    Status: {activeRealmObj.status === "Active ZPD" ? "Active ZPD Exploration 🚀" : activeRealmObj.status}
                  </span>
                </div>
                <h3 className="text-2xl font-serif font-bold text-slate-900">
                  {activeRealmObj.title}
                </h3>
                <p className="text-xs sm:text-sm text-slate-600 font-sans leading-relaxed">
                  {activeRealmObj.description || "Master these structural invariants to prove cognitive competence and unlock subsequent curriculum units."}
                </p>
              </div>

              <div className="flex items-center space-x-3 bg-ivory-200/60 px-5 py-4 rounded-2xl border border-slate-900/10 shrink-0">
                <div className="w-10 h-10 rounded-xl bg-amber-500 text-slate-950 flex items-center justify-center font-mono text-sm font-black shadow-inner">
                  {activeRealmObj.completedCount}/{activeRealmObj.total || 1}
                </div>
                <div>
                  <span className="text-xs font-serif font-bold text-slate-900 block">
                    Realm Mastery Index
                  </span>
                  <span className="text-[11px] font-mono text-slate-500">
                    {activeRealmObj.completedCount === activeRealmObj.total && activeRealmObj.total > 0
                      ? "10/10 Quest Node Unlocked 🎉"
                      : "Complete all nodes to disperse next fog"}
                  </span>
                </div>
              </div>
            </div>

            {/* Problem Quest Milestones Grid inside the Realm */}
            <div className="pt-6 space-y-4">
              <h4 className="text-xs font-mono uppercase tracking-wider text-slate-600 font-bold flex items-center space-x-2">
                <MapPin className="w-4 h-4 text-amber-700" />
                <span>Expedition Milestones ({activeRealmObj.problems.length} Nodes in Realm)</span>
              </h4>

              {activeRealmObj.problems.length === 0 ? (
                <div className="p-8 border border-dashed border-slate-900/20 rounded-2xl text-center space-y-2 bg-ivory-200/30">
                  <Code className="w-8 h-8 text-slate-400 mx-auto" />
                  <p className="text-xs font-mono text-slate-600">
                    No specific problems linked to this realm yet. Assign problems via Admin Curriculum Studio.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {activeRealmObj.problems.map((prob: any, pIdx: number) => {
                    const isPassed = acceptedProblemIDs.has(prob.id);
                    const diffScore = prob.difficulty_score || 2.5;

                    return (
                      <Link
                        key={prob.id}
                        href={`/problems/${prob.id}`}
                        className={`group rounded-2xl p-5 border-2 transition-all flex flex-col justify-between hover:-translate-y-1 shadow-sm hover:shadow-md relative overflow-hidden ${
                          isPassed
                            ? "border-emerald-600/70 bg-emerald-50/50"
                            : activeRealmObj.status === "Active ZPD" && pIdx === activeRealmObj.completedCount
                            ? "border-amber-500 bg-amber-50/80 ring-2 ring-amber-400/50"
                            : "border-slate-900/15 bg-ivory-100 hover:border-slate-900"
                        }`}
                      >
                        {/* Milestone Top */}
                        <div className="space-y-2.5">
                          <div className="flex items-center justify-between">
                            <span className="inline-flex items-center space-x-1.5 px-2.5 py-0.5 rounded-full bg-slate-900 text-ivory-100 text-[10px] font-mono font-bold">
                              <span>Node #{activeRealmObj.index + 1}.{pIdx + 1}</span>
                            </span>

                            <span
                              className={`text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded-full flex items-center space-x-1 ${
                                isPassed
                                  ? "bg-emerald-200 text-emerald-900"
                                  : activeRealmObj.status === "Active ZPD" && pIdx === activeRealmObj.completedCount
                                  ? "bg-amber-400 text-slate-950 font-black animate-pulse"
                                  : "bg-slate-200 text-slate-700"
                              }`}
                            >
                              {isPassed ? (
                                <>
                                  <CheckCircle2 className="w-3 h-3 mr-1" />
                                  <span>Passed ⭐</span>
                                </>
                              ) : activeRealmObj.status === "Active ZPD" && pIdx === activeRealmObj.completedCount ? (
                                <>
                                  <Sparkles className="w-3 h-3 mr-1" />
                                  <span>Next Quest Target 🎯</span>
                                </>
                              ) : (
                                <span>Pending Quest</span>
                              )}
                            </span>
                          </div>

                          <h5 className="font-serif font-bold text-base text-slate-900 group-hover:text-amber-800 transition-colors leading-snug">
                            {prob.title}
                          </h5>
                        </div>

                        {/* Milestone Bottom Info */}
                        <div className="pt-4 mt-4 border-t border-slate-900/10 flex items-center justify-between text-xs font-mono">
                          <span className="text-slate-500 flex items-center">
                            <Zap className="w-3.5 h-3.5 mr-1 text-amber-600" />
                            ZPD Score: {diffScore.toFixed(1)}
                          </span>

                          <span className="inline-flex items-center text-slate-900 font-bold group-hover:translate-x-1 transition-transform">
                            <span>Enter Node</span>
                            <ChevronRight className="w-4 h-4 ml-0.5 text-amber-600" />
                          </span>
                        </div>
                      </Link>
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
