"use client";

import { useEffect, useState, useCallback, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Search, Pin, Trash2, CheckCircle, XCircle, Filter, Eye } from "lucide-react";
import toast from "react-hot-toast";
import { formatDate } from "@/lib/utils";

interface Post {
  id: string;
  title: string;
  status: string;
  pinned: boolean;
  publishedAt: string | null;
  createdAt: string;
  viewCount: number;
  author: { id: string; name: string };
  categories: { category: { id: string; name: string; color: string } }[];
  segments: { type: string; value: string }[];
  _count: { comments: number };
}

const STATUS_BADGES: Record<string, string> = {
  PUBLISHED: "bg-green-100 text-green-700",
  PENDING_APPROVAL: "bg-amber-100 text-amber-700",
  DRAFT: "bg-gray-100 text-gray-600",
  REJECTED: "bg-red-100 text-red-700",
  ARCHIVED: "bg-gray-100 text-gray-500",
};

function AdminPostsContent() {
  const searchParams = useSearchParams();
  const defaultStatus = searchParams.get("status") || "";
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState(defaultStatus);
  const [total, setTotal] = useState(0);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const fetchPosts = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      if (statusFilter) params.set("status", statusFilter);
      params.set("limit", "50");
      const res = await fetch(`/api/posts?${params}`);
      const data = await res.json();
      setPosts(data.posts || []);
      setTotal(data.total || 0);
    } catch {
      toast.error("Failed to load posts");
    } finally {
      setLoading(false);
    }
  }, [search, statusFilter]);

  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  async function updateStatus(id: string, status: string) {
    setActionLoading(id);
    try {
      const res = await fetch(`/api/posts/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (res.ok) {
        setPosts((prev) => prev.map((p) => (p.id === id ? { ...p, status } : p)));
        toast.success(`Post ${status === "PUBLISHED" ? "approved" : "rejected"}`);
      }
    } catch {
      toast.error("Failed to update post");
    } finally {
      setActionLoading(null);
    }
  }

  async function togglePin(id: string, pinned: boolean) {
    setActionLoading(id);
    try {
      const res = await fetch(`/api/posts/${id}/pin`, { method: "POST" });
      const data = await res.json();
      setPosts((prev) => prev.map((p) => (p.id === id ? { ...p, pinned: data.pinned } : p)));
      toast.success(data.pinned ? "Post pinned" : "Post unpinned");
    } catch {
      toast.error("Failed to update pin");
    } finally {
      setActionLoading(null);
    }
  }

  async function deletePost(id: string, title: string) {
    if (!confirm(`Delete post "${title}"?`)) return;
    setActionLoading(id);
    try {
      const res = await fetch(`/api/posts/${id}`, { method: "DELETE" });
      if (res.ok) {
        setPosts((prev) => prev.filter((p) => p.id !== id));
        setTotal((t) => t - 1);
        toast.success("Post deleted");
      }
    } catch {
      toast.error("Failed to delete post");
    } finally {
      setActionLoading(null);
    }
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Post Management</h1>
        <p className="text-gray-500 mt-0.5">{total} total posts</p>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search posts…"
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
            <option value="PUBLISHED">Published</option>
            <option value="PENDING_APPROVAL">Pending Approval</option>
            <option value="DRAFT">Draft</option>
            <option value="REJECTED">Rejected</option>
            <option value="ARCHIVED">Archived</option>
          </select>
        </div>
      </div>

      {/* Posts table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
        {loading ? (
          <div className="divide-y divide-gray-100">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="px-6 py-4 animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-64 mb-2" />
                <div className="h-3 bg-gray-100 rounded w-32" />
              </div>
            ))}
          </div>
        ) : posts.length === 0 ? (
          <div className="text-center py-12 text-gray-400">
            <p>No posts found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50">
                  <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Post</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Status</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Categories</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Audience</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Stats</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Date</th>
                  <th className="text-right px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {posts.map((post) => (
                  <tr key={post.id} className={`hover:bg-gray-50 transition ${post.pinned ? "bg-blue-50/30" : ""}`}>
                    <td className="px-6 py-4 max-w-xs">
                      <div className="flex items-start gap-2">
                        {post.pinned && <Pin className="w-3.5 h-3.5 text-blue-500 flex-shrink-0 mt-0.5" />}
                        <div>
                          <p className="text-sm font-medium text-gray-900 line-clamp-1">{post.title}</p>
                          <p className="text-xs text-gray-500">by {post.author.name}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_BADGES[post.status] || ""}`}>
                        {post.status === "PENDING_APPROVAL" ? "Pending" : post.status}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex flex-wrap gap-1">
                        {post.categories.slice(0, 2).map((pc) => (
                          <span
                            key={pc.category.id}
                            className="px-1.5 py-0.5 rounded text-xs text-white"
                            style={{ backgroundColor: pc.category.color }}
                          >
                            {pc.category.name}
                          </span>
                        ))}
                        {post.categories.length > 2 && (
                          <span className="text-xs text-gray-400">+{post.categories.length - 2}</span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <span className="text-xs text-gray-500">
                        {post.segments.some(s => s.type === "ALL")
                          ? "Everyone"
                          : post.segments.map(s => s.value).slice(0, 2).join(", ")}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      <span className="text-sm text-gray-600 flex items-center gap-1">
                        <Eye className="w-3.5 h-3.5 text-gray-400" />{post.viewCount}
                      </span>
                      <span className="text-xs text-gray-400">{post._count.comments} comments</span>
                    </td>
                    <td className="px-4 py-4">
                      <span className="text-sm text-gray-500">
                        {formatDate(post.publishedAt || post.createdAt)}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-1">
                        {post.status === "PENDING_APPROVAL" && (
                          <>
                            <button
                              onClick={() => updateStatus(post.id, "PUBLISHED")}
                              disabled={actionLoading === post.id}
                              className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-green-700 bg-green-50 hover:bg-green-100 rounded-lg transition disabled:opacity-50"
                            >
                              <CheckCircle className="w-3.5 h-3.5" /> Approve
                            </button>
                            <button
                              onClick={() => updateStatus(post.id, "REJECTED")}
                              disabled={actionLoading === post.id}
                              className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-red-700 bg-red-50 hover:bg-red-100 rounded-lg transition disabled:opacity-50"
                            >
                              <XCircle className="w-3.5 h-3.5" /> Reject
                            </button>
                          </>
                        )}
                        {post.status === "PUBLISHED" && (
                          <button
                            onClick={() => togglePin(post.id, post.pinned)}
                            disabled={actionLoading === post.id}
                            className={`flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium rounded-lg transition disabled:opacity-50 ${
                              post.pinned
                                ? "text-blue-700 bg-blue-100 hover:bg-blue-200"
                                : "text-gray-600 bg-gray-100 hover:bg-gray-200"
                            }`}
                          >
                            <Pin className="w-3.5 h-3.5" />
                            {post.pinned ? "Unpin" : "Pin"}
                          </button>
                        )}
                        <button
                          onClick={() => deletePost(post.id, post.title)}
                          disabled={actionLoading === post.id}
                          className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition disabled:opacity-50"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
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

export default function AdminPostsPage() {
  return (
    <Suspense fallback={<div className="p-6 text-gray-500">Loading…</div>}>
      <AdminPostsContent />
    </Suspense>
  );
}
