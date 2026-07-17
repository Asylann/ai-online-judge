import React from "react";
import { motion } from "framer-motion";
import {
  Sparkles,
  Code,
  ShieldCheck,
  Cpu,
  CheckCircle2,
  AlertCircle,
  BookOpen,
  Zap,
  Terminal,
} from "lucide-react";

export const HeroVisual: React.FC = () => {
  return (
    <div className="relative w-full py-4 lg:py-0 select-none">
      {/* Outer Glow Ring Background */}
      <div className="absolute -inset-4 bg-gradient-to-tr from-amber-500/15 via-slate-900/10 to-amber-600/20 rounded-3xl blur-2xl pointer-events-none animate-pulse" />

      {/* Main Container Card */}
      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
        className="relative bg-slate-900 text-ivory-100 border-2 border-slate-800 rounded-3xl p-6 sm:p-7 shadow-2xl overflow-hidden space-y-6"
      >
        {/* Top Accent Solid Bar */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-amber-500" />

        {/* Sandbox & AST Monitor Header */}
        <div className="flex items-center justify-between border-b border-slate-800/80 pb-4">
          <div className="flex items-center space-x-3">
            <div className="relative flex items-center justify-center w-9 h-9 rounded-xl bg-amber-500/20 text-amber-400 overflow-hidden border border-amber-500/30">
              <motion.div
                animate={{ scale: [1, 1.15, 1], opacity: [0.8, 1, 0.8] }}
                transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
              >
                <Cpu className="w-5 h-5 text-amber-400" />
              </motion.div>
              <div className="absolute inset-0 rounded-xl border border-amber-400/40 animate-pulse opacity-60" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-xs font-mono font-bold text-ivory-100 uppercase tracking-wider">
                  Virtual TA & gotreesitter
                </span>
                <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[9px] font-mono font-bold uppercase animate-pulse">
                  Active AST Monitor
                </span>
              </div>
              <p className="text-[10px] font-mono text-slate-400 mt-0.5">
                Isolate Linux Namespaces & cgroups v2 Sandbox
              </p>
            </div>
          </div>

          <div className="hidden sm:flex items-center space-x-1.5 text-[10px] font-mono text-slate-400 bg-slate-800/60 px-2.5 py-1 rounded-lg border border-slate-700/50">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            <span>0.42ms AST Scan</span>
          </div>
        </div>

        {/* Simulated Code & Structural Deviation Analysis */}
        <div className="relative bg-slate-950/90 rounded-2xl border border-slate-800 p-4 font-mono text-xs shadow-inner space-y-3 overflow-hidden">
          {/* Editor Header */}
          <div className="flex items-center justify-between text-[10px] text-slate-400 pb-2 border-b border-slate-800/60">
            <span className="flex items-center space-x-1.5">
              <Terminal className="w-3.5 h-3.5 text-amber-400" />
              <span className="text-ivory-100 font-bold">solution.go</span>
              <span className="text-slate-500">— O(N) Monotonic Stack</span>
            </span>
            <span className="text-amber-400 font-semibold">AST Score: 1.42 ⭐</span>
          </div>

          {/* Animated Code Lines */}
          <div className="space-y-1.5 text-[11px] leading-relaxed">
            <div className="flex items-center space-x-3 text-slate-500">
              <span className="w-5 text-right select-none opacity-40">1</span>
              <span className="text-purple-400 font-bold">func</span>
              <span className="text-blue-300">solveZPD</span>
              <span>(nums []int, target int) []int &#123;</span>
            </div>

            <div className="flex items-center space-x-3 text-slate-400 bg-slate-900/60 -mx-4 px-4 py-1 border-l-2 border-slate-700">
              <span className="w-5 text-right select-none opacity-40">2</span>
              <span className="text-amber-300 ml-4 font-semibold">// gotreesitter AST: loop invariant check</span>
            </div>

            <motion.div
              animate={{ backgroundColor: ["rgba(245, 158, 11, 0)", "rgba(245, 158, 11, 0.15)", "rgba(245, 158, 11, 0)"] }}
              transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
              className="flex items-center space-x-3 text-ivory-100 -mx-4 px-4 py-1 rounded border-l-2 border-amber-400"
            >
              <span className="w-5 text-right select-none text-amber-400 font-bold">3</span>
              <span className="ml-4 text-emerald-400 font-semibold">hashTable</span>
              <span>:= make(map[int]int, len(nums))</span>
              <span className="ml-auto text-[9px] bg-amber-500/20 text-amber-300 px-1.5 py-0.5 rounded font-mono uppercase tracking-tight font-bold">
                AST Node Checked
              </span>
            </motion.div>

            <div className="flex items-center space-x-3 text-slate-300">
              <span className="w-5 text-right select-none opacity-40">4</span>
              <span className="ml-4 text-purple-400 font-bold">for</span>
              <span>idx, num :=</span>
              <span className="text-purple-400">range</span>
              <span>nums &#123;</span>
            </div>

            <div className="flex items-center space-x-3 text-slate-300">
              <span className="w-5 text-right select-none opacity-40">5</span>
              <span className="ml-8 text-purple-400">if</span>
              <span>prevIdx, ok := hashTable[target-num]; ok &#123;</span>
            </div>

            <div className="flex items-center space-x-3 text-emerald-300 font-bold">
              <span className="w-5 text-right select-none opacity-40">6</span>
              <span className="ml-12 text-purple-400">return</span>
              <span>[]int&#123;prevIdx, idx&#125;</span>
            </div>

            <div className="flex items-center space-x-3 text-slate-500">
              <span className="w-5 text-right select-none opacity-40">7</span>
              <span>&#125;</span>
            </div>
          </div>
        </div>

        {/* Floating Socratic Hint & EDM Card Simulation */}
        <motion.div
          animate={{ y: [-4, 4, -4] }}
          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
          className="bg-slate-950/95 border-2 border-amber-500/50 rounded-2xl p-4 shadow-lg space-y-2.5 relative"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <span className="p-1 rounded bg-amber-500 text-slate-950">
                <Terminal className="w-3.5 h-3.5 animate-pulse" />
              </span>
              <span className="text-xs font-serif font-bold text-amber-300">
                Virtual TA Socratic Intervention Active
              </span>
            </div>
            <span className="text-[10px] font-mono uppercase bg-slate-900 text-amber-400 px-2 py-0.5 rounded font-bold border border-amber-500/30">
              ZPD Hint #1
            </span>
          </div>

          <p className="text-xs font-serif text-ivory-100 leading-relaxed italic">
            &quot;Notice how indexing `hashTable[target - num]` in a single pass structural pattern reduces lookup complexity from O(N²) down to exact O(N) memory boundaries.&quot;
          </p>

          <div className="flex items-center justify-between text-[10px] font-mono text-slate-400 pt-1 border-t border-slate-800">
            <span className="flex items-center space-x-1 text-emerald-400 font-semibold">
              <CheckCircle2 className="w-3 h-3" />
              <span>Zero Solution Leakage</span>
            </span>
            <span>Effort Index: Optimal 1.28</span>
          </div>
        </motion.div>

        {/* Bottom Feature Metrics */}
        <div className="grid grid-cols-3 gap-2 pt-1 text-center font-mono text-[11px]">
          <div className="bg-slate-950/60 p-2.5 rounded-xl border border-slate-800/80">
            <span className="text-slate-400 block text-[9px] uppercase tracking-wider">
              AST Parser
            </span>
            <span className="text-amber-400 font-bold text-xs">gotreesitter</span>
          </div>
          <div className="bg-slate-950/60 p-2.5 rounded-xl border border-slate-800/80">
            <span className="text-slate-400 block text-[9px] uppercase tracking-wider">
              AI Mentor
            </span>
            <span className="text-emerald-400 font-bold text-xs">GPT-4o RAG</span>
          </div>
          <div className="bg-slate-950/60 p-2.5 rounded-xl border border-slate-800/80">
            <span className="text-slate-400 block text-[9px] uppercase tracking-wider">
              Metrics
            </span>
            <span className="text-blue-400 font-bold text-xs">Effort-Based</span>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
