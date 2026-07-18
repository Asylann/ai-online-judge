import React from "react";
import Head from "next/head";
import { Trophy, Award, Sparkles, Activity } from "lucide-react";
import { Leaderboard } from "@/components/Leaderboard";

export default function LeaderboardPage() {
  return (
    <>
      <Head>
        <title>Global Leaderboard | AI Online Judge</title>
        <meta
          name="description"
          content="Live Redis Sorted Set global standings and Educational Data Mining effort metrics across all student submissions."
        />
      </Head>

      <div className="flex-1 bg-ivory-100 py-12 px-6 sm:px-12 lg:px-20">
        <div className="max-w-5xl mx-auto space-y-10">
          {/* Header Banner */}
          <div className="space-y-4 border-b border-slate-900/10 pb-8">
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-xs font-mono tracking-wider text-amber-800 uppercase">
              <Trophy className="w-3.5 h-3.5 text-amber-600" />
              <span>Gamified ZPD Progression & Standing</span>
            </div>
            <h1 className="text-4xl sm:text-5xl font-serif font-semibold text-slate-900 tracking-tight flex items-center gap-3">
              <Trophy className="w-9 h-9 text-amber-500 flex-shrink-0" />
              Global Student Leaderboard
            </h1>
            <p className="text-base sm:text-lg text-slate-600 font-sans max-w-3xl leading-relaxed">
              Real-time rankings powered by Redis <code className="font-mono text-sm bg-ivory-200 px-1.5 py-0.5 rounded text-slate-800">ZADD</code> and <code className="font-mono text-sm bg-ivory-200 px-1.5 py-0.5 rounded text-slate-800">ZRANGE</code> O(log N) sorted sets. Each accepted solution awards +10 effort points while tracking structural complexity via <code className="font-mono text-sm bg-ivory-200 px-1.5 py-0.5 rounded text-slate-800">gotreesitter</code>.
            </p>
          </div>

          {/* Gamification Explanation Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-6 rounded-2xl bg-ivory-200/60 border border-slate-900/10 space-y-2">
              <div className="w-9 h-9 rounded-xl bg-amber-500/20 flex items-center justify-center text-amber-800 mb-3">
                <Award className="w-5 h-5" />
              </div>
              <h3 className="font-serif font-semibold text-lg text-slate-900">10 Pts per Accepted</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                When all test cases pass in our cgroup v2 sandbox, your global score instantly increments via atomic Redis transaction.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-ivory-200/60 border border-slate-900/10 space-y-2">
              <div className="w-9 h-9 rounded-xl bg-emerald-500/20 flex items-center justify-center text-emerald-800 mb-3">
                <Activity className="w-5 h-5" />
              </div>
              <h3 className="font-serif font-semibold text-lg text-slate-900">Live O(log N) Ranking</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                No database scans required. Standings are pushed and fetched directly from high-speed in-memory sorted sets.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-ivory-200/60 border border-slate-900/10 space-y-2">
              <div className="w-9 h-9 rounded-xl bg-blue-500/20 flex items-center justify-center text-blue-800 mb-3">
                <Trophy className="w-5 h-5" />
              </div>
              <h3 className="font-serif font-semibold text-lg text-slate-900">EDM & ZPD Alignment</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Scores complement your Cognitive Effort Index and AST structural complexity profile for Watanobe lab analytics.
              </p>
            </div>
          </div>

          {/* Main Leaderboard Table */}
          <Leaderboard />
        </div>
      </div>
    </>
  );
}
