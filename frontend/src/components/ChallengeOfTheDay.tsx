import React, { useEffect, useState } from "react";
import Link from "next/link";
import axios from "axios";
import { motion } from "framer-motion";
import { Flame, ArrowUpRight, Award } from "lucide-react";
import { ProblemDescriptionRenderer } from "@/components/ProblemDescriptionRenderer";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080/api/v1";

interface Problem {
  id: string;
  title: string;
  description: string;
  difficulty?: string;
  difficulty_score: number;
}

export const ChallengeOfTheDay: React.FC = () => {
  const [problem, setProblem] = useState<Problem | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchDailyChallenge = async () => {
      try {
        const res = await axios.get(`${API_URL}/problems/daily`);
        if (res.data && res.data.id) {
          setProblem(res.data);
        }
      } catch (err) {
        console.warn("Could not fetch daily challenge problem:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchDailyChallenge();
  }, []);

  if (loading || !problem) {
    return null;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="bg-ivory-100 p-6 sm:p-8 rounded-2xl border border-slate-900/15 shadow-sm relative overflow-hidden"
    >
      <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-amber-500/10 via-orange-500/5 to-transparent rounded-full blur-2xl pointer-events-none -mr-16 -mt-16" />

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
        <div className="space-y-3 max-w-2xl">
          <div className="flex items-center space-x-2.5">
            <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-amber-900/10 border border-amber-900/20 text-[11px] font-mono tracking-wider uppercase text-amber-900 font-semibold">
              <Flame className="w-3.5 h-3.5 mr-1.5 text-amber-700 animate-pulse" />
              Challenge of the Day (24h Featured)
            </span>
            <span className="text-xs font-mono px-2 py-0.5 rounded bg-slate-900/5 text-slate-700 uppercase font-medium">
              Difficulty: {problem.difficulty || (problem.difficulty_score < 2.0 ? "Easy" : problem.difficulty_score < 3.5 ? "Medium" : "Hard")} ({problem.difficulty_score?.toFixed(1) || "2.0"})
            </span>
          </div>

          <h3 className="text-2xl sm:text-3xl font-serif font-medium text-slate-900 tracking-tight leading-snug">
            {problem.title}
          </h3>

          <div className="line-clamp-3">
            <ProblemDescriptionRenderer content={problem.description} />
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 shrink-0">
          <Link
            href={`/problems/${problem.id}`}
            className="inline-flex items-center justify-center px-6 py-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-ivory-100 text-xs font-mono font-semibold tracking-wide transition-all shadow-md hover:shadow-lg group"
          >
            <span>Start Challenge</span>
            <ArrowUpRight className="w-4 h-4 ml-2 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5 text-amber-400" />
          </Link>
        </div>
      </div>
    </motion.div>
  );
};
