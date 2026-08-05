import React, { useRef, useState } from "react";
import { motion, AnimatePresence, useScroll, useTransform, useInView } from "framer-motion";
import Link from "next/link";
import {
  CheckCircle2,
  Lock,
  ChevronRight,
  ChevronLeft,
  Zap,
  Trophy,
  MapPin,
  Layers,
} from "lucide-react";

const EASE = [0.16, 1, 0.3, 1];

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

const DEFAULT_MODULES: Module[] = [
  { id: "b1000000-0000-4000-a000-000000000001", title: "Foundations & Core Arrays", description: "Master basic array traversal, indexing, digit reversal, and stack invariants.", sequential_order: 1 },
  { id: "b1000000-0000-4000-a000-000000000002", title: "Data Structures & Patterns", description: "Explore binary trees, sliding windows, hash mapping, and dynamic programming.", sequential_order: 2 },
  { id: "b1000000-0000-4000-a000-000000000003", title: "Advanced Algorithms & Graphs", description: "Tackle topological sort, priority queues, monotonic stacks, and backtracking.", sequential_order: 3 },
];

// Module-to-problem mapping by difficulty score ranges (fallback when module_id missing)
function assignModule(prob: Problem): string {
  if (prob.module_id) return prob.module_id;
  const score = prob.difficulty_score || 0;
  if (score < 2.1) return "b1000000-0000-4000-a000-000000000001";
  if (score < 4.0) return "b1000000-0000-4000-a000-000000000002";
  return "b1000000-0000-4000-a000-000000000003";
}

