import React, { useState, useEffect } from "react";
import axios from "axios";
import { motion, AnimatePresence } from "framer-motion";
import { AdminLayout } from "@/components/AdminLayout";
import { useAuth } from "@/context/AuthContext";
import { PlusCircle, Trash2, CheckCircle2, AlertCircle, Layers, BookOpen, Hash } from "lucide-react";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

interface ModuleItem {
  id: string;
  title: string;
  description: string;
  sequential_order: number;
  created_at?: string;
}

export default function AdminModulesPage() {
  const { authReady } = useAuth();
  const [modules, setModules] = useState<ModuleItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Form State
  const [title, setTitle] = useState<string>("");
  const [description, setDescription] = useState<string>("");
  const [sequentialOrder, setSequentialOrder] = useState<number>(1);
  const [creating, setCreating] = useState<boolean>(false);

  const fetchModules = async () => {
    try {
      const token = typeof window !== "undefined" ? localStorage.getItem("jwt_token") : null;
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      const res = await axios.get(`${API_URL}/admin/modules`, { headers });
      const list = res.data?.modules || [];
      setModules(list);
      setSequentialOrder(list.length + 1);
    } catch (err: any) {
      setError(err.response?.data?.error || "Failed to load modules from API.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (authReady) {
      fetchModules();
    }
  }, [authReady]);

  const handleCreateModule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError("Module title is required.");
      return;
    }

    setCreating(true);
    setError(null);
    setSuccessMsg(null);

    try {
      const token = typeof window !== "undefined" ? localStorage.getItem("jwt_token") : null;
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      await axios.post(
        `${API_URL}/admin/modules`,
        {
          title,
          description,
          sequential_order: Number(sequentialOrder),
        },
        { headers }
      );

      setSuccessMsg(`Module "${title}" created successfully!`);
      setTitle("");
      setDescription("");
      await fetchModules();
    } catch (err: any) {
      setError(err.response?.data?.error || "Failed to create module.");
    } finally {
      setCreating(false);
    }
  };

  const handleDeleteModule = async (id: string, titleStr: string) => {
    if (!confirm(`Are you sure you want to delete module "${titleStr}"? Any linked problems will be un-assigned (not deleted).`)) {
      return;
    }

    setError(null);
    setSuccessMsg(null);

    try {
      const token = typeof window !== "undefined" ? localStorage.getItem("jwt_token") : null;
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      await axios.delete(`${API_URL}/admin/modules/${id}`, { headers });
      setSuccessMsg(`Module "${titleStr}" deleted successfully.`);
      await fetchModules();
    } catch (err: any) {
      setError(err.response?.data?.error || "Failed to delete module.");
    }
  };

  return (
    <AdminLayout
      title="Curriculum Modules (Learning Paths)"
      subtitle="Organize problems into ordered curriculum units. Problems assigned to Module N are locked until problems in N-1 are accepted."
    >
      <div className="space-y-8">
        {error && (
          <div className="p-4 bg-terracotta/10 border border-terracotta/30 text-xs text-terracotta rounded-xl flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {successMsg && (
          <div className="p-4 bg-emerald-900/10 border border-emerald-900/20 text-xs text-emerald-900 rounded-xl flex items-center space-x-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Create Module Form */}
        <div className="bg-ivory-100 border border-slate-900/10 rounded-xl p-6 shadow-sm">
          <h3 className="font-serif text-lg font-bold text-slate-900 mb-4 flex items-center space-x-2">
            <PlusCircle className="w-5 h-5 text-amber-600" />
            <span>Create New Curriculum Module</span>
          </h3>

          <form onSubmit={handleCreateModule} className="grid grid-cols-1 md:grid-cols-12 gap-4">
            <div className="md:col-span-6">
              <label className="block text-xs font-mono uppercase tracking-wider text-slate-600 mb-1">
                Module Title *
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g., Module 1: Array Invariants & Pointers"
                required
                className="w-full px-3.5 py-2 rounded-lg border border-slate-900/15 bg-ivory-200/50 text-xs text-slate-900 focus:outline-none focus:border-slate-900"
              />
            </div>

            <div className="md:col-span-4">
              <label className="block text-xs font-mono uppercase tracking-wider text-slate-600 mb-1">
                Description / Learning Objective
              </label>
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Core logic structure and complexity assessment"
                className="w-full px-3.5 py-2 rounded-lg border border-slate-900/15 bg-ivory-200/50 text-xs text-slate-900 focus:outline-none focus:border-slate-900"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs font-mono uppercase tracking-wider text-slate-600 mb-1">
                Sequential Order *
              </label>
              <input
                type="number"
                min={1}
                value={sequentialOrder}
                onChange={(e) => setSequentialOrder(Number(e.target.value))}
                required
                className="w-full px-3.5 py-2 rounded-lg border border-slate-900/15 bg-ivory-200/50 text-xs text-slate-900 focus:outline-none focus:border-slate-900 font-mono"
              />
            </div>

            <div className="md:col-span-12 flex justify-end mt-2">
              <button
                type="submit"
                disabled={creating}
                className="inline-flex items-center space-x-2 bg-slate-900 hover:bg-slate-800 text-ivory-100 px-5 py-2 rounded-lg text-xs font-semibold tracking-tight transition-all disabled:opacity-50"
              >
                <PlusCircle className="w-4 h-4 text-amber-300" />
                <span>{creating ? "Creating Module..." : "Save Module"}</span>
              </button>
            </div>
          </form>
        </div>

        {/* Modules List */}
        <div className="bg-ivory-100 border border-slate-900/10 rounded-xl overflow-hidden shadow-sm">
          <div className="px-6 py-4 border-b border-slate-900/10 flex items-center justify-between bg-ivory-200/40">
            <h3 className="font-serif text-base font-bold text-slate-900 flex items-center space-x-2">
              <Layers className="w-4 h-4 text-amber-700" />
              <span>Active Curriculum Sequence ({modules.length})</span>
            </h3>
          </div>

          {loading ? (
            <div className="p-8 text-center text-xs font-mono text-slate-500">
              Loading Modules...
            </div>
          ) : modules.length === 0 ? (
            <div className="p-8 text-center space-y-2">
              <BookOpen className="w-8 h-8 text-slate-300 mx-auto" />
              <p className="text-xs font-mono text-slate-500">No modules created yet. Use the form above to add your first curriculum unit.</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-900/10">
              {modules.map((m) => (
                <div key={m.id} className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-ivory-200/30 transition-colors">
                  <div className="flex items-start space-x-3.5">
                    <div className="w-8 h-8 rounded-lg bg-slate-900 text-ivory-100 flex items-center justify-center font-mono text-xs font-bold shrink-0">
                      #{m.sequential_order}
                    </div>
                    <div>
                      <h4 className="font-serif font-bold text-sm text-slate-900">
                        {m.title}
                      </h4>
                      {m.description && (
                        <p className="text-xs text-slate-600 font-sans mt-0.5">
                          {m.description}
                        </p>
                      )}
                      <span className="text-[10px] font-mono text-slate-400 mt-1 block">
                        ID: {m.id}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3 self-end sm:self-center shrink-0">
                    <button
                      onClick={() => handleDeleteModule(m.id, m.title)}
                      className="p-2 text-slate-400 hover:text-terracotta transition-colors rounded-lg hover:bg-terracotta/10"
                      title="Delete Module"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}
