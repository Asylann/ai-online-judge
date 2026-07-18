import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { BookOpen, Sparkles, AlertCircle, CheckCircle2, ArrowRight, Loader2 } from "lucide-react";

export interface SocraticHint {
  hint_text: string;
  target_line?: number | null;
  confidence_score?: number;
  cognitive_effort_index?: number;
}

interface VirtualTAPanelProps {
  hint: SocraticHint | null;
  verdict?: string | null;
  isLoading?: boolean;
  onDismiss?: () => void;
}

export const VirtualTAPanel: React.FC<VirtualTAPanelProps> = ({
  hint,
  verdict,
  isLoading = false,
  onDismiss,
}) => {
  const isEvaluating = isLoading || verdict === "Evaluating inside Sandbox (Isolate cgroup)..." || verdict === "Pending" || verdict === "In Queue" || verdict === "Processing";
  const isThinking = isEvaluating || (hint && (hint.hint_text.includes("Analyzing structural deviation") || hint.hint_text.includes("Virtual TA Problem Setter is analyzing")));

  return (
    <AnimatePresence mode="wait">
      {(hint || isEvaluating || Boolean(verdict)) && (
        <motion.div
          key="virtual-ta-panel"
          initial={{ opacity: 0, y: 16, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 12, scale: 0.98 }}
          transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
          className="flex flex-col bg-ivory-100 border border-slate-900/10 rounded-xl p-6 shadow-sm text-slate-900 overflow-hidden relative"
        >
          {/* Subtle Top Accent Bar */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-600/80 via-slate-700 to-amber-500/80" />

          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2.5">
              <div className="p-1.5 rounded-lg bg-slate-900/5 text-slate-900">
                <BookOpen className="w-4 h-4 text-amber-700" />
              </div>
              <div>
                <h3 className="text-sm font-semibold tracking-tight text-slate-900 flex items-center">
                  Virtual TA
                  <span className="ml-2 text-[10px] uppercase font-mono px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 tracking-wider">
                    Socratic Pedagogy
                  </span>
                </h3>
                <p className="text-[11px] text-slate-500 font-sans tracking-tight">
                  Zone of Proximal Development (ZPD) Assistance
                </p>
              </div>
            </div>

            {hint?.cognitive_effort_index !== undefined && !isThinking && (
              <div className="text-right">
                <span className="text-[10px] font-mono uppercase text-slate-400 block">
                  Cognitive Effort Index
                </span>
                <span className="text-sm font-mono font-bold text-amber-800">
                  {hint.cognitive_effort_index.toFixed(2)}
                </span>
              </div>
            )}
          </div>

          {/* Body Content */}
          {isThinking ? (
            /* Animated AI Thinking & AST Analysis State (Star Jumping/Rolling) */
            <motion.div
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              className="py-6 px-5 bg-gradient-to-br from-amber-50/90 via-ivory-100 to-amber-100/50 rounded-xl border border-amber-300/80 shadow-inner flex flex-col sm:flex-row items-center sm:items-start gap-5 text-amber-950"
            >
              <div className="relative flex items-center justify-center w-14 h-14 rounded-2xl bg-amber-500/20 text-amber-600 shrink-0 shadow-sm animate-bounce">
                <motion.div
                  animate={{ rotate: 360, scale: [1, 1.25, 1] }}
                  transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                >
                  <Sparkles className="w-7 h-7 text-amber-600" />
                </motion.div>
                <div className="absolute inset-0 rounded-2xl border-2 border-amber-400/50 animate-ping opacity-75" />
              </div>
              <div className="space-y-2 text-center sm:text-left flex-1">
                <div className="flex items-center justify-center sm:justify-start space-x-2">
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider bg-amber-200/80 text-amber-900 border border-amber-300/60">
                    Socratic AI Engine Active
                  </span>
                  <span className="text-[11px] font-mono text-amber-700 animate-pulse font-semibold">
                    gotreesitter + GPT-4o RAG
                  </span>
                </div>
                <h4 className="text-sm font-serif font-bold text-slate-900 leading-snug">
                  {hint?.hint_text || "Virtual TA is analyzing structural deviations & synthesizing guiding Socratic hint..."}
                </h4>
                <p className="text-xs text-slate-600 font-sans leading-relaxed">
                  Comparing your AST snapshot (`gotreesitter` structural pattern) against known logical error degrees. Formulating minimal-edit pedagogical guidance to keep you inside your Zone of Proximal Development.
                </p>
                <div className="pt-2 flex flex-wrap items-center justify-center sm:justify-start gap-2">
                  <span className="px-2.5 py-1 bg-white/80 rounded-md border border-slate-900/10 text-[11px] font-mono text-slate-700 shadow-sm flex items-center space-x-1">
                    <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping" />
                    <span>AST Complexity Check</span>
                  </span>
                  <span className="px-2.5 py-1 bg-white/80 rounded-md border border-slate-900/10 text-[11px] font-mono text-slate-700 shadow-sm flex items-center space-x-1">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    <span>EDM Effort Index Calculation</span>
                  </span>
                </div>
              </div>
            </motion.div>
          ) : verdict === "Accepted" ? (
            /* Accepted State */
            <div className="py-5 flex items-start space-x-3.5 text-emerald-950 bg-emerald-900/10 p-5 rounded-xl border border-emerald-800/30">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 mt-0.5 shrink-0" />
              <div className="space-y-1.5">
                <h4 className="text-xs font-semibold uppercase tracking-wider font-mono text-emerald-900">
                  Virtual TA Evaluation: Accepted 🎉
                </h4>
                <p className="text-xs text-emerald-800 leading-relaxed font-sans">
                  Remarkable achievement! Your algorithm executed inside the isolate Linux cgroup with optimal structural complexity and zero logical deviations.
                </p>
                <p className="text-[11px] font-mono text-emerald-700 pt-1 border-t border-emerald-800/15">
                  Pedagogical Next Step: You have mastered this structural concept. We recommend advancing to a higher Zone of Proximal Development (ZPD) problem to expand your cognitive problem-solving toolkit.
                </p>
              </div>
            </div>
          ) : hint ? (
            /* Hint Content */
            <div className="space-y-4">
              <div className="bg-ivory-200/60 p-4 rounded-lg border border-slate-900/5 transition-all duration-300 hover:border-slate-900/15">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[11px] font-mono uppercase tracking-wider text-amber-800 flex items-center">
                    <AlertCircle className="w-3.5 h-3.5 mr-1 text-amber-700" />
                    Minimal Edit Guidance
                  </span>
                  {hint.target_line && (
                    <span className="text-[11px] font-mono bg-slate-900/10 text-slate-800 px-2 py-0.5 rounded">
                      Target Line: {hint.target_line}
                    </span>
                  )}
                </div>

                <p className="text-xs sm:text-sm text-slate-800 leading-relaxed font-serif tracking-tight">
                  {hint.hint_text}
                </p>
              </div>

              <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1 border-t border-slate-900/5">
                <span>Pedagogical model strictly prevents full solution leakage.</span>
                <span className="flex items-center text-slate-600 font-medium cursor-pointer hover:text-slate-900 transition-colors">
                  Educational Data Mining (EDM) logged <ArrowRight className="w-3 h-3 ml-1" />
                </span>
              </div>
            </div>
          ) : (
            /* Non-Accepted Verdict before hint arrives or fallback */
            <div className="py-4 flex items-start space-x-3 text-amber-900 bg-amber-50/60 p-4 rounded-lg border border-amber-200/50">
              <AlertCircle className="w-5 h-5 text-amber-700 mt-0.5 flex-shrink-0" />
              <div>
                <h4 className="text-xs font-semibold uppercase tracking-wider font-mono">
                  Verdict: {verdict === "RE" ? "Runtime Error (RE)" : verdict === "TLE" ? "Time Limit Exceeded (TLE)" : verdict === "CE" ? "Compilation Error (CE)" : verdict}
                </h4>
                <p className="text-xs mt-1 text-slate-700 leading-relaxed font-sans">
                  Your code returned <span className="font-semibold">{verdict}</span> inside the isolate cgroup sandbox. Virtual TA Socratic intervention and AST structural analysis are active.
                </p>
              </div>
            </div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
};
