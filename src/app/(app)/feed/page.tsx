"use client";

import { useState, useEffect, useCallback } from "react";
import { Plus, Search, SlidersHorizontal, RefreshCw } from "lucide-react";
import PostCard from "@/components/posts/PostCard";
import CreatePost from "@/components/posts/CreatePost";
import { useApp } from "@/components/layout/AppShell";

interface Category {
  id: string;
  name: string;
  color: string;
}

interface Post {
  id: string;
  title: string;
  content: string;
  author: { id: string; name: string; email: string; role: string };
  status: string;
  pinned: boolean;
  publishedAt: string | null;
  createdAt: string;
  viewCount: number;
  categories: { category: { id: string; name: string; color: string } }[];
  segments: { type: string; value: string }[];
  _count: { comments: number };
}

export default function FeedPage() {
  const { user } = useApp();
  const [posts, setPosts] = useState<Post[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  const isAdmin = user?.role === "ADMIN" || user?.role === "SUPER_ADMIN";

  const fetchPosts = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: "20",
      });
      if (search) params.set("search", search);
      if (selectedCategory) params.set("category", selectedCategory);

      const res = await fetch(`/api/posts?${params}`);
      const data = await res.json();
      if (data.posts) {
        setPosts(data.posts);
        setTotalPages(data.pages);
        setTotal(data.total);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [page, search, selectedCategory]);

  useEffect(() => {
    fetch("/api/categories")
      .then((r) => r.json())
      .then(setCategories)
      .catch(() => {});
  }, []);

  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  // Debounce search
  useEffect(() => {
    setPage(1);
  }, [search, selectedCategory]);

  function handleDeletePost(id: string) {
    setPosts((prev) => prev.filter((p) => p.id !== id));
    setTotal((prev) => prev - 1);
  }

  function handlePinPost(id: string, pinned: boolean) {
    setPosts((prev) =>
      prev
        .map((p) => (p.id === id ? { ...p, pinned, pinnedAt: pinned ? new Date().toISOString() : null } : p))
        .sort((a, b) => {
          if (a.pinned && !b.pinned) return -1;
          if (!a.pinned && b.pinned) return 1;
          return 0;
        })
    );
  }

  function handleStatusChange(id: string, status: string) {
    if (status !== "PENDING_APPROVAL") {
      // Remove from current view if it changed status and we're filtering
      setPosts((prev) => prev.map((p) => (p.id === id ? { ...p, status } : p)));
    }
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Company Feed</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {total} post{total !== 1 ? "s" : ""}
          </p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 transition shadow-sm"
        >
          <Plus className="w-4 h-4" />
          New Post
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search posts…"
            className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-gray-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-sm"
          />
        </div>
        <div className="relative">
          <SlidersHorizontal className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="pl-9 pr-8 py-2.5 rounded-xl border border-gray-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm appearance-none cursor-pointer"
          >
            <option value="">All Categories</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.name}
              </option>
            ))}
          </select>
        </div>
        <button
          onClick={fetchPosts}
          className="flex items-center gap-1.5 px-3 py-2.5 rounded-xl border border-gray-200 bg-white text-sm text-gray-600 hover:bg-gray-50 shadow-sm transition"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* Category chips */}
      {categories.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-6">
          <button
            onClick={() => setSelectedCategory("")}
            className={`px-3 py-1 rounded-full text-sm font-medium transition ${
              !selectedCategory
                ? "bg-gray-900 text-white"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            All
          </button>
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() =>
                setSelectedCategory(cat.id === selectedCategory ? "" : cat.id)
              }
              className={`px-3 py-1 rounded-full text-sm font-medium transition ${
                selectedCategory === cat.id
                  ? "text-white"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
              style={
                selectedCategory === cat.id
                  ? { backgroundColor: cat.color }
                  : {}
              }
            >
              {cat.name}
            </button>
          ))}
        </div>
      )}

      {/* Posts */}
      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white rounded-xl border border-gray-200 p-5 animate-pulse">
              <div className="flex gap-3 mb-3">
                <div className="w-9 h-9 bg-gray-200 rounded-full" />
                <div className="flex-1">
                  <div className="h-3 bg-gray-200 rounded w-32 mb-1" />
                  <div className="h-2 bg-gray-100 rounded w-20" />
                </div>
              </div>
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-2" />
              <div className="h-3 bg-gray-100 rounded w-full mb-1" />
              <div className="h-3 bg-gray-100 rounded w-4/5" />
            </div>
          ))}
        </div>
      ) : posts.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <div className="text-5xl mb-3">📭</div>
          <p className="text-lg font-medium text-gray-600">No posts yet</p>
          <p className="text-sm mt-1">
            {search || selectedCategory
              ? "Try adjusting your filters"
              : "Be the first to post something!"}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {posts.map((post) => (
            <PostCard
              key={post.id}
              post={post}
              currentUserId={user?.id || ""}
              isAdmin={isAdmin}
              onDelete={handleDeletePost}
              onPin={handlePinPost}
              onStatusChange={handleStatusChange}
            />
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-8">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="px-4 py-2 text-sm rounded-lg border border-gray-200 disabled:opacity-40 hover:bg-gray-50 transition"
          >
            ← Previous
          </button>
          <span className="text-sm text-gray-600">
            Page {page} of {totalPages}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="px-4 py-2 text-sm rounded-lg border border-gray-200 disabled:opacity-40 hover:bg-gray-50 transition"
          >
            Next →
          </button>
        </div>
      )}

      {/* Create Post Modal */}
      {showCreate && (
        <CreatePost
          isAdmin={isAdmin}
          onCreated={fetchPosts}
          onClose={() => setShowCreate(false)}
        />
      )}
    </div>
  );
}
