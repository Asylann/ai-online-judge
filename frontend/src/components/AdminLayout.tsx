import React from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import { useAuth } from "@/context/AuthContext";
import { Users, FileCode, ListChecks, PlusCircle, ShieldAlert, ArrowLeft } from "lucide-react";

interface AdminLayoutProps {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
  action?: React.ReactNode;
}

export const AdminLayout: React.FC<AdminLayoutProps> = ({
  children,
  title = "Admin Portal",
  subtitle = "System management & AI evaluation suite generation",
  action,
}) => {
  const router = useRouter();
  const { user, isAuthenticated, authReady } = useAuth();

  // Navigation items for admin sidebar
  const navItems = [
    { name: "Problems", href: "/admin/problems", icon: FileCode },
    { name: "Users", href: "/admin/users", icon: Users },
    { name: "Submissions", href: "/admin/submissions", icon: ListChecks },
  ];

  if (!authReady) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center text-slate-500 font-mono text-sm">
        <span>Verifying Admin Authorization...</span>
      </div>
    );
  }

  if (!isAuthenticated || user?.role !== "admin") {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center px-6 text-center">
        <div className="w-16 h-16 rounded-2xl bg-amber-100 border border-amber-300 flex items-center justify-center text-amber-700 mb-6 shadow-sm">
          <ShieldAlert className="w-8 h-8 text-amber-700" />
        </div>
        <h1 className="font-serif text-3xl font-bold text-slate-900 mb-2">
          Access Denied
        </h1>
        <p className="text-slate-600 max-w-md mx-auto mb-8 font-sans text-sm leading-relaxed">
          You are not authorized to view this workspace. Privileged access (`admin` role) is required to manage problems, users, and AI test cases.
        </p>
        <Link
          href="/"
          className="bg-slate-900 hover:bg-slate-800 text-ivory-100 px-6 py-3 rounded-lg font-medium text-sm transition-all shadow-md hover:scale-[1.01]"
        >
          Return to Student App
        </Link>
      </div>
    );
  }

  return (
    <div className="w-full flex-1 flex flex-col font-sans selection:bg-amber-200 selection:text-slate-900">
      <div className="max-w-7xl w-full mx-auto px-6 py-8 flex-1 flex flex-col md:flex-row gap-8">
        {/* Sidebar Navigation */}
        <aside className="w-full md:w-64 shrink-0">
          <div className="bg-ivory-200/60 border border-slate-900/10 rounded-lg p-5 sticky top-24">
            <div className="flex items-center space-x-2 mb-6 pb-4 border-b border-slate-900/10">
              <div className="w-7 h-7 rounded bg-slate-900 text-ivory-100 flex items-center justify-center font-serif text-xs font-bold">
                <ShieldAlert className="w-4 h-4 text-amber-500" />
              </div>
              <div>
                <h2 className="font-serif font-bold text-sm text-slate-900 leading-tight">
                  Admin Workspace
                </h2>
                <span className="text-[10px] font-mono text-slate-500 uppercase tracking-widest block">
                  Privileged Access
                </span>
              </div>
            </div>

            <nav className="space-y-1.5">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = router.pathname.startsWith(item.href) && item.href !== "/admin";
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={`flex items-center justify-between px-3.5 py-2.5 rounded-md text-sm font-medium transition-colors border ${
                      isActive
                        ? "bg-slate-900 text-ivory-100 border-slate-900"
                        : "text-slate-700 bg-transparent border-transparent hover:bg-ivory-300/60 hover:text-slate-900"
                    }`}
                  >
                    <div className="flex items-center space-x-2.5">
                      <Icon className={`w-4 h-4 ${isActive ? "text-amber-400" : "text-slate-500"}`} />
                      <span>{item.name}</span>
                    </div>
                  </Link>
                );
              })}

              <div className="pt-4 mt-4 border-t border-slate-900/10">
                <Link
                  href="/admin/problems/new"
                  className="flex items-center justify-center space-x-2 w-full bg-amber-900/90 hover:bg-amber-900 text-ivory-100 px-3.5 py-2.5 rounded-md text-xs font-semibold tracking-wide transition-all duration-200 hover:scale-[1.01]"
                >
                  <PlusCircle className="w-4 h-4 text-amber-300" />
                  <span>Create Problem</span>
                </Link>
              </div>
            </nav>

            <div className="mt-8 pt-4 border-t border-slate-900/10">
              <Link
                href="/"
                className="flex items-center space-x-2 text-xs font-mono text-slate-500 hover:text-slate-900 transition-colors"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Return to Student App</span>
              </Link>
            </div>
          </div>
        </aside>

        {/* Main Content Area */}
        <main className="flex-1 min-w-0 flex flex-col">
          <header className="mb-6 pb-6 border-b border-slate-900/10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="font-serif text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
                {title}
              </h1>
              {subtitle && (
                <p className="text-sm font-sans text-slate-600 mt-1">
                  {subtitle}
                </p>
              )}
            </div>
            {action && <div className="shrink-0">{action}</div>}
          </header>

          <div className="flex-1">{children}</div>
        </main>
      </div>
    </div>
  );
};
