import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { BookOpen, Sparkles, AlertCircle, CheckCircle2, ArrowRight } from "lucide-react";

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
  return (
    <AnimatePresence mode="wait">
      {(hint || isLoading || Boolean(verdict)) && (
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

            {hint?.cognitive_effort_index !== undefined && (
              <div className="text-right">
                <span className="text-[10px] text-slate-400 block uppercase font-mono tracking-wider">
                  Cognitive Effort Index
                </span>
                <span className="text-xs font-mono font-semibold text-slate-800">
                  {hint.cognitive_effort_index.toFixed(2)}
                </span>
              </div>
            )}
          </div>

          {/* Loading State */}
          {isLoading ? (
            <div className="py-8 flex flex-col items-center justify-center space-y-3 text-slate-500">
              <Sparkles className="w-5 h-5 animate-spin text-amber-600" />
              <p className="text-xs tracking-tight text-center">
                Analyzing AST structural deviations & querying Socratic RAG pipeline...
              </p>
            </div>
          ) : verdict === "Accepted" ? (
            /* Accepted State */
            <div className="py-4 flex items-start space-x-3 text-emerald-800 bg-emerald-50/60 p-4 rounded-lg border border-emerald-200/50">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 mt-0.5 flex-shrink-0" />
              <div>
                <h4 className="text-xs font-semibold uppercase tracking-wider font-mono">
                  Verdict: Accepted
                </h4>
                <p className="text-xs mt-1 text-emerald-700 leading-relaxed">
                  Excellent work! Your algorithm executed inside the isolate sandbox with optimal structural complexity and zero logical deviations.
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