// ─── Unique visual landmark per problem ───────────────────────────────────────
function ProblemVisual({ title }: { title: string }) {
  const t = title.toLowerCase();

  if (t.includes("sum") || t.includes("hash") || t.includes("indexing")) {
    return (
      <div className="relative w-16 h-16">
        <motion.div className="absolute top-1 left-1 w-6 h-6 rounded-full bg-amber-500/30 border-2 border-amber-500"
          animate={{ scale: [1, 1.15, 1] }} transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }} />
        <motion.div className="absolute bottom-1 right-1 w-6 h-6 rounded-full bg-emerald-500/30 border-2 border-emerald-500"
          animate={{ scale: [1.15, 1, 1.15] }} transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }} />
        <svg className="absolute inset-0 w-full h-full" viewBox="0 0 64 64">
          <motion.line x1="18" y1="18" x2="46" y2="46" stroke="#d97706" strokeWidth="2" strokeDasharray="4 3"
            animate={{ strokeDashoffset: [0, -14] }} transition={{ duration: 2, repeat: Infinity, ease: "linear" }} />
        </svg>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-[8px] font-mono font-bold text-slate-500">K:V</div>
      </div>
    );
  }

  if (t.includes("reverse") || t.includes("palindrome")) {
    return (
      <div className="relative w-16 h-16 flex items-center justify-center">
        <motion.div className="flex items-center space-x-0.5"
          animate={{ rotateY: [0, 180, 360] }} transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
          style={{ transformStyle: "preserve-3d" }}>
          {[1, 2, 1].map((n, i) => (
            <div key={i} className="w-4 h-5 rounded bg-purple-500/25 border border-purple-500/60 flex items-center justify-center text-[8px] font-mono font-bold text-purple-400">{n}</div>
          ))}
        </motion.div>
      </div>
    );
  }

  if (t.includes("stack") || t.includes("parenthes") || t.includes("valid")) {
    return (
      <div className="relative w-16 h-16 flex flex-col items-center justify-end pb-1">
        {["(", "[", "{"].map((ch, i) => (
          <motion.div key={ch} className="w-8 h-4 rounded border border-sky-500/60 bg-sky-500/20 flex items-center justify-center text-[9px] font-mono font-bold text-sky-400"
            animate={{ y: [0, -2, 0] }} transition={{ duration: 2, delay: i * 0.3, repeat: Infinity, ease: "easeInOut" }}>
            {ch}
          </motion.div>
        ))}
      </div>
    );
  }

  if (t.includes("list") || t.includes("merge two") || t.includes("structural pointer")) {
    return (
      <div className="relative w-16 h-16 flex items-center justify-center">
        <div className="flex items-center">
          {[1, 2, 3].map((n, i) => (
            <React.Fragment key={n}>
              <motion.div className="w-5 h-5 rounded-full bg-emerald-500/25 border-2 border-emerald-500/70 flex items-center justify-center text-[8px] font-bold text-emerald-400"
                animate={{ y: [0, -2, 0] }} transition={{ duration: 2, delay: i * 0.2, repeat: Infinity, ease: "easeInOut" }}>{n}</motion.div>
              {i < 2 && <div className="w-2 h-0.5 bg-emerald-500/50" />}
            </React.Fragment>
          ))}
        </div>
      </div>
    );
  }

  if (t.includes("tree") || t.includes("bst") || t.includes("balanced")) {
    return (
      <div className="relative w-16 h-16">
        <svg className="absolute inset-0 w-full h-full" viewBox="0 0 64 64">
          <line x1="32" y1="16" x2="18" y2="36" stroke="#a855f7" strokeWidth="1.5" opacity="0.6" />
          <line x1="32" y1="16" x2="46" y2="36" stroke="#a855f7" strokeWidth="1.5" opacity="0.6" />
          <line x1="18" y1="36" x2="12" y2="52" stroke="#a855f7" strokeWidth="1" opacity="0.4" />
          <line x1="18" y1="36" x2="24" y2="52" stroke="#a855f7" strokeWidth="1" opacity="0.4" />
        </svg>
        <motion.div className="absolute top-2 left-1/2 -translate-x-1/2 w-5 h-5 rounded-full bg-purple-500/30 border-2 border-purple-500 flex items-center justify-center text-[7px] font-bold text-purple-300"
          animate={{ scale: [1, 1.1, 1] }} transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}>R</motion.div>
        <div className="absolute top-[34%] left-[20%] w-3.5 h-3.5 rounded-full bg-purple-500/20 border border-purple-500/50" />
        <div className="absolute top-[34%] right-[20%] w-3.5 h-3.5 rounded-full bg-purple-500/20 border border-purple-500/50" />
      </div>
    );
  }

  if (t.includes("substring") || t.includes("window") || t.includes("longest")) {
    return (
      <div className="relative w-16 h-16 flex items-center justify-center">
        <div className="flex items-center space-x-[1px] text-[8px] font-mono text-slate-500">
          {"abcab".split("").map((ch, i) => (<div key={i} className="w-3 h-5 flex items-center justify-center">{ch}</div>))}
        </div>
        <motion.div className="absolute top-1/2 -translate-y-1/2 h-7 border-2 border-amber-500 rounded bg-amber-500/10"
          animate={{ left: ["8%", "42%", "8%"], width: ["38%", "42%", "38%"] }}
          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }} />
      </div>
    );
  }

  if (t.includes("anagram") || t.includes("group")) {
    return (
      <div className="relative w-16 h-16 flex items-center justify-center">
        <motion.div className="grid grid-cols-3 gap-0.5"
          animate={{ scale: [1, 1.05, 1] }} transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}>
          {["e", "a", "t", "t", "e", "a", "a", "t", "e"].map((ch, i) => (
            <motion.div key={i} className="w-3.5 h-3.5 rounded-sm bg-orange-500/20 border border-orange-500/40 flex items-center justify-center text-[6px] font-mono font-bold text-orange-400"
              animate={{ opacity: [0.5, 1, 0.5] }} transition={{ duration: 2, delay: i * 0.12, repeat: Infinity, ease: "easeInOut" }}>{ch}</motion.div>
          ))}
        </motion.div>
      </div>
    );
  }

  if (t.includes("coin") || t.includes("knapsack") || t.includes("dynamic") || t.includes("dp")) {
    return (
      <div className="relative w-16 h-16 flex items-center justify-center">
        <div className="grid grid-cols-4 gap-0.5">
          {Array.from({ length: 12 }).map((_, i) => (
            <motion.div key={i} className="w-3 h-3 rounded-sm border border-teal-500/40"
              animate={{ backgroundColor: ["rgba(20,184,166,0)", "rgba(20,184,166,0.3)", "rgba(20,184,166,0)"] }}
              transition={{ duration: 2, delay: i * 0.12, repeat: Infinity, ease: "easeInOut" }} />
          ))}
        </div>
      </div>
    );
  }

  if (t.includes("graph") || t.includes("topological") || t.includes("course") || t.includes("schedule")) {
    return (
      <div className="relative w-16 h-16">
        <svg className="absolute inset-0 w-full h-full" viewBox="0 0 64 64">
          <motion.line x1="16" y1="24" x2="40" y2="16" stroke="#3b82f6" strokeWidth="1.5" strokeDasharray="3 2"
            animate={{ strokeDashoffset: [0, -10] }} transition={{ duration: 2, repeat: Infinity, ease: "linear" }} />
          <motion.line x1="16" y1="24" x2="32" y2="44" stroke="#3b82f6" strokeWidth="1.5" strokeDasharray="3 2"
            animate={{ strokeDashoffset: [0, -10] }} transition={{ duration: 2, repeat: Infinity, ease: "linear" }} />
          <motion.line x1="40" y1="16" x2="48" y2="40" stroke="#3b82f6" strokeWidth="1.5" strokeDasharray="3 2"
            animate={{ strokeDashoffset: [0, -10] }} transition={{ duration: 2, repeat: Infinity, ease: "linear" }} />
        </svg>
        <div className="absolute top-[30%] left-[18%] w-4 h-4 rounded-full bg-blue-500/30 border-2 border-blue-500" />
        <div className="absolute top-[16%] right-[24%] w-4 h-4 rounded-full bg-blue-500/30 border-2 border-blue-500" />
        <motion.div className="absolute bottom-[24%] left-[40%] w-4 h-4 rounded-full bg-blue-500/40 border-2 border-blue-400"
          animate={{ scale: [1, 1.2, 1] }} transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }} />
      </div>
    );
  }

  if (t.includes("priority") || t.includes("heap") || t.includes("k sorted") || t.includes("merge k")) {
    return (
      <div className="relative w-16 h-16 flex items-center justify-center">
        <motion.div className="flex flex-col items-center space-y-0.5"
          animate={{ y: [0, -2, 0] }} transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}>
          <div className="w-5 h-5 rounded bg-rose-500/30 border border-rose-500 flex items-center justify-center text-[8px] font-bold text-rose-400">1</div>
          <div className="flex space-x-0.5">
            <div className="w-4 h-4 rounded bg-rose-500/20 border border-rose-500/60 flex items-center justify-center text-[7px] font-bold text-rose-300">3</div>
            <div className="w-4 h-4 rounded bg-rose-500/20 border border-rose-500/60 flex items-center justify-center text-[7px] font-bold text-rose-300">4</div>
          </div>
          <div className="flex space-x-0.5">
            {[5, 6, 8].map(n => <div key={n} className="w-3 h-3 rounded bg-rose-500/10 border border-rose-500/40 flex items-center justify-center text-[6px] text-rose-300">{n}</div>)}
          </div>
        </motion.div>
      </div>
    );
  }

  if (t.includes("rain") || t.includes("water") || t.includes("trap")) {
    const heights = [1, 3, 2, 4, 1, 3, 1, 4, 3];
    return (
      <div className="relative w-16 h-16 flex items-end justify-center pb-1 space-x-[1px]">
        {heights.map((h, i) => (
          <motion.div key={i} className="w-1.5 bg-cyan-500/60 rounded-t-sm" style={{ height: `${h * 13}%` }}
            animate={{ opacity: [0.5, 1, 0.5] }} transition={{ duration: 2, delay: i * 0.1, repeat: Infinity, ease: "easeInOut" }} />
        ))}
      </div>
    );
  }

  if (t.includes("queen") || t.includes("backtrack")) {
    return (
      <div className="relative w-16 h-16 flex items-center justify-center">
        <div className="grid grid-cols-4 gap-0">
          {Array.from({ length: 16 }).map((_, i) => {
            const isQueen = [1, 6, 8, 15].includes(i);
            return (
              <div key={i} className={`w-3.5 h-3.5 border border-slate-700/30 flex items-center justify-center text-[7px] ${(Math.floor(i / 4) + i % 4) % 2 === 0 ? "bg-slate-800/20" : ""}`}>
                {isQueen && <motion.span className="text-amber-400 font-bold" animate={{ scale: [1, 1.2, 1] }} transition={{ duration: 2, delay: i * 0.05, repeat: Infinity }}>Q</motion.span>}
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  if (t.includes("alien") || t.includes("dictionary") || t.includes("order")) {
    return (
      <div className="relative w-16 h-16 flex items-center justify-center">
        <motion.div className="flex items-center space-x-0.5"
          animate={{ x: [-3, 3, -3] }} transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}>
          {"wertf".split("").map((ch, i) => (
            <motion.div key={ch} className="w-4 h-5 rounded bg-indigo-500/20 border border-indigo-500/50 flex items-center justify-center text-[8px] font-mono font-bold text-indigo-400"
              animate={{ y: [0, -2, 0] }} transition={{ duration: 2, delay: i * 0.15, repeat: Infinity, ease: "easeInOut" }}>{ch}</motion.div>
          ))}
        </motion.div>
      </div>
    );
  }

  return (
    <div className="relative w-16 h-16 flex items-center justify-center">
      <motion.div className="w-10 h-10 rounded-xl bg-slate-900/10 border border-slate-900/20 flex items-center justify-center"
        animate={{ scale: [1, 1.08, 1], rotate: [0, 3, 0] }} transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}>
        <span className="text-sm font-mono font-bold text-slate-400">{"</>"}</span>
      </motion.div>
    </div>
  );
}

// ─── Single Journey Node ──────────────────────────────────────────────────────
function JourneyNode({ problem, index, isPassed, isNext }: {
  problem: Problem; index: number; isPassed: boolean; isNext: boolean;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, amount: 0.3 });
  const isEven = index % 2 === 0;
  const diffScore = problem.difficulty_score || 2.0;

  return (
    <motion.div
      ref={ref}
      className={`relative flex items-center gap-4 sm:gap-6 ${isEven ? "md:flex-row" : "md:flex-row-reverse"} flex-col md:flex-row`}
      initial={{ opacity: 0, y: 30, x: isEven ? -20 : 20 }}
      animate={isInView ? { opacity: 1, y: 0, x: 0 } : {}}
      transition={{ duration: 0.6, delay: 0.05, ease: EASE }}
    >
      {/* Connector dot */}
      <div className="hidden md:flex absolute left-[46px] top-1/2 -translate-y-1/2 -translate-x-1/2 z-20">
        <motion.div
          className={`w-9 h-9 rounded-full border-[3px] flex items-center justify-center text-xs font-mono font-bold shadow-md ${
            isPassed ? "bg-emerald-500 border-ivory-100 text-white" : isNext ? "bg-amber-500 border-slate-900 text-slate-900" : "bg-slate-200 border-slate-300 text-slate-500"
          }`}
          animate={isNext ? { scale: [1, 1.1, 1] } : {}}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
        >
          {isPassed ? <CheckCircle2 className="w-4 h-4" /> : index + 1}
        </motion.div>
      </div>

      {/* Card */}
      <div className={`w-full md:w-[calc(50%-56px)] ${isEven ? "md:ml-[92px]" : "md:mr-[92px]"}`}>
        <motion.div
          className={`relative rounded-2xl p-4 sm:p-5 border-2 transition-all overflow-hidden ${
            isPassed ? "border-emerald-500/40 bg-emerald-50/30" : isNext ? "border-amber-500 bg-amber-50/40 shadow-lg shadow-amber-500/10" : "border-slate-200 bg-ivory-100 hover:border-slate-300"
          }`}
          whileHover={{ y: -3 }}
          transition={{ duration: 0.25 }}
        >
          {isNext && (
            <motion.div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-amber-500 via-amber-300 to-amber-500"
              animate={{ backgroundPosition: ["0% 0%", "200% 0%"] }}
              transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
              style={{ backgroundSize: "200% 100%" }} />
          )}

          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 space-y-2 min-w-0">
              <div className="flex items-center space-x-2 flex-wrap gap-y-1">
                <span className={`inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[10px] font-mono font-bold ${
                  isPassed ? "bg-emerald-100 text-emerald-800" : isNext ? "bg-amber-100 text-amber-900" : "bg-slate-100 text-slate-600"
                }`}>
                  <MapPin className="w-2.5 h-2.5" />
                  <span>Stage {index + 1}</span>
                </span>
                {isPassed && <span className="flex items-center space-x-1 text-[10px] font-mono text-emerald-600"><Trophy className="w-3 h-3" /><span>Done</span></span>}
                {isNext && <span className="flex items-center space-x-1 text-[10px] font-mono text-amber-700 font-bold"><Zap className="w-3 h-3" /><span>Up Next</span></span>}
              </div>

              <h4 className="text-sm sm:text-base font-serif font-semibold text-slate-900 leading-snug">
                {problem.title}
              </h4>

              <div className="flex items-center space-x-2">
                <div className="flex-1 h-1.5 bg-slate-200 rounded-full overflow-hidden max-w-[100px]">
                  <motion.div
                    className={`h-full rounded-full ${diffScore < 2 ? "bg-emerald-500" : diffScore < 3.5 ? "bg-amber-500" : "bg-red-500"}`}
                    initial={{ width: 0 }}
                    animate={isInView ? { width: `${(diffScore / 5.5) * 100}%` } : {}}
                    transition={{ duration: 0.7, delay: 0.2, ease: EASE }}
                  />
                </div>
                <span className="text-[10px] font-mono text-slate-400">{diffScore.toFixed(1)}</span>
              </div>

              <Link href={`/problems/${problem.id}`}
                className={`inline-flex items-center space-x-1 text-xs font-semibold transition-colors ${isNext ? "text-amber-800 hover:text-amber-900" : "text-slate-700 hover:text-slate-900"}`}>
                <span>{isPassed ? "Review" : "Start"}</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="shrink-0 hidden sm:block">
              <ProblemVisual title={problem.title} />
            </div>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
}

// ─── Journey Path SVG ─────────────────────────────────────────────────────────
function JourneyPath({ count }: { count: number }) {
  if (count === 0) return null;
  const segH = 140;
  const totalHeight = count * segH;

  let d = "M 46 0";
  for (let i = 0; i < count; i++) {
    const y = i * segH + segH / 2;
    d += ` L 46 ${y}`;
  }

  return (
    <svg className="absolute left-0 top-0 w-[92px] h-full hidden md:block pointer-events-none" preserveAspectRatio="none" style={{ height: "100%" }}
      viewBox={`0 0 92 ${totalHeight}`}>
      <path d={d} fill="none" stroke="rgba(20,20,19,0.07)" strokeWidth="2" strokeLinecap="round" />
      <motion.path d={d} fill="none" stroke="url(#pg)" strokeWidth="2" strokeLinecap="round" strokeDasharray="6 5"
        animate={{ strokeDashoffset: [0, -22] }} transition={{ duration: 3, repeat: Infinity, ease: "linear" }} />
      <defs>
        <linearGradient id="pg" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#d97706" stopOpacity="0.6" />
          <stop offset="100%" stopColor="#d97706" stopOpacity="0.15" />
        </linearGradient>
      </defs>
    </svg>
  );
}

// ─── Main Map Component ───────────────────────────────────────────────────────
export const ZPDQuestMap: React.FC<ZPDQuestMapProps> = ({
  modules = [],
  problems = [],
  userSubmissions = [],
}) => {
  const [activeModuleIdx, setActiveModuleIdx] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: containerRef, offset: ["start end", "end start"] });
  const bgY = useTransform(scrollYProgress, [0, 1], ["0%", "6%"]);

  const acceptedProblemIDs = new Set<string>();
  if (Array.isArray(userSubmissions)) {
    userSubmissions.forEach((sub: any) => {
      if (sub.status === "Accepted" || sub.verdict === "Accepted") {
        acceptedProblemIDs.add(sub.problem_id || sub.problemId);
      }
    });
  }

  const resolvedModules = modules.length >= 2
    ? [...modules].sort((a, b) => a.sequential_order - b.sequential_order)
    : DEFAULT_MODULES;

  const currentModule = resolvedModules[activeModuleIdx] || resolvedModules[0];

  const moduleProblems = problems
    .filter((p) => assignModule(p) === currentModule.id)
    .sort((a, b) => (a.sequential_order || a.difficulty_score || 0) - (b.sequential_order || b.difficulty_score || 0));

  let foundNext = false;
  const processedProblems = moduleProblems.map((p) => {
    const isPassed = acceptedProblemIDs.has(p.id);
    let isNext = false;
    if (!isPassed && !foundNext) { isNext = true; foundNext = true; }
    return { ...p, isPassed, isNext };
  });

  const completedInModule = processedProblems.filter((p) => p.isPassed).length;
  const totalInModule = processedProblems.length;

  const goNext = () => { if (activeModuleIdx < resolvedModules.length - 1) setActiveModuleIdx(activeModuleIdx + 1); };
  const goPrev = () => { if (activeModuleIdx > 0) setActiveModuleIdx(activeModuleIdx - 1); };

  return (
    <section ref={containerRef} className="relative rounded-3xl border border-slate-900/10 bg-gradient-to-b from-ivory-100 via-ivory-200/30 to-ivory-100 overflow-hidden py-10 px-4 sm:px-8">
      {/* Parallax bg */}
      <motion.div className="absolute inset-0 pointer-events-none" style={{ y: bgY }}>
        <div className="absolute inset-0 opacity-[0.02]" style={{ backgroundImage: "radial-gradient(circle at 1px 1px, rgba(20,20,19,0.5) 1px, transparent 0)", backgroundSize: "28px 28px" }} />
      </motion.div>

      {/* Header */}
      <div className="relative z-10 text-center space-y-3 mb-10">
        <motion.h2 className="text-3xl sm:text-4xl font-serif font-medium text-slate-900 tracking-tight"
          initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.6, ease: EASE }}>
          Your learning journey
        </motion.h2>
        <motion.p className="text-sm text-slate-500 max-w-md mx-auto"
          initial={{ opacity: 0, y: 15 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.6, delay: 0.1, ease: EASE }}>
          Complete each module to unlock the next. Every problem builds on what you learned before.
        </motion.p>
      </div>

      {/* Module navigation */}
      <div className="relative z-10 mb-8">
        <div className="flex items-center justify-between gap-4 max-w-2xl mx-auto">
          {/* Previous button */}
          <button
            onClick={goPrev}
            disabled={activeModuleIdx === 0}
            className={`flex items-center space-x-1.5 px-4 py-2.5 rounded-xl text-xs font-semibold transition-all ${
              activeModuleIdx === 0
                ? "opacity-30 cursor-not-allowed bg-slate-100 text-slate-400"
                : "bg-slate-900 text-ivory-100 hover:bg-slate-800 shadow-sm"
            }`}
          >
            <ChevronLeft className="w-4 h-4" />
            <span className="hidden sm:inline">Previous Module</span>
            <span className="sm:hidden">Prev</span>
          </button>

          {/* Module indicator */}
          <div className="flex-1 text-center space-y-2">
            <div className="flex items-center justify-center space-x-2">
              <Layers className="w-4 h-4 text-amber-600" />
              <span className="text-xs font-mono text-slate-500 uppercase tracking-wider">
                Module {activeModuleIdx + 1} of {resolvedModules.length}
              </span>
            </div>
            <h3 className="text-base sm:text-lg font-serif font-semibold text-slate-900 leading-snug">
              {currentModule.title}
            </h3>
            {currentModule.description && (
              <p className="text-xs text-slate-500 max-w-sm mx-auto hidden sm:block">{currentModule.description}</p>
            )}
            {/* Module dots */}
            <div className="flex items-center justify-center space-x-1.5 pt-1">
              {resolvedModules.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setActiveModuleIdx(i)}
                  className={`w-2.5 h-2.5 rounded-full transition-all ${
                    i === activeModuleIdx ? "bg-amber-500 scale-125" : "bg-slate-300 hover:bg-slate-400"
                  }`}
                />
              ))}
            </div>
            {/* Progress for this module */}
            <div className="max-w-[200px] mx-auto">
              <div className="h-1.5 bg-slate-200 rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-gradient-to-r from-amber-500 to-emerald-500 rounded-full"
                  key={`progress-${activeModuleIdx}`}
                  initial={{ width: 0 }}
                  animate={{ width: `${(completedInModule / Math.max(1, totalInModule)) * 100}%` }}
                  transition={{ duration: 0.8, ease: EASE }}
                />
              </div>
              <p className="text-[10px] font-mono text-slate-400 mt-1">{completedInModule}/{totalInModule} completed</p>
            </div>
          </div>

          {/* Next button */}
          <button
            onClick={goNext}
            disabled={activeModuleIdx === resolvedModules.length - 1}
            className={`flex items-center space-x-1.5 px-4 py-2.5 rounded-xl text-xs font-semibold transition-all ${
              activeModuleIdx === resolvedModules.length - 1
                ? "opacity-30 cursor-not-allowed bg-slate-100 text-slate-400"
                : "bg-slate-900 text-ivory-100 hover:bg-slate-800 shadow-sm"
            }`}
          >
            <span className="hidden sm:inline">Next Module</span>
            <span className="sm:hidden">Next</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Animated module content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeModuleIdx}
          initial={{ opacity: 0, x: 40 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -40 }}
          transition={{ duration: 0.4, ease: EASE }}
          className="relative max-w-4xl mx-auto"
        >
          <JourneyPath count={processedProblems.length} />

          {processedProblems.length === 0 ? (
            <div className="text-center py-16 space-y-3">
              <Lock className="w-8 h-8 text-slate-400 mx-auto" />
              <p className="text-sm text-slate-500">No problems in this module yet.</p>
            </div>
          ) : (
            <div className="space-y-6 md:space-y-10 relative z-10">
              {processedProblems.map((prob, i) => (
                <JourneyNode key={prob.id} problem={prob} index={i} isPassed={prob.isPassed} isNext={prob.isNext} />
              ))}
            </div>
          )}
        </motion.div>
      </AnimatePresence>

      {/* Finish */}
      <motion.div className="relative z-10 text-center mt-10 pt-6 border-t border-slate-900/5"
        initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} transition={{ duration: 0.5, ease: EASE }}>
        <div className="inline-flex items-center space-x-2 px-4 py-2 rounded-full bg-slate-900/5 border border-slate-900/10">
          <Trophy className="w-4 h-4 text-amber-600" />
          <span className="text-xs font-mono text-slate-600">
            {completedInModule === totalInModule && totalInModule > 0
              ? activeModuleIdx < resolvedModules.length - 1
                ? "Module complete! Move to the next one."
                : "All modules mastered!"
              : "Keep going — one step at a time"}
          </span>
        </div>
      </motion.div>
    </section>
  );
};
