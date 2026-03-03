"use client";

import { useState, useEffect } from "react";
import { formatRelative } from "@/lib/utils";
import { Send, Trash2, Globe } from "lucide-react";
import { useApp } from "@/components/layout/AppShell";
import toast from "react-hot-toast";

interface Comment {
  id: string;
  content: string;
  createdAt: string;
  author: { id: string; name: string; email: string };
  translatedContent?: string;
}

interface CommentSectionProps {
  postId: string;
  currentUserId: string;
  isAdmin: boolean;
}

export default function CommentSection({
  postId,
  currentUserId,
  isAdmin,
}: CommentSectionProps) {
  const { language } = useApp();
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [translatedComments, setTranslatedComments] = useState<Record<string, string>>({});

  useEffect(() => {
    fetch(`/api/posts/${postId}/comments`)
      .then((r) => r.json())
      .then(setComments)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [postId]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!newComment.trim()) return;
    setSubmitting(true);
    try {
      const res = await fetch(`/api/posts/${postId}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: newComment.trim() }),
      });
      const data = await res.json();
      if (res.ok) {
        setComments((prev) => [...prev, data]);
        setNewComment("");
      } else {
        toast.error(data.error || "Failed to post comment");
      }
    } catch {
      toast.error("Network error");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(commentId: string) {
    try {
      const res = await fetch(
        `/api/posts/${postId}/comments?commentId=${commentId}`,
        { method: "DELETE" }
      );
      if (res.ok) {
        setComments((prev) => prev.filter((c) => c.id !== commentId));
        toast.success("Comment deleted");
      }
    } catch {
      toast.error("Failed to delete comment");
    }
  }

  async function translateComment(commentId: string, content: string) {
    if (translatedComments[commentId]) {
      // Toggle off
      setTranslatedComments((prev) => {
        const next = { ...prev };
        delete next[commentId];
        return next;
      });
      return;
    }
    try {
      const res = await fetch("/api/translate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: content, targetLanguage: language }),
      });
      const data = await res.json();
      if (data.translated) {
        setTranslatedComments((prev) => ({ ...prev, [commentId]: data.translated }));
      }
    } catch {}
  }

  return (
    <div className="px-5 py-4">
      {loading ? (
        <div className="text-center py-4 text-sm text-gray-400">Loading comments…</div>
      ) : (
        <div className="space-y-3 mb-4">
          {comments.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-2">
              No comments yet. Be the first!
            </p>
          ) : (
            comments.map((comment) => (
              <div key={comment.id} className="flex gap-2.5">
                <div className="w-7 h-7 bg-gray-200 rounded-full flex items-center justify-center text-gray-600 text-xs font-bold flex-shrink-0 mt-0.5">
                  {comment.author.name.slice(0, 2).toUpperCase()}
                </div>
                <div className="flex-1 bg-gray-50 rounded-xl px-3 py-2">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-gray-900">
                        {comment.author.name}
                      </span>
                      <span className="text-xs text-gray-400">
                        {formatRelative(comment.createdAt)}
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      {language !== "en" && (
                        <button
                          onClick={() => translateComment(comment.id, comment.content)}
                          className={`p-1 rounded text-xs transition ${
                            translatedComments[comment.id]
                              ? "text-blue-600"
                              : "text-gray-400 hover:text-blue-600"
                          }`}
                          title="Translate"
                        >
                          <Globe className="w-3 h-3" />
                        </button>
                      )}
                      {(isAdmin || comment.author.id === currentUserId) && (
                        <button
                          onClick={() => handleDelete(comment.id)}
                          className="p-1 rounded text-gray-400 hover:text-red-500 transition"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  </div>
                  <p className="text-sm text-gray-700 mt-0.5 leading-relaxed">
                    {translatedComments[comment.id] || comment.content}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Add comment */}
      <form onSubmit={handleSubmit} className="flex gap-2">
        <input
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          placeholder="Write a comment…"
          className="flex-1 px-3 py-2 text-sm bg-gray-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition"
          disabled={submitting}
        />
        <button
          type="submit"
          disabled={!newComment.trim() || submitting}
          className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 transition flex-shrink-0"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
}
