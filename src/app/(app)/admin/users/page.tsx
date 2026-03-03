"use client";

import { useEffect, useState, useCallback, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import {
  Search, CheckCircle, XCircle, Shield, UserX, Filter, UserCircle
} from "lucide-react";
import toast from "react-hot-toast";
import { formatDate } from "@/lib/utils";

interface User {
  id: string;
  email: string;
  name: string;
  role: string;
  status: string;
  seniority: string | null;
  country: string | null;
  region: string | null;
  department: string | null;
  language: string;
  createdAt: string;
  _count: { posts: number; comments: number };
}

const STATUS_BADGES: Record<string, string> = {
  ACTIVE: "bg-green-100 text-green-700",
  PENDING: "bg-amber-100 text-amber-700",
  SUSPENDED: "bg-red-100 text-red-700",
};

const ROLE_BADGES: Record<string, string> = {
  SUPER_ADMIN: "bg-purple-100 text-purple-700",
  ADMIN: "bg-blue-100 text-blue-700",
  USER: "bg-gray-100 text-gray-600",
};

function UsersContent() {
  const searchParams = useSearchParams();
  const defaultStatus = searchParams.get("status") || "";
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState(defaultStatus);
  const [total, setTotal] = useState(0);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      if (statusFilter) params.set("status", statusFilter);
      const res = await fetch(`/api/users?${params}`);
      const data = await res.json();
      setUsers(data.users || []);
      setTotal(data.total || 0);
    } catch {
      toast.error("Failed to load users");
    } finally {
      setLoading(false);
    }
  }, [search, statusFilter]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  async function updateUser(id: string, data: { status?: string; role?: string }) {
    setActionLoading(id);
    try {
      const res = await fetch(`/api/users/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (res.ok) {
        const updated = await res.json();
        setUsers((prev) => prev.map((u) => (u.id === id ? { ...u, ...updated } : u)));
        toast.success("User updated");
      } else {
        const err = await res.json();
        toast.error(err.error || "Failed to update user");
      }
    } catch {
      toast.error("Network error");
    } finally {
      setActionLoading(null);
    }
  }

  async function deleteUser(id: string, name: string) {
    if (!confirm(`Delete user "${name}"? This cannot be undone.`)) return;
    setActionLoading(id);
    try {
      const res = await fetch(`/api/users/${id}`, { method: "DELETE" });
      if (res.ok) {
        setUsers((prev) => prev.filter((u) => u.id !== id));
        setTotal((t) => t - 1);
        toast.success("User deleted");
      } else {
        const err = await res.json();
        toast.error(err.error || "Failed to delete user");
      }
    } catch {
      toast.error("Network error");
    } finally {
      setActionLoading(null);
    }
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">User Management</h1>
        <p className="text-gray-500 mt-0.5">{total} total users</p>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search users…"
            className="w-full pl-9 pr-4 py-2 rounded-lg border border-gray-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div className="relative">
          <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="pl-9 pr-8 py-2 rounded-lg border border-gray-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none cursor-pointer"
          >
            <option value="">All Statuses</option>
            <option value="ACTIVE">Active</option>
            <option value="PENDING">Pending</option>
            <option value="SUSPENDED">Suspended</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
        {loading ? (
          <div className="divide-y divide-gray-100">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="flex items-center gap-4 px-6 py-4 animate-pulse">
                <div className="w-10 h-10 bg-gray-200 rounded-full" />
                <div className="flex-1">
                  <div className="h-3 bg-gray-200 rounded w-32 mb-1" />
                  <div className="h-2 bg-gray-100 rounded w-48" />
                </div>
                <div className="h-6 bg-gray-100 rounded w-16" />
              </div>
            ))}
          </div>
        ) : users.length === 0 ? (
          <div className="text-center py-12 text-gray-400">
            <UserCircle className="w-10 h-10 mx-auto mb-2 text-gray-300" />
            <p>No users found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50">
                  <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">User</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Role</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Status</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Department</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Activity</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Joined</th>
                  <th className="text-right px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {users.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50 transition">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 bg-gradient-to-br from-blue-500 to-blue-700 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                          {user.name.slice(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900">{user.name}</p>
                          <p className="text-xs text-gray-500">{user.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${ROLE_BADGES[user.role] || "bg-gray-100 text-gray-600"}`}>
                        {user.role === "SUPER_ADMIN" ? "Super Admin" : user.role === "ADMIN" ? "Admin" : "User"}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_BADGES[user.status] || ""}`}>
                        {user.status}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      <span className="text-sm text-gray-600">{user.department || "—"}</span>
                      {user.seniority && (
                        <span className="block text-xs text-gray-400 capitalize">{user.seniority}</span>
                      )}
                    </td>
                    <td className="px-4 py-4">
                      <span className="text-sm text-gray-600">{user._count.posts} posts</span>
                      <span className="text-xs text-gray-400 block">{user._count.comments} comments</span>
                    </td>
                    <td className="px-4 py-4">
                      <span className="text-sm text-gray-500">{formatDate(user.createdAt)}</span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-1.5">
                        {user.status === "PENDING" && (
                          <button
                            onClick={() => updateUser(user.id, { status: "ACTIVE" })}
                            disabled={actionLoading === user.id}
                            className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-green-700 bg-green-50 hover:bg-green-100 rounded-lg transition disabled:opacity-50"
                          >
                            <CheckCircle className="w-3.5 h-3.5" />
                            Approve
                          </button>
                        )}
                        {user.status === "ACTIVE" && user.role !== "SUPER_ADMIN" && (
                          <button
                            onClick={() => updateUser(user.id, { status: "SUSPENDED" })}
                            disabled={actionLoading === user.id}
                            className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-amber-700 bg-amber-50 hover:bg-amber-100 rounded-lg transition disabled:opacity-50"
                          >
                            <XCircle className="w-3.5 h-3.5" />
                            Suspend
                          </button>
                        )}
                        {user.status === "SUSPENDED" && (
                          <button
                            onClick={() => updateUser(user.id, { status: "ACTIVE" })}
                            disabled={actionLoading === user.id}
                            className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-green-700 bg-green-50 hover:bg-green-100 rounded-lg transition disabled:opacity-50"
                          >
                            <CheckCircle className="w-3.5 h-3.5" />
                            Reactivate
                          </button>
                        )}
                        {user.role === "USER" && (
                          <button
                            onClick={() => updateUser(user.id, { role: "ADMIN" })}
                            disabled={actionLoading === user.id}
                            className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-lg transition disabled:opacity-50"
                          >
                            <Shield className="w-3.5 h-3.5" />
                            Make Admin
                          </button>
                        )}
                        {user.role === "ADMIN" && (
                          <button
                            onClick={() => updateUser(user.id, { role: "USER" })}
                            disabled={actionLoading === user.id}
                            className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition disabled:opacity-50"
                          >
                            <Shield className="w-3.5 h-3.5" />
                            Revoke Admin
                          </button>
                        )}
                        {user.role !== "SUPER_ADMIN" && (
                          <button
                            onClick={() => deleteUser(user.id, user.name)}
                            disabled={actionLoading === user.id}
                            className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-red-700 bg-red-50 hover:bg-red-100 rounded-lg transition disabled:opacity-50"
                          >
                            <UserX className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}


export default function UsersPage() {
  return (
    <Suspense fallback={<div className="p-6 text-gray-500">Loading…</div>}>
      <UsersContent />
    </Suspense>
  );
}
