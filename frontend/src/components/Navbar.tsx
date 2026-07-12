import React from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { Cpu, LogOut, User as UserIcon, ShieldAlert } from "lucide-react";

export const Navbar: React.FC = () => {
  const { user, isAuthenticated, logout } = useAuth();

  return (
    <header className="sticky top-0 z-40 w-full bg-ivory-100/80 backdrop-blur-md border-b border-slate-900/10 transition-colors">
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center space-x-2.5 group">
          <div className="w-8 h-8 rounded-lg bg-slate-900 flex items-center justify-center text-ivory-100 font-serif font-bold text-lg transition-transform duration-300 ease-out group-hover:scale-105">
            <Cpu className="w-4 h-4 text-amber-500" />
          </div>
          <div>
            <span className="font-serif font-semibold text-base text-slate-900 tracking-tight block">
              AI Online Judge
            </span>
            <span className="text-[10px] font-mono text-slate-500 uppercase tracking-wider block">
              Watanobe Lab EDM
            </span>
          </div>
        </Link>

        <nav className="flex items-center space-x-6 text-sm font-medium">
          <Link
            href="/"
            className="text-slate-600 hover:text-slate-900 transition-colors tracking-tight"
          >
            Problems
          </Link>
          <Link
            href="/#edm-dashboard"
            className="text-slate-600 hover:text-slate-900 transition-colors tracking-tight"
          >
            EDM Metrics
          </Link>
          <Link
            href="/profile"
            className="text-slate-600 hover:text-slate-900 transition-colors tracking-tight font-semibold text-amber-900"
          >
            Profile & Dashboard
          </Link>

          {user?.role === "admin" && (
            <Link
              href="/admin/problems"
              className="flex items-center space-x-1.5 text-xs font-bold tracking-wider uppercase px-3 py-1.5 rounded-md bg-amber-500 text-slate-950 hover:bg-amber-400 transition-all shadow-xs"
            >
              <ShieldAlert className="w-3.5 h-3.5" />
              <span>Admin Page</span>
            </Link>
          )}

          {isAuthenticated ? (
            <div className="flex items-center space-x-4 pl-4 border-l border-slate-900/10">
              <Link
                href="/profile"
                className="flex items-center text-xs font-mono text-slate-700 bg-ivory-200/80 hover:bg-ivory-300 px-2.5 py-1 rounded-md transition-colors shadow-2xs"
              >
                <UserIcon className="w-3.5 h-3.5 mr-1.5 text-slate-500" />
                {user?.username}
              </Link>
              <button
                onClick={logout}
                className="flex items-center space-x-1.5 text-xs font-medium text-slate-600 hover:text-terracotta transition-colors py-1 px-2 rounded hover:bg-slate-900/5"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Logout</span>
              </button>
            </div>
          ) : (
            <div className="flex items-center space-x-3">
              <Link
                href="/login"
                className="text-xs font-medium text-slate-700 hover:text-slate-900 px-3 py-1.5 transition-colors"
              >
                Sign In
              </Link>
              <Link
                href="/register"
                className="text-xs font-medium bg-slate-900 text-ivory-100 px-4 py-2 rounded-lg transition-all duration-300 ease-out hover:bg-slate-800 hover:scale-[1.02] shadow-sm"
              >
                Register
              </Link>
            </div>
          )}
        </nav>
      </div>
    </header>
  );
};
