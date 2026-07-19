import React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  Code,
  BookOpen,
  Trophy,
  Activity,
  ShieldCheck,
  Terminal,
  ArrowUpRight,
  Sparkles,
  ExternalLink,
  Layers,
  Heart,
  Cpu,
} from "lucide-react";

export const Footer: React.FC = () => {
  return (
    <footer className="w-full bg-slate-950 text-ivory-100 border-t-2 border-slate-900 select-none relative overflow-hidden mt-20">
      {/* Crisp Solid Top Accent Line */}
      <div className="w-full h-1 bg-amber-500" />

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-12 sm:py-16 space-y-12">
        {/* Top Interactive CTA Button Bar ("Make a button like footer") */}
        <div className="bg-slate-900 rounded-3xl p-6 sm:p-8 border-2 border-slate-800 shadow-xl flex flex-col lg:flex-row items-center justify-between gap-6 transition-all duration-300 hover:border-slate-700">
          <div className="space-y-2 text-center lg:text-left">
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-slate-950 border border-slate-800 text-[11px] font-mono font-bold text-amber-400 uppercase tracking-widest">
              <Sparkles className="w-3.5 h-3.5 animate-spin text-amber-400" />
              <span>ZPD Interactive Engine Active</span>
            </div>
            <h3 className="text-xl sm:text-2xl font-serif font-bold tracking-tight text-ivory-100">
              Ready to challenge your active Zone of Proximal Development?
            </h3>
            <p className="text-xs sm:text-sm font-mono text-slate-400 max-w-xl">
              Solve algorithmic problems with real-time Socratic Virtual TA interventions and gotreesitter AST structural complexity scoring.
            </p>
          </div>

          {/* Interactive Footer Action Button */}
          <Link
            href="/modules"
            className="px-6 py-3.5 rounded-2xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-mono font-black text-xs sm:text-sm uppercase tracking-wider transition-all duration-200 hover:-translate-y-1 shadow-lg hover:shadow-xl flex items-center space-x-2 shrink-0 group border border-amber-300"
          >
            <span>Launch Curriculum Studio</span>
            <ArrowUpRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5 font-black" />
          </Link>
        </div>

        {/* Footer Navigation Columns & Lab Info */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 border-b border-slate-900 pb-12">
          {/* Column 1: Brand & Academic Identity */}
          <div className="space-y-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl bg-slate-900 border-2 border-slate-800 flex items-center justify-center shadow-md">
                <img src="/logo.svg" alt="Logo" className="w-7 h-7 object-contain" />
              </div>
              <span className="font-serif font-black text-lg tracking-tight text-ivory-100">
                AI Online Judge
              </span>
            </div>
            <p className="text-xs font-mono text-slate-400 leading-relaxed">
              Polyglot microservice platform engineered for research in Educational Data Mining (EDM) and AST structural logic error analysis.
            </p>
            <div className="flex items-center space-x-2 text-[11px] font-mono text-emerald-400 font-bold bg-slate-900/80 px-3 py-1.5 rounded-xl border border-slate-800 w-fit">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              <span>Isolate cgroups v2 Secure Sandbox</span>
            </div>
          </div>

          {/* Column 2: Platform Navigation */}
          <div className="space-y-3">
            <h4 className="text-xs font-mono font-bold uppercase tracking-widest text-slate-400">
              Platform Core
            </h4>
            <ul className="space-y-2 text-xs font-mono">
              {[
                { label: "Problem Repository", path: "/", icon: Code },
                { label: "Curriculum & ZPD Map", path: "/modules", icon: BookOpen },
                { label: "Global Leaderboard", path: "/leaderboard", icon: Trophy },
                { label: "EDM Effort Analytics", path: "/#edm-dashboard", icon: Activity },
                { label: "Student Profile", path: "/profile", icon: Terminal },
              ].map((item) => {
                const IconComp = item.icon;
                return (
                  <li key={item.label}>
                    <Link
                      href={item.path}
                      className="flex items-center space-x-2 text-slate-400 hover:text-amber-400 transition-colors duration-200 group py-0.5"
                    >
                      <IconComp className="w-3.5 h-3.5 text-slate-600 group-hover:text-amber-400 transition-colors shrink-0" />
                      <span>{item.label}</span>
                      <ArrowUpRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-all -translate-x-1 group-hover:translate-x-0 ml-auto" />
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>

          {/* Column 3: Academic & Technical Specs */}
          <div className="space-y-3">
            <h4 className="text-xs font-mono font-bold uppercase tracking-widest text-slate-400">
              Watanobe Laboratory
            </h4>
            <ul className="space-y-2 text-xs font-mono text-slate-400">
              <li className="flex items-center space-x-2 py-0.5">
                <span className="text-amber-400 font-bold">•</span>
                <span>University of Aizu, Japan</span>
              </li>
              <li className="flex items-center space-x-2 py-0.5">
                <span className="text-amber-400 font-bold">•</span>
                <span>Society 5.0 Smart Learning</span>
              </li>
              <li className="flex items-center space-x-2 py-0.5">
                <span className="text-amber-400 font-bold">•</span>
                <span>Socratic Pedagogy Engine</span>
              </li>
              <li className="flex items-center space-x-2 py-0.5">
                <span className="text-amber-400 font-bold">•</span>
                <span>gotreesitter AST Diff Scoring</span>
              </li>
              <li className="flex items-center space-x-2 py-0.5">
                <span className="text-amber-400 font-bold">•</span>
                <span>Content-Based Recommendation</span>
              </li>
            </ul>
          </div>

          {/* Column 4: System Architecture Highlights */}
          <div className="space-y-3">
            <h4 className="text-xs font-mono font-bold uppercase tracking-widest text-slate-400">
              Microservice Stack
            </h4>
            <div className="space-y-2 text-[11px] font-mono">
              <div className="bg-slate-900 p-2.5 rounded-xl border border-slate-800 flex items-center justify-between">
                <span className="text-slate-400">Sandbox Judge</span>
                <span className="text-ivory-100 font-bold">Go + Judge0</span>
              </div>
              <div className="bg-slate-900 p-2.5 rounded-xl border border-slate-800 flex items-center justify-between">
                <span className="text-slate-400">Virtual TA</span>
                <span className="text-amber-400 font-bold">FastAPI + GPT-4o-mini</span>
              </div>
              <div className="bg-slate-900 p-2.5 rounded-xl border border-slate-800 flex items-center justify-between">
                <span className="text-slate-400">AST Analysis</span>
                <span className="text-emerald-400 font-bold">gotreesitter Go</span>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Row: Copyright & All Rights Reserved */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-xs font-mono text-slate-400 pt-2">
          <div className="flex items-center space-x-1 text-center sm:text-left">
            <span>© {new Date().getFullYear()} AI Online Judge Platform. Designed & Engineered for</span>
            <span className="text-ivory-100 font-bold underline decoration-amber-500 underline-offset-4 ml-1">
              Prof. Yutaka Watanobe&apos;s Laboratory
            </span>
            <span>. All rights reserved.</span>
          </div>

          <div className="flex items-center space-x-4">
            <span className="flex items-center space-x-1.5 px-3 py-1 rounded-lg bg-slate-900 border border-slate-800 text-[10px]">
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              <span>System Operational</span>
            </span>
            <span className="text-slate-600">|</span>
            <span className="text-slate-400 hover:text-amber-400 transition-colors cursor-pointer">
              Privacy & Security Policy
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
};
