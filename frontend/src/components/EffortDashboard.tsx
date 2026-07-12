import React from "react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";
import { Activity, Cpu, Layers } from "lucide-react";

export interface SubmissionMetric {
  attempt: number;
  cognitive_effort_index: number;
  execution_time_ms: number;
  ast_complexity_score: number;
  status: string;
}

interface EffortDashboardProps {
  metrics: SubmissionMetric[];
}

export const EffortDashboard: React.FC<EffortDashboardProps> = ({ metrics }) => {
  return (
    <div className="space-y-6">
      {/* Metrics Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-ivory-100 p-5 rounded-xl border border-slate-900/10 shadow-sm transition-all duration-300 hover:border-slate-900/20">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-mono uppercase tracking-wider">Cognitive Effort Index</span>
            <Activity className="w-4 h-4 text-amber-700" />
          </div>
          <div className="text-2xl font-serif font-semibold text-slate-900 tracking-tight">
            {metrics.length > 0
              ? metrics[metrics.length - 1].cognitive_effort_index.toFixed(2)
              : "0.00"}
          </div>
          <p className="text-[11px] text-slate-500 mt-1 font-sans">
            Composite ZPD struggle rating (EDM)
          </p>
        </div>

        <div className="bg-ivory-100 p-5 rounded-xl border border-slate-900/10 shadow-sm transition-all duration-300 hover:border-slate-900/20">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-mono uppercase tracking-wider">Sandbox Latency</span>
            <Cpu className="w-4 h-4 text-slate-700" />
          </div>
          <div className="text-2xl font-serif font-semibold text-slate-900 tracking-tight">
            {metrics.length > 0
              ? `${metrics[metrics.length - 1].execution_time_ms} ms`
              : "0 ms"}
          </div>
          <p className="text-[11px] text-slate-500 mt-1 font-sans">
            Executor CPU time inside isolate cgroup
          </p>
        </div>

        <div className="bg-ivory-100 p-5 rounded-xl border border-slate-900/10 shadow-sm transition-all duration-300 hover:border-slate-900/20">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-mono uppercase tracking-wider">AST Complexity</span>
            <Layers className="w-4 h-4 text-slate-700" />
          </div>
          <div className="text-2xl font-serif font-semibold text-slate-900 tracking-tight">
            {metrics.length > 0
              ? metrics[metrics.length - 1].ast_complexity_score.toFixed(2)
              : "0.00"}
          </div>
          <p className="text-[11px] text-slate-500 mt-1 font-sans">
            gotreesitter structural complexity score
          </p>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Cognitive Effort Trajectory */}
        <div className="bg-ivory-100 p-6 rounded-xl border border-slate-900/10 shadow-sm">
          <h4 className="text-xs font-mono uppercase tracking-wider text-slate-600 mb-4">
            Educational Data Mining (EDM) — Cognitive Effort Trajectory
          </h4>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={metrics} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e9e6dc" vertical={false} />
                <XAxis
                  dataKey="attempt"
                  stroke="#75756f"
                  tickLine={false}
                  tick={{ fontSize: 11, fontFamily: "monospace" }}
                  label={{ value: "Attempt #", position: "insideBottomRight", offset: -5, fontSize: 10 }}
                />
                <YAxis
                  stroke="#75756f"
                  tickLine={false}
                  tick={{ fontSize: 11, fontFamily: "monospace" }}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#141413",
                    borderColor: "#222220",
                    borderRadius: "8px",
                    color: "#faf9f5",
                    fontSize: "12px",
                    fontFamily: "monospace",
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="cognitive_effort_index"
                  stroke="#141413"
                  strokeWidth={2}
                  dot={{ r: 4, fill: "#d97706", strokeWidth: 0 }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Execution Time vs AST Complexity */}
        <div className="bg-ivory-100 p-6 rounded-xl border border-slate-900/10 shadow-sm">
          <h4 className="text-xs font-mono uppercase tracking-wider text-slate-600 mb-4">
            Sandbox Execution Latency (ms) across Attempts
          </h4>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={metrics} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e9e6dc" vertical={false} />
                <XAxis
                  dataKey="attempt"
                  stroke="#75756f"
                  tickLine={false}
                  tick={{ fontSize: 11, fontFamily: "monospace" }}
                />
                <YAxis
                  stroke="#75756f"
                  tickLine={false}
                  tick={{ fontSize: 11, fontFamily: "monospace" }}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#141413",
                    borderColor: "#222220",
                    borderRadius: "8px",
                    color: "#faf9f5",
                    fontSize: "12px",
                    fontFamily: "monospace",
                  }}
                />
                <Bar dataKey="execution_time_ms" fill="#3d3d3a" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};
