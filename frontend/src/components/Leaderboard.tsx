import React, { useEffect, useState } from "react";
import axios from "axios";
import { Trophy } from "lucide-react";

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
          ? `${API_URL}/leaderboard?limit=25`
          : `${API_URL}/api/v1/leaderboard?limit=25`;
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
    // Poll every 15 seconds to keep ZSET rankings live
    const interval = setInterval(fetchLeaderboard, 15000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="w-full bg-ivory-100 rounded-2xl border border-slate-900/10 p-6 sm:p-8 shadow-sm transition-all duration-300">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-900/10">
        <div>
          <span className="text-[11px] font-mono uppercase tracking-widest text-slate-500 block mb-1">
            Redis O(log N) Sorted Set Ranking
          </span>
          <h3 className="text-xl font-serif font-semibold text-slate-900 tracking-tight flex items-center">
            <Trophy className="w-4.5 h-4.5 mr-2 text-slate-700" />
            Global Student Leaderboard
          </h3>
        </div>
        <div className="flex items-center space-x-2">
          <span className="inline-block w-2 h-2 rounded-full bg-emerald-600 animate-pulse" />
          <span className="text-xs font-mono text-slate-600">Live ZRANGE Updates</span>
        </div>
      </div>

      {loading && entries.length === 0 ? (
        <div className="py-12 flex flex-col items-center justify-center text-slate-500 space-y-3">
          <div className="w-5 h-5 border-2 border-slate-900/20 border-t-slate-800 rounded-full animate-spin" />
          <span className="text-xs font-mono tracking-tight">Synchronizing global standings...</span>
        </div>
      ) : error && entries.length === 0 ? (
        <div className="py-10 text-center text-xs font-mono text-slate-500 border border-dashed border-slate-900/10 rounded-xl my-4">
          {error}
        </div>
      ) : entries.length === 0 ? (
        <div className="py-12 text-center text-xs font-mono text-slate-500 border border-dashed border-slate-900/10 rounded-xl my-4">
          No accepted submissions yet. Be the first to solve a problem and claim rank #1.
        </div>
      ) : (
        <div className="mt-4 divide-y divide-slate-900/5">
          {entries.map((entry) => {
            const isTopThree = entry.rank <= 3;
            return (
              <div
                key={entry.user_id}
                className="py-3.5 px-3 flex items-center justify-between transition-colors hover:bg-slate-900/[0.02] rounded-xl -mx-3"
              >
                <div className="flex items-center space-x-4">
                  <span
                    className={`w-7 h-7 flex items-center justify-center rounded-lg text-xs font-mono font-semibold ${
                      entry.rank === 1
                        ? "bg-slate-900 text-ivory-100 shadow-sm"
                        : entry.rank === 2
                        ? "bg-slate-700 text-ivory-100"
                        : entry.rank === 3
                        ? "bg-slate-500 text-ivory-100"
                        : "text-slate-500 bg-slate-900/5"
                    }`}
                  >
                    {entry.rank}
                  </span>
                  <div>
                    <div className="flex items-center space-x-2">
                      <span
                        className={`text-sm tracking-tight ${
                          isTopThree
                            ? "font-serif font-semibold text-slate-900"
                            : "font-sans font-medium text-slate-800"
                        }`}
                      >
                        {entry.username}
                      </span>
                      {entry.rank === 1 && (
                        <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-900/10 text-slate-800 uppercase">
                          Leader
                        </span>
                      )}
                    </div>
                    <span className="text-[11px] font-mono text-slate-400 block tracking-tight">
                      ID: {entry.user_id.slice(0, 8)}...
                    </span>
                  </div>
                </div>

                <div className="flex items-center space-x-3 text-right">
                  <div>
                    <span className="text-sm font-mono font-semibold text-slate-900 block">
                      {entry.score}
                    </span>
                    <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400">
                      PTS
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
