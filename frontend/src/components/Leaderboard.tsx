import React, { useEffect, useState } from "react";
import axios from "axios";
import { Trophy, Award, Medal, Crown, Activity } from "lucide-react";
import { motion } from "framer-motion";

export interface LeaderboardEntry {
  rank: number;
  user_id: string;
  username: string;
  score: number;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

export const Leaderboard: React.FC = () => {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchLeaderboard = async () => {
      try {
        setLoading(true);
        const endpoint = API_URL.endsWith("/api/v1")
          ? `${API_URL}/leaderboard?limit=10`
          : `${API_URL}/api/v1/leaderboard?limit=10`;
        const res = await axios.get(endpoint);
        if (res.data && res.data.leaderboard) {
          setEntries(res.data.leaderboard);
        }
      } catch (err) {
        console.error("Failed to fetch leaderboard:", err);
        setError("Unable to load current rankings.");
      } finally {
        setLoading(false);
      }
    };

    fetchLeaderboard();
    const interval = setInterval(fetchLeaderboard, 15000);
    return () => clearInterval(interval);
  }, []);

  // Separate Top 3 for the Sports Podium vs Ranks 4-10 for the List
  const topTen = entries.slice(0, 10);
  const rank1 = topTen.find((e) => e.rank === 1) || (topTen.length > 0 ? topTen[0] : null);
  const rank2 = topTen.find((e) => e.rank === 2) || (topTen.length > 1 ? topTen[1] : null);
  const rank3 = topTen.find((e) => e.rank === 3) || (topTen.length > 2 ? topTen[2] : null);
  const runnersUp = topTen.filter((e) => e.rank >= 4 && e.rank <= 10);

  return (
    <div className="w-full bg-ivory-100 rounded-3xl border border-slate-900/15 p-6 sm:p-10 shadow-lg transition-all duration-300">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-8 border-b border-slate-900/10">
        <div>
          <span className="text-[11px] font-mono uppercase tracking-widest text-slate-500 block mb-1">
            Redis O(log N) Sorted Set Ranking • Top 10 Athletes
          </span>
          <h3 className="text-2xl font-serif font-bold text-slate-900 tracking-tight flex items-center">
            <Trophy className="w-6 h-6 mr-2.5 text-amber-500" />
            Global Student Leaderboard Podium
          </h3>
        </div>
        <div className="flex items-center space-x-2.5 px-3 py-1.5 rounded-xl bg-ivory-200 border border-slate-900/10">
          <span className="inline-block w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
          <span className="text-xs font-mono font-bold text-slate-700">Live ZRANGE Updates</span>
        </div>
      </div>

      {loading && entries.length === 0 ? (
        <div className="py-20 flex flex-col items-center justify-center text-slate-500 space-y-3">
          <div className="w-7 h-7 border-3 border-slate-900/20 border-t-slate-900 rounded-full animate-spin" />
          <span className="text-xs font-mono tracking-tight font-medium">Synchronizing global sports standings...</span>
        </div>
      ) : error && entries.length === 0 ? (
        <div className="py-12 text-center text-xs font-mono text-slate-500 border border-dashed border-slate-900/15 rounded-2xl my-6">
          {error}
        </div>
      ) : entries.length === 0 ? (
        <div className="py-16 text-center text-xs font-mono text-slate-500 border border-dashed border-slate-900/15 rounded-2xl my-6">
          No accepted submissions yet. Be the first to solve a problem and claim rank #1 on the podium!
        </div>
      ) : (
        <div className="space-y-12 mt-8">
          {/* Sports-Like 3-Step Podium Animation */}
          <div className="grid grid-cols-3 gap-3 sm:gap-6 items-end max-w-3xl mx-auto pt-6 px-2">
            {/* Rank #2 (Silver - Left) */}
            <div className="flex flex-col items-center">
              {rank2 ? (
                <motion.div
                  initial={{ opacity: 0, y: 35 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.15 }}
                  className="w-full flex flex-col items-center"
                >
                  <div className="mb-3 flex flex-col items-center text-center">
                    <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-slate-200 border-2 border-slate-400 flex items-center justify-center text-slate-700 font-serif font-black text-lg shadow-md mb-2 relative group">
                      <span>2nd</span>
                      <Medal className="w-4 h-4 text-slate-500 absolute -top-1.5 -right-1.5 bg-ivory-100 rounded-full p-0.5 shadow-2xs" />
                    </div>
                    <span className="font-serif font-bold text-xs sm:text-sm text-slate-900 line-clamp-1 max-w-[110px]">
                      {rank2.username}
                    </span>
                    <span className="font-mono text-[11px] font-bold text-slate-600 bg-slate-200/80 px-2 py-0.5 rounded mt-1">
                      {rank2.score} PTS
                    </span>
                  </div>
                  {/* Silver Pedestal Step */}
                  <div className="w-full h-32 sm:h-40 rounded-t-2xl bg-gradient-to-t from-slate-900 via-slate-800 to-slate-700 border-t-4 border-slate-300 shadow-xl flex flex-col items-center justify-center p-3 relative overflow-hidden group">
                    <div className="absolute inset-0 bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                    <span className="text-4xl sm:text-5xl font-serif font-black text-slate-300/30 tracking-tighter">
                      #2
                    </span>
                    <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-300 mt-1">
                      Silver Medal
                    </span>
                  </div>
                </motion.div>
              ) : (
                <div className="w-full h-32 sm:h-40 rounded-t-2xl bg-slate-900/5 border border-dashed border-slate-900/10 flex items-center justify-center text-xs font-mono text-slate-400">
                  Open #2
                </div>
              )}
            </div>

            {/* Rank #1 (Gold - Center - Highest) */}
            <div className="flex flex-col items-center -mb-2 z-10">
              {rank1 ? (
                <motion.div
                  initial={{ opacity: 0, y: 50, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{ type: "spring", stiffness: 200, damping: 20 }}
                  className="w-full flex flex-col items-center"
                >
                  <div className="mb-3 flex flex-col items-center text-center">
                    <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-amber-400 border-2 border-amber-300 flex items-center justify-center text-slate-950 font-serif font-black text-xl shadow-lg mb-2 relative group animate-bounce duration-1000">
                      <span>1st</span>
                      <Crown className="w-5 h-5 text-amber-900 absolute -top-2.5 bg-amber-300 rounded-full p-0.5 shadow-sm" />
                    </div>
                    <span className="font-serif font-black text-sm sm:text-base text-slate-950 line-clamp-1 max-w-[130px]">
                      {rank1.username}
                    </span>
                    <span className="font-mono text-xs font-black text-amber-900 bg-amber-400/30 border border-amber-500/30 px-2.5 py-0.5 rounded-full mt-1">
                      {rank1.score} PTS
                    </span>
                  </div>
                  {/* Gold Pedestal Step */}
                  <div className="w-full h-44 sm:h-52 rounded-t-3xl bg-gradient-to-t from-slate-950 via-slate-900 to-amber-950/80 border-t-4 border-amber-400 shadow-2xl flex flex-col items-center justify-center p-3 relative overflow-hidden group">
                    <div className="absolute inset-0 bg-gradient-to-b from-amber-400/15 to-transparent pointer-events-none" />
                    <Trophy className="w-8 h-8 text-amber-400 mb-1 drop-shadow" />
                    <span className="text-5xl sm:text-6xl font-serif font-black text-amber-400/40 tracking-tighter">
                      #1
                    </span>
                    <span className="text-[11px] font-mono font-black uppercase tracking-widest text-amber-300 mt-1">
                      Champion
                    </span>
                  </div>
                </motion.div>
              ) : (
                <div className="w-full h-44 sm:h-52 rounded-t-3xl bg-slate-900/5 border border-dashed border-slate-900/10 flex items-center justify-center text-xs font-mono text-slate-400">
                  Open #1
                </div>
              )}
            </div>

            {/* Rank #3 (Bronze - Right) */}
            <div className="flex flex-col items-center">
              {rank3 ? (
                <motion.div
                  initial={{ opacity: 0, y: 25 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.25 }}
                  className="w-full flex flex-col items-center"
                >
                  <div className="mb-3 flex flex-col items-center text-center">
                    <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-amber-800/30 border-2 border-amber-700 flex items-center justify-center text-amber-900 font-serif font-black text-lg shadow-md mb-2 relative group">
                      <span>3rd</span>
                      <Award className="w-4 h-4 text-amber-800 absolute -top-1.5 -right-1.5 bg-ivory-100 rounded-full p-0.5 shadow-2xs" />
                    </div>
                    <span className="font-serif font-bold text-xs sm:text-sm text-slate-900 line-clamp-1 max-w-[110px]">
                      {rank3.username}
                    </span>
                    <span className="font-mono text-[11px] font-bold text-amber-900 bg-amber-800/15 px-2 py-0.5 rounded mt-1">
                      {rank3.score} PTS
                    </span>
                  </div>
                  {/* Bronze Pedestal Step */}
                  <div className="w-full h-24 sm:h-32 rounded-t-2xl bg-gradient-to-t from-slate-900 via-slate-800 to-amber-950/60 border-t-4 border-amber-700 shadow-lg flex flex-col items-center justify-center p-3 relative overflow-hidden group">
                    <div className="absolute inset-0 bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                    <span className="text-3xl sm:text-4xl font-serif font-black text-amber-700/30 tracking-tighter">
                      #3
                    </span>
                    <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-amber-600 mt-1">
                      Bronze Medal
                    </span>
                  </div>
                </motion.div>
              ) : (
                <div className="w-full h-24 sm:h-32 rounded-t-2xl bg-slate-900/5 border border-dashed border-slate-900/10 flex items-center justify-center text-xs font-mono text-slate-400">
                  Open #3
                </div>
              )}
            </div>
          </div>

          {/* Ranks 4 to 10 List */}
          <div className="border-t border-slate-900/10 pt-8">
            <div className="flex items-center justify-between mb-4 px-2">
              <span className="font-serif font-bold text-base text-slate-900">
                Challengers Division (Top 10)
              </span>
              <span className="text-xs font-mono text-slate-500 uppercase tracking-wider">
                Rankings #4 — #10
              </span>
            </div>

            {runnersUp.length === 0 ? (
              <div className="py-8 text-center text-xs font-mono text-slate-500 bg-ivory-200/60 rounded-xl border border-slate-900/10">
                No runners-up currently listed. Submit more code solutions to fill the top 10 standings.
              </div>
            ) : (
              <div className="divide-y divide-slate-900/10 bg-ivory-200/60 rounded-2xl border border-slate-900/10 overflow-hidden">
                {runnersUp.map((entry, idx) => (
                  <motion.div
                    key={entry.user_id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3, delay: idx * 0.05 }}
                    className="py-4 px-5 flex items-center justify-between transition-colors hover:bg-white group"
                  >
                    <div className="flex items-center space-x-4">
                      <span className="w-8 h-8 flex items-center justify-center rounded-xl bg-slate-900 text-ivory-100 text-xs font-mono font-bold shadow-2xs group-hover:scale-105 transition-transform">
                        #{entry.rank}
                      </span>
                      <div>
                        <div className="flex items-center space-x-2">
                          <span className="font-sans font-bold text-sm text-slate-900">
                            {entry.username}
                          </span>
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-900/5 text-slate-600">
                            Top 10 Finalist
                          </span>
                        </div>
                        <span className="text-[11px] font-mono text-slate-500 block">
                          Athlete ID: {entry.user_id.slice(0, 8)}...
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center space-x-3 text-right">
                      <div className="bg-slate-900/5 px-3 py-1.5 rounded-xl border border-slate-900/10 group-hover:border-slate-900/30 transition-colors">
                        <span className="text-sm font-mono font-black text-slate-900">
                          {entry.score}
                        </span>
                        <span className="text-[10px] font-mono uppercase tracking-wider text-slate-500 ml-1.5">
                          PTS
                        </span>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
