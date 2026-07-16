import React from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import { motion } from "framer-motion";
import { useAuth } from "@/context/AuthContext";
import {
  Code,
  Trophy,
  BookOpen,
  Activity,
  User as UserIcon,
  ShieldAlert,
  LogOut,
  LogIn,
  Sparkles,
  Terminal,
  Scale,
  ChevronRight,
  Layers,
} from "lucide-react";

export const Navbar: React.FC = () => {
  const { user, isAuthenticated, logout } = useAuth();
  const router = useRouter();

  // Helper to check active route
  const isActive = (path: string) => {
    if (path === "/") {
      return router.pathname === "/" && !router.asPath.includes("#");
    }
    if (path === "/#edm-dashboard") {
      return router.asPath.includes("#edm-dashboard");
    }
    return router.pathname.startsWith(path);
  };

  const navItems = [
    { label: "Problems", path: "/", icon: Code },
    { label: "Curriculum", path: "/modules", icon: BookOpen },
    { label: "Leaderboard", path: "/leaderboard", icon: Trophy },
    { label: "EDM Metrics", path: "/#edm-dashboard", icon: Activity },
    { label: "Dashboard", path: "/profile", icon: UserIcon },
  ];

  return (
    <header className="sticky top-0 z-50 w-full bg-ivory-100/95 backdrop-blur-md border-b-2 border-slate-900/15 shadow-sm transition-all duration-300">
      {/* Clean Solid Top Bar */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-slate-900" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-20 flex items-center justify-between gap-4">
        {/* Brand Logo & Name */}
        <Link href="/" className="flex items-center space-x-3 group select-none shrink-0">
          <div className="relative flex items-center justify-center w-11 h-11 rounded-2xl bg-slate-900 border-2 border-slate-800 shadow-md transition-transform duration-300 ease-out group-hover:scale-105 overflow-hidden">
            <img src="/logo.svg" alt="AI Online Judge Logo" className="w-8 h-8 object-contain z-10 drop-shadow" />
            <div className="absolute inset-0 border border-white/10 rounded-2xl pointer-events-none" />
          </div>

          <div className="flex flex-col">
            <div className="flex items-center space-x-2">
              <span className="font-serif font-black text-lg sm:text-xl text-slate-900 tracking-tight group-hover:text-amber-800 transition-colors">
                AI Online Judge
              </span>
              <span className="hidden md:inline-flex items-center px-2 py-0.5 rounded-full bg-slate-900 border border-slate-800 text-[9px] font-mono font-bold uppercase tracking-widest text-amber-300 shadow-2xs">
                <Sparkles className="w-2.5 h-2.5 mr-1 text-amber-400 animate-spin" />
                Socratic TA
              </span>
            </div>
            <span className="text-[11px] font-mono text-slate-500 font-semibold tracking-wide flex items-center space-x-1.5">
              <span>Watanobe Lab EDM</span>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
              <span className="text-emerald-700 font-bold">gotreesitter AST</span>
            </span>
          </div>
        </Link>

        {/* Cohesive Navigation Buttons (Clean Solid Basic Style) */}
        <nav className="hidden lg:flex items-center space-x-2">
          {navItems.map((item) => {
            const active = isActive(item.path);
            const IconComponent = item.icon;

            return (
              <Link
                key={item.label}
                href={item.path}
                className={`px-3.5 py-2 rounded-xl font-mono text-xs font-bold tracking-tight transition-all duration-200 flex items-center space-x-2 border select-none group ${
                  active
                    ? "border-slate-900 bg-slate-900 text-ivory-100 shadow-sm"
                    : "border-slate-900/15 bg-ivory-200/80 text-slate-700 hover:border-slate-900 hover:text-slate-950 hover:bg-white hover:-translate-y-0.5 shadow-2xs hover:shadow-sm"
                }`}
              >
                <IconComponent
                  className={`w-4 h-4 transition-transform duration-300 group-hover:scale-110 shrink-0 ${
                    active ? "text-amber-400 font-bold" : "text-slate-600 group-hover:text-amber-700"
                  }`}
                />
                <span>{item.label}</span>

                {active && (
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400 ml-0.5" />
                )}
              </Link>
            );
          })}

          {/* Admin Button if Admin */}
          {user?.role === "admin" && (
            <Link
              href="/admin/problems"
              className={`px-3.5 py-2 rounded-xl font-mono text-xs font-black tracking-tight transition-all duration-200 flex items-center space-x-1.5 border group shadow-sm ${
                router.pathname.startsWith("/admin")
                  ? "border-slate-900 bg-slate-900 text-amber-400 ring-2 ring-amber-400/50"
                  : "border-slate-900 bg-amber-500 text-slate-950 hover:bg-amber-400 hover:-translate-y-0.5 shadow-sm"
              }`}
            >
              <ShieldAlert className="w-4 h-4 animate-bounce shrink-0" />
              <span>Admin Studio</span>
            </Link>
          )}
        </nav>

        {/* User Auth Actions (Clean Solid Button Styles) */}
        <div className="flex items-center space-x-2.5 shrink-0">
          {isAuthenticated ? (
            <div className="flex items-center space-x-2 pl-3 border-l-2 border-slate-900/15">
              <Link
                href="/profile"
                className="flex items-center space-x-2 px-3 py-1.5 rounded-xl border border-slate-900/20 bg-ivory-200/80 hover:bg-white hover:border-slate-900 text-xs font-mono font-bold text-slate-900 transition-all duration-200 shadow-2xs hover:shadow-sm group"
              >
                <div className="w-5 h-5 rounded-md bg-slate-900 text-amber-400 flex items-center justify-center font-bold text-[10px] group-hover:scale-105 transition-transform">
                  {(user?.username || "U")[0].toUpperCase()}
                </div>
                <span className="max-w-[110px] truncate">{user?.username}</span>
              </Link>

              <button
                onClick={logout}
                title="Log out of AI Online Judge"
                className="px-3 py-2 rounded-xl border border-slate-900/15 bg-ivory-200/50 hover:border-terracotta/80 hover:bg-terracotta/10 text-slate-700 hover:text-terracotta transition-all duration-200 flex items-center space-x-1.5 text-xs font-mono font-bold group"
              >
                <LogOut className="w-4 h-4 transition-transform group-hover:-translate-x-0.5" />
                <span className="hidden sm:inline">Logout</span>
              </button>
            </div>
          ) : (
            <div className="flex items-center space-x-2">
              <Link
                href="/login"
                className="px-3.5 py-2 rounded-xl border border-slate-900/20 bg-ivory-200/80 hover:bg-white hover:border-slate-900 text-slate-800 hover:text-slate-950 text-xs font-mono font-bold transition-all duration-200 shadow-2xs hover:-translate-y-0.5 flex items-center space-x-1.5 group"
              >
                <LogIn className="w-3.5 h-3.5 text-amber-600 group-hover:translate-x-0.5 transition-transform" />
                <span>Sign In</span>
              </Link>

              <Link
                href="/register"
                className="px-4 py-2 rounded-xl border-2 border-slate-900 bg-slate-900 text-ivory-100 hover:bg-slate-800 hover:text-amber-300 text-xs font-mono font-black tracking-wider uppercase transition-all duration-200 hover:scale-[1.02] shadow-sm flex items-center space-x-1.5 group"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-400 animate-spin" />
                <span>Register</span>
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* Mobile Navigation Row (So mobile users also get the stunning unified buttons!) */}
      <div className="lg:hidden px-4 pb-3 flex items-center space-x-1.5 overflow-x-auto no-scrollbar border-t border-slate-900/10 pt-2.5">
        {navItems.map((item) => {
          const active = isActive(item.path);
          const IconComponent = item.icon;
          return (
            <Link
              key={item.label}
              href={item.path}
              className={`shrink-0 px-3 py-1.5 rounded-lg font-mono text-xs font-bold transition-all flex items-center space-x-1.5 border ${
                active
                  ? "border-slate-900 bg-slate-900 text-ivory-100 shadow-xs"
                  : "border-slate-900/15 bg-ivory-200/80 text-slate-700 hover:border-slate-900 hover:text-slate-950 hover:bg-white"
              }`}
            >
              <IconComponent className={`w-3.5 h-3.5 ${active ? "text-amber-400 font-bold" : "text-slate-500"}`} />
              <span>{item.label}</span>
            </Link>
          );
        })}
        {user?.role === "admin" && (
          <Link
            href="/admin/problems"
            className="shrink-0 px-3 py-1.5 rounded-lg font-mono text-xs font-black bg-amber-500 text-slate-950 border border-slate-900 flex items-center space-x-1"
          >
            <ShieldAlert className="w-3.5 h-3.5" />
            <span>Admin Studio</span>
          </Link>
        )}
      </div>
    </header>
  );
};
