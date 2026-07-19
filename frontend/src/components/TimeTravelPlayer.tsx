import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Editor from "@monaco-editor/react";
import {
  Clock,
  CheckCircle2,
  AlertTriangle,
  Activity,
  Code,
  X,
  Play,
  Pause,
  SkipBack,
  SkipForward,
  RotateCcw,
  Sparkles,
  History
} from "lucide-react";

export interface PlaybackAttempt {
  id: string;
  code_base64: string;
  status: string;
  execution_time_ms: number;
  cognitive_effort_index: number;
  ast_complexity_score?: number;
  created_at: string;
  raw_created_at?: string;
  language?: string;
}

interface TimeTravelPlayerProps {
  problemTitle: string;
  attempts: PlaybackAttempt[];
  onClose: () => void;
}

export const TimeTravelPlayer: React.FC<TimeTravelPlayerProps> = ({
  problemTitle,
  attempts,
  onClose,
}) => {
  // Sort attempts chronologically from oldest (attempt 1) to newest (attempt N)
  const [sortedAttempts, setSortedAttempts] = useState<PlaybackAttempt[]>([]);
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [decodedCode, setDecodedCode] = useState<string>("// Loading code playback...");
  const [editorInstance, setEditorInstance] = useState<any>(null);

  useEffect(() => {
    if (!attempts || attempts.length === 0) {
      setSortedAttempts([]);
      return;
    }
    const copy = [...attempts].sort((a, b) => {
      if (a.raw_created_at && b.raw_created_at) {
        return new Date(a.raw_created_at).getTime() - new Date(b.raw_created_at).getTime();
      }
      return 0;
    });
    setSortedAttempts(copy);
    setCurrentIndex(Math.max(0, copy.length - 1));
  }, [attempts]);

  // Safely decode Base64 code whenever currentIndex changes
  useEffect(() => {
    if (sortedAttempts.length === 0 || !sortedAttempts[currentIndex]) {
      setDecodedCode("// No historical attempts found for this problem.");
      return;
    }
    const attempt = sortedAttempts[currentIndex];
    const rawCode = (attempt.code_base64 || "").trim();

    if (!rawCode) {
      setDecodedCode("// No source code stored for this submission record.");
      return;
    }

    try {
      const binaryString = window.atob(rawCode);
      try {
        const utf8Decoded = decodeURIComponent(escape(binaryString));
        setDecodedCode(utf8Decoded);
      } catch {
        setDecodedCode(binaryString);
      }
    } catch (e) {
      setDecodedCode(rawCode);
    }
  }, [sortedAttempts, currentIndex]);

  useEffect(() => {
    if (editorInstance && decodedCode) {
      if (editorInstance.getValue() !== decodedCode) {
        editorInstance.setValue(decodedCode);
      }
      setTimeout(() => {
        editorInstance.layout();
      }, 50);
    }
  }, [decodedCode, currentIndex, editorInstance]);

  // Auto-play interval timer
  useEffect(() => {
    let timer: NodeJS.Timeout | null = null;
    if (isPlaying && sortedAttempts.length > 1) {
      timer = setInterval(() => {
        setCurrentIndex((prev) => {
          if (prev >= sortedAttempts.length - 1) {
            setIsPlaying(false);
            return prev;
          }
          return prev + 1;
        });
      }, 1500); // 1.5 seconds per historical revision
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [isPlaying, sortedAttempts]);

  const currentAttempt = sortedAttempts[currentIndex] || {
    status: "Pending",
    execution_time_ms: 0,
    cognitive_effort_index: 0,
    ast_complexity_score: 0,
    created_at: "Unknown",
    language: "python3",
  };

  const getStatusBadge = (status: string) => {
    const isSuccess = status === "Accepted" || status === "AC";
    return (
      <span
        className={`inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-mono font-bold border ${
          isSuccess
            ? "bg-emerald-100 text-emerald-900 border-emerald-300 shadow-sm"
            : "bg-amber-100 text-amber-900 border-amber-300"
        }`}
      >
        {isSuccess ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700" /> : <AlertTriangle className="w-3.5 h-3.5 text-amber-700" />}
        <span>Verdict: {status}</span>
      </span>
    );
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6"
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0, y: 15 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.95, opacity: 0, y: 15 }}
          transition={{ duration: 0.2, ease: "easeOut" }}
          className="bg-ivory-100 border border-slate-300 rounded-2xl shadow-2xl w-full max-w-6xl h-full sm:h-auto sm:max-h-[92vh] flex flex-col overflow-hidden text-slate-900 font-sans"
        >
          {/* Header Bar */}
          <div className="px-6 py-4 bg-ivory-200 border-b border-slate-300 flex items-center justify-between shrink-0">
            <div className="flex items-center space-x-3">
              <div className="p-2 rounded-lg bg-amber-900/10 text-amber-900 border border-amber-900/20 shadow-sm">
                <History className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-lg font-serif font-bold text-slate-900 leading-tight">
                  Time-Travel Code Playback
                </h2>
                <p className="text-xs font-mono text-slate-600 truncate max-w-lg mt-0.5">
                  {problemTitle} • Iterative ZPD Evolution & Effort Replay
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              {getStatusBadge(currentAttempt.status)}
              <button
                onClick={onClose}
                className="p-2 rounded-lg bg-slate-900/5 hover:bg-slate-900/15 text-slate-700 transition-colors"
                title="Close Replay Modal"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* EDM Metrics & Time-Travel Controls Bar */}
          <div className="px-6 py-4 bg-ivory-100 border-b border-slate-300 flex flex-col lg:flex-row lg:items-center justify-between gap-4 shrink-0">
            {/* Left: Playback Controls & Slider */}
            <div className="flex items-center space-x-4 flex-1">
              <div className="flex items-center space-x-1.5 shrink-0">
                <button
                  onClick={() => {
                    setIsPlaying(false);
                    setCurrentIndex(0);
                  }}
                  disabled={sortedAttempts.length <= 1}
                  className="p-2 rounded bg-ivory-200 hover:bg-ivory-300 text-slate-800 disabled:opacity-40 transition-colors border border-slate-300"
                  title="First Attempt"
                >
                  <SkipBack className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setIsPlaying(!isPlaying)}
                  disabled={sortedAttempts.length <= 1}
                  className={`px-3 py-2 rounded flex items-center space-x-1.5 font-mono text-xs font-bold transition-all shadow-sm ${
                    isPlaying
                      ? "bg-amber-900 text-ivory-100 hover:bg-amber-950"
                      : "bg-slate-900 text-ivory-100 hover:bg-slate-800"
                  } disabled:opacity-40`}
                >
                  {isPlaying ? (
                    <>
                      <Pause className="w-3.5 h-3.5" />
                      <span>Pause</span>
                    </>
                  ) : (
                    <>
                      <Play className="w-3.5 h-3.5" />
                      <span>Replay</span>
                    </>
                  )}
                </button>
                <button
                  onClick={() => {
                    setIsPlaying(false);
                    setCurrentIndex((prev) => Math.min(sortedAttempts.length - 1, prev + 1));
                  }}
                  disabled={sortedAttempts.length <= 1 || currentIndex >= sortedAttempts.length - 1}
                  className="p-2 rounded bg-ivory-200 hover:bg-ivory-300 text-slate-800 disabled:opacity-40 transition-colors border border-slate-300"
                  title="Step Forward"
                >
                  <SkipForward className="w-4 h-4" />
                </button>
              </div>

              {/* Slider */}
              <div className="flex-1 min-w-[180px] flex flex-col space-y-1.5">
                <div className="flex items-center justify-between text-xs font-mono text-slate-700 font-semibold">
                  <span>
                    Revision <span className="text-amber-900 font-bold">#{currentIndex + 1}</span> of {sortedAttempts.length || 1}
                  </span>
                  <span className="text-[11px] text-slate-500">
                    Timestamp: {currentAttempt.created_at}
                  </span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={Math.max(0, sortedAttempts.length - 1)}
                  value={currentIndex}
                  onChange={(e) => {
                    setIsPlaying(false);
                    setCurrentIndex(Number(e.target.value));
                  }}
                  className="w-full h-2 bg-ivory-300 rounded-lg appearance-none cursor-pointer accent-amber-900 focus:outline-none"
                />
              </div>
            </div>

            {/* Right: EDM Metrics correlated with this historical attempt */}
            <div className="flex flex-wrap items-center gap-2 sm:gap-5 text-[10px] sm:text-xs font-mono shrink-0 pt-3 lg:pt-0 border-t lg:border-t-0 border-slate-200">
              <div className="flex items-center space-x-1.5 text-slate-700 bg-ivory-200/80 px-2.5 py-1.5 rounded border border-slate-300">
                <Clock className="w-4 h-4 text-slate-500" />
                <span className="text-slate-500">Time:</span>
                <span className="font-bold text-slate-900">{currentAttempt.execution_time_ms} ms</span>
              </div>

              <div className="flex items-center space-x-1.5 text-slate-700 bg-ivory-200/80 px-2.5 py-1.5 rounded border border-slate-300">
                <Activity className="w-4 h-4 text-amber-800" />
                <span className="text-slate-500">Cognitive Effort:</span>
                <span className="font-bold text-amber-900">
                  {Number(currentAttempt.cognitive_effort_index || 0).toFixed(2)}
                </span>
              </div>

              <div className="flex items-center space-x-1.5 text-slate-700 bg-ivory-200/80 px-2.5 py-1.5 rounded border border-slate-300">
                <Code className="w-4 h-4 text-slate-500" />
                <span className="text-slate-500">AST Index:</span>
                <span className="font-bold text-slate-900">
                  {Number(currentAttempt.ast_complexity_score || 1.2).toFixed(2)}
                </span>
              </div>
            </div>
          </div>

          {/* Monaco Editor (Read-Only) */}
          <div className="flex-1 min-h-[250px] sm:min-h-0 sm:h-[480px] w-full relative bg-[#1e1e1e] border-t border-slate-800 shrink-0 overflow-hidden">
            <Editor
              height="100%"
              width="100%"
              defaultLanguage="python"
              language={currentAttempt.language === "python3" ? "python" : currentAttempt.language || "python"}
              value={decodedCode}
              theme="vs-dark"
              onMount={(editor) => {
                setEditorInstance(editor);
                setTimeout(() => {
                  editor.layout();
                }, 100);
              }}
              options={{
                readOnly: true,
                minimap: { enabled: false },
                automaticLayout: true,
                fontSize: 14,
                fontFamily: "'JetBrains Mono', 'Fira Code', 'Consolas', monospace",
                scrollBeyondLastLine: false,
                lineNumbers: "on",
                renderLineHighlight: "all",
                padding: { top: 16, bottom: 16 },
                wordWrap: "on",
              }}
            />
          </div>

          {/* Footer Note */}
          <div className="px-4 sm:px-6 py-3 bg-ivory-200 border-t border-slate-300 flex flex-col sm:flex-row items-center justify-between text-[10px] sm:text-xs font-mono text-slate-600 shrink-0 gap-3 text-center sm:text-left">
            <span className="hidden sm:inline">
              Drag the slider or press <span className="font-bold text-slate-800">Replay</span> to trace how logical structures and EDM metrics evolved across attempts.
            </span>
            <button
              onClick={onClose}
              className="w-full sm:w-auto px-4 py-2 sm:py-1 rounded bg-slate-900 hover:bg-slate-800 text-ivory-100 font-bold transition-colors shadow-sm"
            >
              Done Replaying
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};
