"use client";

import { useState, useEffect } from "react";
import { X, Plus, Target, Users, Globe2, Building2, TrendingUp } from "lucide-react";
import toast from "react-hot-toast";
import {
  SENIORITY_OPTIONS, DEPARTMENT_OPTIONS, COUNTRY_OPTIONS, REGION_OPTIONS,
} from "@/lib/utils";

interface Category {
  id: string;
  name: string;
  color: string;
}

interface Segment {
  type: string;
  value: string;
  label: string;
}

interface CreatePostProps {
  isAdmin: boolean;
  onCreated: () => void;
  onClose: () => void;
}

const SEGMENT_TYPES = [
  { type: "ALL", label: "Everyone", icon: Users, options: [{ value: "all", label: "All employees" }] },
  { type: "SENIORITY", label: "Seniority", icon: TrendingUp, options: SENIORITY_OPTIONS },
  { type: "DEPARTMENT", label: "Department", icon: Building2, options: DEPARTMENT_OPTIONS.map((d) => ({ value: d, label: d })) },
  { type: "COUNTRY", label: "Country", icon: Globe2, options: COUNTRY_OPTIONS.map((c) => ({ value: c, label: c })) },
  { type: "REGION", label: "Region", icon: Target, options: REGION_OPTIONS.map((r) => ({ value: r, label: r })) },
];

export default function CreatePost({ isAdmin, onCreated, onClose }: CreatePostProps) {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [segments, setSegments] = useState<Segment[]>([{ type: "ALL", value: "all", label: "Everyone" }]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [activeSegmentType, setActiveSegmentType] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/categories")
      .then((r) => r.json())
      .then(setCategories)
      .catch(() => {});
  }, []);

  function toggleCategory(id: string) {
    setSelectedCategories((prev) =>
      prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id]
    );
  }

  function addSegment(type: string, value: string, label: string) {
    // If adding ALL, clear others
    if (type === "ALL") {
      setSegments([{ type: "ALL", value: "all", label: "Everyone" }]);
      setActiveSegmentType(null);
      return;
    }
    // Remove ALL if adding specific segment
    setSegments((prev) => {
      const withoutAll = prev.filter((s) => s.type !== "ALL");
      const exists = withoutAll.find((s) => s.type === type && s.value === value);
      if (exists) return withoutAll;
      return [...withoutAll, { type, value, label }];
    });
    setActiveSegmentType(null);
  }

  function removeSegment(type: string, value: string) {
    setSegments((prev) => {
      const filtered = prev.filter((s) => !(s.type === type && s.value === value));
      if (filtered.length === 0) return [{ type: "ALL", value: "all", label: "Everyone" }];
      return filtered;
    });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim() || !content.trim()) {
      toast.error("Title and content are required");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch("/api/posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          content: content.trim(),
          categoryIds: selectedCategories,
          segments: segments.map((s) => ({ type: s.type, value: s.value })),
        }),
      });
      const data = await res.json();
      if (res.ok) {
        toast.success(isAdmin ? "Post published!" : "Post submitted for approval");
        onCreated();
        onClose();
      } else {
        toast.error(data.error || "Failed to create post");
      }
    } catch {
      toast.error("Network error");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-start justify-center p-4 pt-16 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl border border-gray-200">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Create Post</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-1 rounded-lg hover:bg-gray-100">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Title *</label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Post title"
              required
              className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Content */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Content * <span className="font-normal text-gray-400">(supports **bold**, *italic*, - bullet lists)</span>
            </label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Write your post content here…"
              required
              rows={8}
              className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-y"
            />
          </div>

          {/* Categories */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Categories</label>
            <div className="flex flex-wrap gap-2">
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => toggleCategory(cat.id)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition ${
                    selectedCategories.includes(cat.id)
                      ? "text-white shadow-sm"
                      : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  }`}
                  style={
                    selectedCategories.includes(cat.id)
                      ? { backgroundColor: cat.color }
                      : {}
                  }
                >
                  {cat.name}
                </button>
              ))}
            </div>
          </div>

          {/* Audience Segments */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Audience Targeting
            </label>
            {/* Selected segments */}
            <div className="flex flex-wrap gap-2 mb-3">
              {segments.map((seg) => (
                <span
                  key={`${seg.type}-${seg.value}`}
                  className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-800 text-sm rounded-full"
                >
                  {seg.label}
                  {!(seg.type === "ALL") && (
                    <button
                      type="button"
                      onClick={() => removeSegment(seg.type, seg.value)}
                      className="hover:text-blue-900 ml-0.5"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  )}
                </span>
              ))}
            </div>

            {/* Add segment */}
            <div className="space-y-2">
              {activeSegmentType ? (
                <div className="border border-gray-200 rounded-lg p-3">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-700">
                      Select {SEGMENT_TYPES.find(s => s.type === activeSegmentType)?.label}
                    </span>
                    <button type="button" onClick={() => setActiveSegmentType(null)} className="text-gray-400 hover:text-gray-600">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {SEGMENT_TYPES.find(s => s.type === activeSegmentType)?.options.map((opt) => (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => addSegment(activeSegmentType, opt.value, opt.label)}
                        className="px-3 py-1 text-sm bg-gray-100 hover:bg-blue-50 hover:text-blue-700 rounded-full transition"
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {SEGMENT_TYPES.map((st) => (
                    <button
                      key={st.type}
                      type="button"
                      onClick={() => st.type === "ALL" ? addSegment("ALL", "all", "Everyone") : setActiveSegmentType(st.type)}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg transition"
                    >
                      <st.icon className="w-3.5 h-3.5" />
                      + {st.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {!isAdmin && (
            <div className="bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 text-sm text-amber-800">
              ℹ️ Your post will be submitted for admin review before publishing.
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2.5 rounded-lg border border-gray-300 text-gray-700 font-medium hover:bg-gray-50 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 px-4 py-2.5 rounded-lg bg-blue-600 text-white font-medium hover:bg-blue-700 disabled:bg-blue-400 transition"
            >
              {submitting ? "Publishing…" : isAdmin ? "Publish" : "Submit for Review"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
