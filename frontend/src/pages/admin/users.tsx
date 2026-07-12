import React, { useState, useEffect } from "react";
import axios from "axios";
import { AdminLayout } from "@/components/AdminLayout";
import { Trash2, Shield, User as UserIcon, RefreshCw, AlertCircle } from "lucide-react";
import { useAuth } from "@/context/AuthContext";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

interface UserRecord {
  id: string;
  username: string;
  email: string;
  role: string;
  created_at: string;
}

export default function AdminUsersPage() {
  const { authReady, user: currentUser } = useAuth();
  const [users, setUsers] = useState<UserRecord[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const fetchUsers = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await axios.get(`${API_URL}/admin/users`);
      setUsers(res.data?.users || []);
    } catch (err: any) {
      setError(err.response?.data?.error || "Failed to load users. Please verify admin privileges.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (authReady) {
      fetchUsers();
    }
  }, [authReady]);

  const handleDelete = async (id: string, username: string) => {
    if (id === currentUser?.id) {
      alert("You cannot delete your own admin account while logged in.");
      return;
    }
    if (!window.confirm(`Are you sure you want to delete user '${username}' and all of their submissions? This action cannot be undone.`)) {
      return;
    }

    setDeletingId(id);
    try {
      await axios.delete(`${API_URL}/admin/users/${id}`);
      setUsers((prev) => prev.filter((u) => u.id !== id));
    } catch (err: any) {
      alert(err.response?.data?.error || "Failed to delete user.");
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <AdminLayout
      title="User Management"
      subtitle="Manage registered students, instructors, and admin accounts across the platform."
      action={
        <button
          onClick={fetchUsers}
          disabled={loading}
          className="flex items-center space-x-2 text-xs font-mono text-slate-700 bg-ivory-200 hover:bg-ivory-300 border border-slate-900/10 px-3 py-1.5 rounded transition-colors"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
          <span>Refresh</span>
        </button>
      }
    >
      {error && (
        <div className="mb-6 p-4 bg-amber-50 border border-amber-300 rounded-md flex items-start space-x-3 text-sm text-amber-900">
          <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div>{error}</div>
        </div>
      )}

      <div className="bg-ivory-200/40 border border-slate-900/10 rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-900/10 bg-ivory-300/40 text-[11px] font-mono uppercase tracking-wider text-slate-600">
                <th className="py-3 px-5 font-semibold">User</th>
                <th className="py-3 px-5 font-semibold">Email</th>
                <th className="py-3 px-5 font-semibold">Role</th>
                <th className="py-3 px-5 font-semibold">Joined Date</th>
                <th className="py-3 px-5 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-900/5 text-sm">
              {loading ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-slate-500 font-mono text-xs">
                    Loading user records from database...
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-slate-500 font-mono text-xs">
                    No registered users found.
                  </td>
                </tr>
              ) : (
                users.map((u) => {
                  const isAdmin = u.role === "admin";
                  const isSelf = u.id === currentUser?.id;
                  return (
                    <tr
                      key={u.id}
                      className="hover:bg-ivory-200/60 transition-colors group"
                    >
                      <td className="py-3.5 px-5">
                        <div className="flex items-center space-x-3">
                          <div
                            className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${
                              isAdmin
                                ? "bg-amber-900 text-ivory-100"
                                : "bg-slate-900/10 text-slate-700"
                            }`}
                          >
                            {isAdmin ? <Shield className="w-4 h-4" /> : <UserIcon className="w-4 h-4" />}
                          </div>
                          <div>
                            <span className="font-semibold text-slate-900 block">
                              {u.username}
                              {isSelf && (
                                <span className="ml-2 text-[10px] font-mono bg-amber-200/80 text-amber-950 px-1.5 py-0.5 rounded">
                                  YOU
                                </span>
                              )}
                            </span>
                            <span className="text-[10px] font-mono text-slate-400 block truncate max-w-[140px]">
                              {u.id}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="py-3.5 px-5 text-slate-600 font-sans">
                        {u.email}
                      </td>
                      <td className="py-3.5 px-5">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-mono uppercase font-semibold ${
                            isAdmin
                              ? "bg-amber-900 text-ivory-100 border border-amber-950"
                              : "bg-slate-900/5 text-slate-700 border border-slate-900/10"
                          }`}
                        >
                          {u.role || "student"}
                        </span>
                      </td>
                      <td className="py-3.5 px-5 text-xs font-mono text-slate-500">
                        {new Date(u.created_at).toLocaleDateString("en-US", {
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                        })}
                      </td>
                      <td className="py-3.5 px-5 text-right">
                        <button
                          onClick={() => handleDelete(u.id, u.username)}
                          disabled={deletingId === u.id || isSelf}
                          title={isSelf ? "Cannot delete own account" : "Delete user and all submissions"}
                          className={`inline-flex items-center justify-center p-1.5 rounded transition-colors ${
                            isSelf
                              ? "text-slate-300 cursor-not-allowed"
                              : "text-slate-400 hover:text-red-600 hover:bg-red-50"
                          }`}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </AdminLayout>
  );
}
