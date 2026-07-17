import React, { useState, useEffect } from "react";
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
  const [scrolled, setScrolled] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      setScrolled(currentScrollY > 20);

      const totalHeight = document.documentElement.scrollHeight - window.innerHeight;
      if (totalHeight > 0) {
        setScrollProgress((currentScrollY / totalHeight) * 100);
      } else {
        setScrollProgress(0);
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

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
    <div className={`sticky top-0 z-50 w-full pointer-events-none transition-all duration-500 ease-out ${scrolled ? "py-2.5 px-3 sm:px-6" : "py-0 px-0"}`}>
      <header
        className={`pointer-events-auto transition-all duration-500 ease-out relative overflow-hidden ${
          scrolled
            ? "max-w-[1340px] mx-auto rounded-2xl bg-ivory-100/95 backdrop-blur-xl border-2 border-slate-900/25 shadow-[0_12px_35px_rgba(0,0,0,0.18)] h-14 px-4 sm:px-6"
            : "w-full bg-ivory-100/85 backdrop-blur-md border-b-2 border-slate-900/15 shadow-sm h-20 px-4 sm:px-8"
        }`}
      >
        {/* Top Accent Bar (only visible when full width / not scrolled) */}
        {!scrolled && (
          <div className="absolute top-0 left-0 right-0 h-1 bg-slate-900" />
        )}

        <div className="w-full h-full flex items-center justify-between gap-2 sm:gap-4">
          {/* Brand Logo & Name */}
          <Link href="/" className="flex items-center space-x-2.5 group select-none shrink-0">
            <div className="relative flex items-center justify-center w-9 h-9 sm:w-10 sm:h-10 rounded-2xl bg-slate-900 border-2 border-slate-800 shadow-md transition-transform duration-300 ease-out group-hover:scale-105 overflow-hidden">
              <img src="/logo.svg" alt="AI Online Judge Logo" className="w-6 h-6 sm:w-7 sm:h-7 object-contain z-10 drop-shadow" />
              <div className="absolute inset-0 border border-white/10 rounded-2xl pointer-events-none" />
            </div>

            <div className="flex flex-col">
              <div className="flex items-center space-x-2">
                <span className="font-serif font-black text-base sm:text-xl text-slate-900 tracking-tight group-hover:text-amber-800 transition-colors">
                  AI Online Judge
                </span>
                <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded-full bg-slate-900 border border-slate-800 text-[9px] font-mono font-bold uppercase tracking-widest text-amber-300 shadow-2xs">
                  <Layers className="w-2.5 h-2.5 mr-1 text-amber-400" />
                  Socratic TA
                </span>
              </div>
              <span className={`text-[10px] font-mono text-slate-500 font-semibold tracking-wide flex items-center space-x-1.5 transition-all duration-300 ${
                scrolled ? "hidden xl:flex" : "hidden md:flex"
              }`}>
                <span>Watanobe Lab EDM</span>
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
                <span className="text-emerald-700 font-bold">gotreesitter AST</span>
              </span>
            </div>
          </Link>

          {/* Cohesive Navigation Buttons (Instant Stable CSS Active Styling without jumping layoutId) */}
          <nav className="hidden lg:flex items-center space-x-1 shrink-0">
            {navItems.map((item) => {
              const active = isActive(item.path);
              const IconComponent = item.icon;

              return (
                <Link
                  key={item.label}
                  href={item.path}
                  className={`px-3 py-1.5 rounded-xl font-mono text-xs font-bold tracking-tight transition-all duration-200 flex items-center space-x-1.5 select-none group border ${
                    active
                      ? "bg-slate-900 text-ivory-100 shadow-sm border-slate-800"
                      : "border-transparent text-slate-700 hover:text-slate-950 hover:bg-ivory-200/80 hover:border-slate-900/15"
                  }`}
                >
                  <IconComponent
                    className={`w-3.5 h-3.5 transition-transform duration-300 group-hover:scale-110 shrink-0 ${
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
                className={`px-3 py-1.5 rounded-xl font-mono text-xs font-black tracking-tight transition-all duration-200 flex items-center space-x-1 border group shadow-sm ml-1 ${
                  router.pathname.startsWith("/admin")
                    ? "border-slate-900 bg-slate-900 text-amber-400 ring-2 ring-amber-400/50"
                    : "border-slate-900 bg-amber-500 text-slate-950 hover:bg-amber-400 hover:-translate-y-0.5 shadow-sm"
                }`}
              >
                <ShieldAlert className="w-3.5 h-3.5 shrink-0" />
                <span>Admin Studio</span>
              </Link>
            )}
          </nav>

        {/* User Auth Actions (Compact Tightly Scaled Button Styles so they never push past boundaries) */}
        <div className="flex items-center space-x-2 shrink-0">
          {isAuthenticated ? (
            <div className="flex items-center space-x-1.5 pl-2 sm:pl-3 border-l-2 border-slate-900/15">
              <Link
                href="/profile"
                className="flex items-center space-x-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl border border-slate-900/20 bg-ivory-200/80 hover:bg-white hover:border-slate-900 text-xs font-mono font-bold text-slate-900 transition-all duration-200 shadow-2xs hover:shadow-sm group"
              >
                <div className="w-4.5 h-4.5 rounded-md bg-slate-900 text-amber-400 flex items-center justify-center font-bold text-[10px] group-hover:scale-105 transition-transform">
                  {(user?.username || "U")[0].toUpperCase()}
                </div>
                <span className="max-w-[90px] sm:max-w-[110px] truncate">{user?.username}</span>
              </Link>

              <button
                onClick={logout}
                title="Log out of AI Online Judge"
                className="px-2.5 sm:px-3 py-1.5 rounded-xl border border-slate-900/15 bg-ivory-200/50 hover:border-terracotta/80 hover:bg-terracotta/10 text-slate-700 hover:text-terracotta transition-all duration-200 flex items-center space-x-1 text-xs font-mono font-bold group"
              >
                <LogOut className="w-3.5 h-3.5 transition-transform group-hover:-translate-x-0.5" />
                <span className="hidden sm:inline">Logout</span>
              </button>
            </div>
          ) : (
            <div className="flex items-center space-x-1.5 sm:space-x-2">
              <Link
                href="/login"
                className="px-3 py-1.5 rounded-xl border border-slate-900/20 bg-ivory-200/80 hover:bg-white hover:border-slate-900 text-slate-800 hover:text-slate-950 text-xs font-mono font-bold transition-all duration-200 shadow-2xs flex items-center space-x-1 group"
              >
                <LogIn className="w-3.5 h-3.5 text-amber-600 group-hover:translate-x-0.5 transition-transform" />
                <span>Sign In</span>
              </Link>

              <Link
                href="/register"
                className="px-3 sm:px-3.5 py-1.5 rounded-xl border-2 border-slate-900 bg-slate-900 text-ivory-100 hover:bg-slate-800 hover:text-amber-300 text-xs font-mono font-black tracking-wider uppercase transition-all duration-200 shadow-sm flex items-center space-x-1 group shrink-0"
              >
                <ChevronRight className="w-3.5 h-3.5 text-amber-400 group-hover:translate-x-0.5 transition-transform" />
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
  </div>
  );
};
