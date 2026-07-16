import React, { useState, useEffect } from "react";
import axios from "axios";
import { motion, AnimatePresence } from "framer-motion";
import { AdminLayout } from "@/components/AdminLayout";
import { useAuth } from "@/context/AuthContext";
import {
  PlusCircle,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Layers,
  BookOpen,
  Edit3,
  GripVertical,
  ArrowUp,
  ArrowDown,
  Plus,
  Save,
  X,
  ListOrdered,
  Sparkles,
} from "lucide-react";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

interface ModuleItem {
  id: string;
  title: string;
  description: string;
  sequential_order: number;
  created_at?: string;
}

interface ProblemItem {
  id: string;
  title: string;
  description: string;
  difficulty?: string;
  difficulty_score: number;
  module_id?: string | null;
  sequential_order?: number;
}

export default function AdminModulesPage() {
  const { authReady } = useAuth();
  const [modules, setModules] = useState<ModuleItem[]>([]);
  const [problems, setProblems] = useState<ProblemItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Form State for New Module
  const [title, setTitle] = useState<string>("");
  const [description, setDescription] = useState<string>("");
  const [sequentialOrder, setSequentialOrder] = useState<number>(1);
  const [creating, setCreating] = useState<boolean>(false);

  // Interactive Editor State for Selected Module
  const [selectedModule, setSelectedModule] = useState<ModuleItem | null>(null);
  const [editTitle, setEditTitle] = useState<string>("");
  const [editDescription, setEditDescription] = useState<string>("");
  const [editOrder, setEditOrder] = useState<number>(1);
  const [moduleProblems, setModuleProblems] = useState<ProblemItem[]>([]);
  const [updatingModule, setUpdatingModule] = useState<boolean>(false);
  const [draggedIdx, setDraggedIdx] = useState<number | null>(null);
  const [selectedProblemToAdd, setSelectedProblemToAdd] = useState<string>("");

  const fetchData = async (retainSelectedId?: string) => {
    setLoading(true);
    try {
      const token = typeof window !== "undefined" ? localStorage.getItem("jwt_token") : null;
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      const [modRes, probRes] = await Promise.all([
        axios.get(`${API_URL}/admin/modules`, { headers }),
        axios.get(`${API_URL}/problems`),
      ]);
      const modL = modRes.data?.modules || [];
      const probL = probRes.data?.problems || probRes.data || [];
      setModules(modL);
      setProblems(probL);
      setSequentialOrder(modL.length + 1);

      const targetId = retainSelectedId || selectedModule?.id;
      if (targetId) {
        const updatedSel = modL.find((m: any) => m.id === targetId);
        if (updatedSel) {
          setSelectedModule(updatedSel);
          setEditTitle(updatedSel.title);
          setEditDescription(updatedSel.description || "");
          setEditOrder(updatedSel.sequential_order);
          const assigned = probL
            .filter((p: any) => p.module_id === updatedSel.id)
            .sort((a: any, b: any) => (a.sequential_order || 999) - (b.sequential_order || 999));
          setModuleProblems(assigned);
        } else {
          setSelectedModule(null);
        }
      }
    } catch (err: any) {
      setError(err.response?.data?.error || "Failed to load modules from API.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (authReady) {
      fetchData();
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
      await fetchData();
    } catch (err: any) {
      setError(err.response?.data?.error || "Failed to create module.");
    } finally {
      setCreating(false);
    }
  };

  const handleSelectModule = (m: ModuleItem) => {
    setSelectedModule(m);
    setEditTitle(m.title);
    setEditDescription(m.description || "");
    setEditOrder(m.sequential_order);
    const assigned = problems
      .filter((p: any) => p.module_id === m.id)
      .sort((a: any, b: any) => (a.sequential_order || 999) - (b.sequential_order || 999));
    setModuleProblems(assigned);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleUpdateModuleDetails = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedModule) return;
    setUpdatingModule(true);
    setError(null);
    setSuccessMsg(null);

    try {
      const token = typeof window !== "undefined" ? localStorage.getItem("jwt_token") : null;
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      await axios.put(
        `${API_URL}/admin/modules/${selectedModule.id}`,
        {
          title: editTitle,
          description: editDescription,
          sequential_order: Number(editOrder),
        },
        { headers }
      );
      setSuccessMsg(`Module "${editTitle}" updated successfully!`);
      await fetchData(selectedModule.id);
    } catch (err: any) {
      setError(err.response?.data?.error || "Failed to update module.");
    } finally {
      setUpdatingModule(false);
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
      if (selectedModule?.id === id) {
        setSelectedModule(null);
      }
      await fetchData();
    } catch (err: any) {
      setError(err.response?.data?.error || "Failed to delete module.");
    }
  };

  const syncReorderedProblems = async (newList: ProblemItem[]) => {
    if (!selectedModule) return;
    setModuleProblems(newList);
    try {
      const token = typeof window !== "undefined" ? localStorage.getItem("jwt_token") : null;
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      const problemIDs = newList.map((p) => p.id);
      await axios.put(
        `${API_URL}/admin/modules/${selectedModule.id}/reorder`,
        { problem_ids: problemIDs },
        { headers }
      );
      setSuccessMsg("Problem progression order saved!");
    } catch (err: any) {
      setError(err.response?.data?.error || "Failed to save reordered problem progression.");
    }
  };

  const moveProblemUp = (index: number) => {
    if (index <= 0) return;
    const newList = [...moduleProblems];
    const temp = newList[index - 1];
    newList[index - 1] = newList[index];
    newList[index] = temp;
    syncReorderedProblems(newList);
  };

  const moveProblemDown = (index: number) => {
    if (index >= moduleProblems.length - 1) return;
    const newList = [...moduleProblems];
    const temp = newList[index + 1];
    newList[index + 1] = newList[index];
    newList[index] = temp;
    syncReorderedProblems(newList);
  };

  const handleDragStart = (index: number) => {
    setDraggedIdx(index);
  };

  const handleDragOver = (e: React.DragEvent, targetIdx: number) => {
    e.preventDefault();
    if (draggedIdx === null || draggedIdx === targetIdx) return;
    const newList = [...moduleProblems];
    const [draggedItem] = newList.splice(draggedIdx, 1);
    newList.splice(targetIdx, 0, draggedItem);
    setDraggedIdx(targetIdx);
    setModuleProblems(newList);
  };

  const handleDragEnd = () => {
    if (draggedIdx !== null) {
      syncReorderedProblems(moduleProblems);
      setDraggedIdx(null);
    }
  };

  const handleAddProblemToModule = async () => {
    if (!selectedProblemToAdd || !selectedModule) return;
    setError(null);
    setSuccessMsg(null);
    try {
      const prob = problems.find((p) => p.id === selectedProblemToAdd);
      if (!prob) return;
      const token = typeof window !== "undefined" ? localStorage.getItem("jwt_token") : null;
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      const nextOrder = moduleProblems.length + 1;
      await axios.put(
        `${API_URL}/admin/problems/${prob.id}`,
        {
          title: prob.title,
          description: prob.description,
          difficulty: prob.difficulty || "medium",
          time_limit_ms: 2000,
          memory_limit_kb: 128000,
          tags: ["zpd-curriculum"],
          stdin: "",
          expected_output: "",
          test_cases: [],
          module_id: selectedModule.id,
          sequential_order: nextOrder,
        },
        { headers }
      );
      setSuccessMsg(`Added "${prob.title}" to module #${selectedModule.sequential_order}!`);
      setSelectedProblemToAdd("");
      await fetchData(selectedModule.id);
    } catch (err: any) {
      setError(err.response?.data?.error || "Failed to add problem to module.");
    }
  };

  const handleRemoveProblemFromModule = async (prob: ProblemItem) => {
    if (!selectedModule) return;
    if (!confirm(`Remove problem "${prob.title}" from this curriculum module?`)) return;
    setError(null);
    setSuccessMsg(null);
    try {
      const token = typeof window !== "undefined" ? localStorage.getItem("jwt_token") : null;
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      await axios.put(
        `${API_URL}/admin/problems/${prob.id}`,
        {
          title: prob.title,
          description: prob.description,
          difficulty: prob.difficulty || "medium",
          time_limit_ms: 2000,
          memory_limit_kb: 128000,
          tags: ["zpd-curriculum"],
          stdin: "",
          expected_output: "",
          test_cases: [],
          module_id: null,
          sequential_order: 1,
        },
        { headers }
      );
      setSuccessMsg(`Removed "${prob.title}" from module.`);
      await fetchData(selectedModule.id);
    } catch (err: any) {
      setError(err.response?.data?.error || "Failed to remove problem from module.");
    }
  };

  const unassignedProblems = problems.filter((p) => p.module_id !== selectedModule?.id);

  return (
    <AdminLayout
      title="Curriculum Modules & Progression Studio"
      subtitle="Organize problems into ordered curriculum units with drag-and-drop ordering. Problems in Module N unlock when Module N-1 is complete."
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

        {/* Selected Module Interactive Editor Panel */}
        <AnimatePresence>
          {selectedModule && (
            <motion.div
              initial={{ opacity: 0, y: -15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className="bg-ivory-100 border-2 border-slate-900 rounded-2xl p-6 shadow-md space-y-6"
            >
              <div className="flex items-center justify-between border-b border-slate-900/10 pb-4">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-xl bg-amber-500 text-slate-900 flex items-center justify-center font-mono text-sm font-black shadow-inner">
                    #{selectedModule.sequential_order}
                  </div>
                  <div>
                    <h3 className="font-serif text-xl font-bold text-slate-900 flex items-center space-x-2">
                      <Edit3 className="w-5 h-5 text-amber-700" />
                      <span>Editing Curriculum Module: {selectedModule.title}</span>
                    </h3>
                    <p className="text-xs text-slate-500 font-mono mt-0.5">ID: {selectedModule.id}</p>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedModule(null)}
                  className="p-2 text-slate-400 hover:text-slate-900 rounded-lg hover:bg-slate-900/5 transition-colors"
                  title="Close Editor"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Module Metadata Form */}
              <form onSubmit={handleUpdateModuleDetails} className="grid grid-cols-1 md:grid-cols-12 gap-4 bg-ivory-200/50 p-4 rounded-xl border border-slate-900/10">
                <div className="md:col-span-5">
                  <label className="block text-xs font-mono uppercase tracking-wider text-slate-600 mb-1">
                    Module Title *
                  </label>
                  <input
                    type="text"
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    required
                    className="w-full px-3.5 py-2 rounded-lg border border-slate-900/15 bg-ivory-100 text-xs text-slate-900 focus:outline-none focus:border-slate-900 font-serif font-bold"
                  />
                </div>
                <div className="md:col-span-5">
                  <label className="block text-xs font-mono uppercase tracking-wider text-slate-600 mb-1">
                    Description / Learning Objective
                  </label>
                  <input
                    type="text"
                    value={editDescription}
                    onChange={(e) => setEditDescription(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-lg border border-slate-900/15 bg-ivory-100 text-xs text-slate-900 focus:outline-none focus:border-slate-900"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-xs font-mono uppercase tracking-wider text-slate-600 mb-1">
                    Curriculum Order *
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={editOrder}
                    onChange={(e) => setEditOrder(Number(e.target.value))}
                    required
                    className="w-full px-3.5 py-2 rounded-lg border border-slate-900/15 bg-ivory-100 text-xs text-slate-900 focus:outline-none focus:border-slate-900 font-mono font-bold"
                  />
                </div>
                <div className="md:col-span-12 flex justify-end">
                  <button
                    type="submit"
                    disabled={updatingModule}
                    className="inline-flex items-center space-x-2 bg-amber-500 hover:bg-amber-600 text-slate-900 px-5 py-2 rounded-lg text-xs font-bold tracking-tight transition-all shadow-sm disabled:opacity-50"
                  >
                    <Save className="w-4 h-4" />
                    <span>{updatingModule ? "Saving..." : "Save Module Details"}</span>
                  </button>
                </div>
              </form>

              {/* Drag-and-Drop Problem Progression Studio */}
              <div className="space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-t border-slate-900/10 pt-4">
                  <div>
                    <h4 className="font-serif font-bold text-base text-slate-900 flex items-center space-x-2">
                      <ListOrdered className="w-4 h-4 text-slate-700" />
                      <span>Problem Progression Sequence ({moduleProblems.length})</span>
                    </h4>
                    <p className="text-xs text-slate-600 font-sans mt-0.5">
                      Drag and drop cards or click arrows to reorder. Students will encounter these in exactly this progression.
                    </p>
                  </div>

                  {/* Add Existing Problem Dropdown */}
                  <div className="flex items-center space-x-2 shrink-0">
                    <select
                      value={selectedProblemToAdd}
                      onChange={(e) => setSelectedProblemToAdd(e.target.value)}
                      className="text-xs bg-ivory-100 border border-slate-900/20 rounded-lg px-3 py-1.5 font-mono text-slate-800 focus:outline-none max-w-[220px]"
                    >
                      <option value="">+ Assign Existing Problem...</option>
                      {unassignedProblems.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.title} ({p.difficulty || "medium"})
                        </option>
                      ))}
                    </select>
                    <button
                      type="button"
                      onClick={handleAddProblemToModule}
                      disabled={!selectedProblemToAdd}
                      className="bg-slate-900 text-ivory-100 hover:bg-slate-800 px-3.5 py-1.5 rounded-lg text-xs font-semibold disabled:opacity-40 transition-all flex items-center space-x-1"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Add</span>
                    </button>
                  </div>
                </div>

                {moduleProblems.length === 0 ? (
                  <div className="p-8 border-2 border-dashed border-slate-900/15 rounded-xl text-center space-y-2 bg-ivory-200/30">
                    <Sparkles className="w-7 h-7 text-amber-500 mx-auto" />
                    <p className="text-xs font-mono text-slate-600 font-semibold">
                      No problems assigned to this module yet.
                    </p>
                    <p className="text-[11px] text-slate-400">
                      Select a problem from the dropdown above or assign one during problem creation.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2.5">
                    {moduleProblems.map((prob, index) => (
                      <div
                        key={prob.id}
                        draggable={true}
                        onDragStart={() => handleDragStart(index)}
                        onDragOver={(e) => handleDragOver(e, index)}
                        onDragEnd={handleDragEnd}
                        className={`p-4 rounded-xl border border-slate-900/15 bg-ivory-100 flex items-center justify-between gap-4 transition-all shadow-sm cursor-grab active:cursor-grabbing hover:border-slate-900/40 ${
                          draggedIdx === index ? "opacity-50 ring-2 ring-amber-500 bg-amber-50/40" : ""
                        }`}
                      >
                        <div className="flex items-center space-x-3.5 min-w-0">
                          <div className="text-slate-400 hover:text-slate-700 cursor-grab px-1 shrink-0">
                            <GripVertical className="w-5 h-5" />
                          </div>
                          <div className="w-7 h-7 rounded-lg bg-slate-900 text-amber-400 font-mono text-xs font-bold flex items-center justify-center shrink-0 shadow-inner">
                            {index + 1}
                          </div>
                          <div className="min-w-0">
                            <h5 className="font-serif font-bold text-sm text-slate-900 truncate">
                              {prob.title}
                            </h5>
                            <div className="flex items-center space-x-2 mt-0.5">
                              <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-slate-900/5 text-slate-700 font-semibold">
                                {prob.difficulty || "medium"}
                              </span>
                              <span className="text-[10px] font-mono text-slate-400 truncate">
                                ID: {prob.id}
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center space-x-1.5 shrink-0">
                          <button
                            type="button"
                            onClick={() => moveProblemUp(index)}
                            disabled={index === 0}
                            className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-900/5 rounded-lg disabled:opacity-25 transition-all"
                            title="Move Up"
                          >
                            <ArrowUp className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => moveProblemDown(index)}
                            disabled={index === moduleProblems.length - 1}
                            className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-900/5 rounded-lg disabled:opacity-25 transition-all"
                            title="Move Down"
                          >
                            <ArrowDown className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleRemoveProblemFromModule(prob)}
                            className="p-1.5 text-slate-400 hover:text-terracotta hover:bg-terracotta/10 rounded-lg transition-all ml-2"
                            title="Remove from Module"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

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
                className="w-full px-3.5 py-2 rounded-lg border border-slate-900/15 bg-ivory-200/50 text-xs text-slate-900 focus:outline-none focus:border-slate-900 font-serif font-semibold"
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
                className="w-full px-3.5 py-2 rounded-lg border border-slate-900/15 bg-ivory-200/50 text-xs text-slate-900 focus:outline-none focus:border-slate-900 font-mono font-bold"
              />
            </div>

            <div className="md:col-span-12 flex justify-end mt-2">
              <button
                type="submit"
                disabled={creating}
                className="inline-flex items-center space-x-2 bg-slate-900 hover:bg-slate-800 text-ivory-100 px-5 py-2 rounded-lg text-xs font-semibold tracking-tight transition-all disabled:opacity-50 shadow-sm"
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
            <span className="text-xs font-mono text-slate-500">
              Click any module card below to open its Drag & Drop Studio editor
            </span>
          </div>

          {loading ? (
            <div className="p-8 text-center text-xs font-mono text-slate-500">
              Loading Modules & Problem Progressions...
            </div>
          ) : modules.length === 0 ? (
            <div className="p-8 text-center space-y-2">
              <BookOpen className="w-8 h-8 text-slate-300 mx-auto" />
              <p className="text-xs font-mono text-slate-500">No modules created yet. Use the form above to add your first curriculum unit.</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-900/10">
              {modules.map((m) => {
                const assignedCount = problems.filter((p) => p.module_id === m.id).length;
                const isSelected = selectedModule?.id === m.id;
                return (
                  <div
                    key={m.id}
                    onClick={() => handleSelectModule(m)}
                    className={`p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all cursor-pointer select-none ${
                      isSelected
                        ? "bg-amber-50/60 border-l-4 border-amber-500 pl-4"
                        : "hover:bg-ivory-200/50"
                    }`}
                  >
                    <div className="flex items-start space-x-3.5 min-w-0">
                      <div className="w-8 h-8 rounded-lg bg-slate-900 text-ivory-100 flex items-center justify-center font-mono text-xs font-bold shrink-0 shadow-inner">
                        #{m.sequential_order}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center space-x-2.5">
                          <h4 className="font-serif font-bold text-base text-slate-900 truncate">
                            {m.title}
                          </h4>
                          <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded-full bg-slate-900/10 text-slate-800 shrink-0">
                            {assignedCount} {assignedCount === 1 ? "problem" : "problems"}
                          </span>
                        </div>
                        {m.description && (
                          <p className="text-xs text-slate-600 font-sans mt-0.5 truncate">
                            {m.description}
                          </p>
                        )}
                        <span className="text-[10px] font-mono text-slate-400 mt-1 block truncate">
                          ID: {m.id}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center space-x-3 self-end sm:self-center shrink-0" onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={() => handleSelectModule(m)}
                        className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-slate-900 text-ivory-100 hover:bg-slate-800 rounded-lg text-xs font-semibold transition-all shadow-sm"
                        title="Edit & Reorder Problems"
                      >
                        <Edit3 className="w-3.5 h-3.5 text-amber-300" />
                        <span>Edit & Reorder</span>
                      </button>
                      <button
                        onClick={() => handleDeleteModule(m.id, m.title)}
                        className="p-2 text-slate-400 hover:text-terracotta transition-colors rounded-lg hover:bg-terracotta/10"
                        title="Delete Module"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}
