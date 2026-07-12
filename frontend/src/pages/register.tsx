import React, { useState } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import axios from "axios";
import { motion } from "framer-motion";
import { useAuth } from "@/context/AuthContext";
import { ArrowRight, Lock, User, Mail, AlertCircle } from "lucide-react";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

export default function RegisterPage() {
  const router = useRouter();
  const { login } = useAuth();
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const response = await axios.post(`${API_URL}/auth/register`, {
        username,
        email,
        password,
      });
      const { token, user } = response.data;
      if (token && user) {
        login(token, user);
        router.push("/");
      } else {
        setError("Registration succeeded but token missing.");
      }
    } catch (err: any) {
      setError(
        err.response?.data?.error || "Registration failed. Username or email may already exist."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex-1 flex items-center justify-center px-6 py-12">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        className="w-full max-w-md bg-ivory-100 p-8 sm:p-10 rounded-2xl border border-slate-900/10 shadow-sm"
      >
        <div className="mb-8">
          <span className="text-[11px] font-mono uppercase tracking-wider text-amber-800 bg-amber-100/80 px-2.5 py-1 rounded">
            Watanobe Lab Enrollment
          </span>
          <h1 className="text-2xl font-serif font-semibold text-slate-900 mt-4 tracking-tight">
            Create Student Account
          </h1>
          <p className="text-sm text-slate-600 mt-1 font-sans tracking-tight">
            Join the Society 5.0 Smart Learning platform and track your ZPD milestones.
          </p>
        </div>

        {error && (
          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            className="mb-6 p-4 rounded-lg bg-terracotta/10 border border-terracotta/20 flex items-start space-x-3 text-terracotta text-xs leading-relaxed font-sans"
          >
            <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
            <span>{error}</span>
          </motion.div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-xs font-mono uppercase tracking-wider text-slate-700 mb-2">
              Username
            </label>
            <div className="relative">
              <User className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
              <input
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="e.g. yutaka_lab_student"
                className="w-full pl-10 pr-4 py-2.5 rounded-lg bg-ivory-200/50 border border-slate-900/15 text-slate-900 text-sm placeholder-slate-400 focus:outline-none focus:border-slate-900 transition-colors"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-mono uppercase tracking-wider text-slate-700 mb-2">
              Email Address
            </label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="student@u-aizu.ac.jp"
                className="w-full pl-10 pr-4 py-2.5 rounded-lg bg-ivory-200/50 border border-slate-900/15 text-slate-900 text-sm placeholder-slate-400 focus:outline-none focus:border-slate-900 transition-colors"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-mono uppercase tracking-wider text-slate-700 mb-2">
              Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-10 pr-4 py-2.5 rounded-lg bg-ivory-200/50 border border-slate-900/15 text-slate-900 text-sm placeholder-slate-400 focus:outline-none focus:border-slate-900 transition-colors"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 px-4 rounded-lg bg-slate-900 text-ivory-100 font-medium text-sm transition-all duration-300 ease-out hover:bg-slate-800 hover:scale-[1.02] shadow-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
          >
            <span>{loading ? "Registering..." : "Enroll in Platform"}</span>
            {!loading && <ArrowRight className="w-4 h-4" />}
          </button>
        </form>

        <div className="mt-8 pt-6 border-t border-slate-900/10 text-center">
          <p className="text-xs text-slate-600">
            Already have a student account?{" "}
            <Link
              href="/login"
              className="text-slate-900 font-semibold underline underline-offset-4 hover:text-amber-800 transition-colors"
            >
              Sign In
            </Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
}
