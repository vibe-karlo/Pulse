"use client";

import { useState } from "react";
import {
  Pin, MessageCircle, Eye, ChevronDown, ChevronUp,
  Trash2, Edit, Globe, Check, X
} from "lucide-react";
import { formatRelative } from "@/lib/utils";
import CommentSection from "./CommentSection";
import { useApp } from "@/components/layout/AppShell";
import toast from "react-hot-toast";

interface Category {
  category: { id: string; name: string; color: string };
}

interface Segment {
  type: string;
  value: string;
}

interface Author {
  id: string;
  name: string;
  email: string;
  role: string;
}

interface Post {
  id: string;
  title: string;
  content: string;
  author: Author;
  status: string;
  pinned: boolean;
  publishedAt: string | null;
  createdAt: string;
  viewCount: number;
  categories: Category[];
  segments: Segment[];
  _count: { comments: number };
}

interface PostCardProps {
  post: Post;
  currentUserId: string;
  isAdmin: boolean;
  onDelete?: (id: string) => void;
  onPin?: (id: string, pinned: boolean) => void;
  onStatusChange?: (id: string, status: string) => void;
}

function renderContent(content: string) {
  // Basic markdown-like rendering
  return content
    .split("\n")
    .map((line, i) => {
      // Bold: **text**
      line = line.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>");
      // Italic: *text*
      line = line.replace(/\*(.*?)\*/g, "<em>$1</em>");
      // Bullet list
      if (line.startsWith("- ")) {
        return `<li key="${i}">${line.slice(2)}</li>`;
      }
      if (line === "") return `<br key="${i}" />`;
      return `<p key="${i}">${line}</p>`;
    })
    .join("");
}

export default function PostCard({
  post,
  currentUserId,
  isAdmin,
  onDelete,
  onPin,
  onStatusChange,
}: PostCardProps) {
  const { language } = useApp();
  const [expanded, setExpanded] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [translating, setTranslating] = useState(false);
  const [translatedTitle, setTranslatedTitle] = useState<string | null>(null);
  const [translatedContent, setTranslatedContent] = useState<string | null>(null);
  const [isTranslated, setIsTranslated] = useState(false);

  const displayTitle = translatedTitle || post.title;
  const displayContent = translatedContent || post.content;
  const isLong = post.content.length > 400;

  async function toggleTranslate() {
    if (isTranslated) {
      setIsTranslated(false);
      return;
    }
    if (translatedTitle) {
      setIsTranslated(true);
      return;
    }
    setTranslating(true);
    try {
      const res = await fetch("/api/translate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          texts: [post.title, post.content],
          targetLanguage: language,
        }),
      });
      const data = await res.json();
      if (data.translated) {
        setTranslatedTitle(data.translated[0]);
        setTranslatedContent(data.translated[1]);
        setIsTranslated(true);
      }
    } catch {
      toast.error("Translation failed");
    } finally {
      setTranslating(false);
    }
  }

  async function handlePin() {
    try {
      const res = await fetch(`/api/posts/${post.id}/pin`, { method: "POST" });
      const data = await res.json();
      if (onPin) onPin(post.id, data.pinned);
      toast.success(data.pinned ? "Post pinned" : "Post unpinned");
    } catch {
      toast.error("Failed to update pin");
    }
  }

  async function handleDelete() {
    if (!confirm("Delete this post?")) return;
    try {
      const res = await fetch(`/api/posts/${post.id}`, { method: "DELETE" });
      if (res.ok) {
        if (onDelete) onDelete(post.id);
        toast.success("Post deleted");
      }
    } catch {
      toast.error("Failed to delete post");
    }
  }

  async function handleApprove() {
    try {
      const res = await fetch(`/api/posts/${post.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "PUBLISHED" }),
      });
      if (res.ok) {
        if (onStatusChange) onStatusChange(post.id, "PUBLISHED");
        toast.success("Post approved and published");
      }
    } catch {
      toast.error("Failed to approve post");
    }
  }

  async function handleReject() {
    try {
      const res = await fetch(`/api/posts/${post.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "REJECTED" }),
      });
      if (res.ok) {
        if (onStatusChange) onStatusChange(post.id, "REJECTED");
        toast.success("Post rejected");
      }
    } catch {
      toast.error("Failed to reject post");
    }
  }

  const segmentLabels = post.segments.map((s) =>
    s.type === "ALL" ? "Everyone" : `${s.type}: ${s.value}`
  );

  return (
    <article className={`bg-white rounded-xl border ${post.pinned ? "border-blue-200 shadow-blue-50" : "border-gray-200"} shadow-sm overflow-hidden transition hover:shadow-md`}>
      {/* Pin banner */}
      {post.pinned && (
        <div className="bg-blue-600 px-4 py-1.5 flex items-center gap-1.5">
          <Pin className="w-3.5 h-3.5 text-blue-100" />
          <span className="text-xs font-semibold text-blue-100 uppercase tracking-wide">Pinned</span>
        </div>
      )}

      {/* Status banner for pending posts */}
      {post.status === "PENDING_APPROVAL" && isAdmin && (
        <div className="bg-amber-50 border-b border-amber-200 px-4 py-2 flex items-center justify-between">
          <span className="text-sm font-medium text-amber-800">⏳ Pending approval</span>
          <div className="flex gap-2">
            <button
              onClick={handleApprove}
              className="flex items-center gap-1 px-3 py-1 bg-green-600 text-white text-xs rounded-lg hover:bg-green-700 transition"
            >
              <Check className="w-3 h-3" /> Approve
            </button>
            <button
              onClick={handleReject}
              className="flex items-center gap-1 px-3 py-1 bg-red-600 text-white text-xs rounded-lg hover:bg-red-700 transition"
            >
              <X className="w-3 h-3" /> Reject
            </button>
          </div>
        </div>
      )}

      <div className="p-5">
        {/* Header */}
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex items-center gap-2.5 flex-1 min-w-0">
            <div className="w-9 h-9 bg-gradient-to-br from-blue-500 to-blue-700 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
              {post.author.name.slice(0, 2).toUpperCase()}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-gray-900">{post.author.name}</p>
              <p className="text-xs text-gray-400">
                {post.publishedAt
                  ? formatRelative(post.publishedAt)
                  : formatRelative(post.createdAt)}
              </p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-1 flex-shrink-0">
            {language !== "en" && (
              <button
                onClick={toggleTranslate}
                disabled={translating}
                className={`flex items-center gap-1 px-2 py-1 rounded-lg text-xs transition ${
                  isTranslated
                    ? "bg-blue-100 text-blue-700"
                    : "text-gray-400 hover:bg-gray-100"
                }`}
                title="Translate"
              >
                <Globe className="w-3.5 h-3.5" />
                {translating ? "…" : isTranslated ? "Original" : "Translate"}
              </button>
            )}
            {isAdmin && (
              <button
                onClick={handlePin}
                className={`p-1.5 rounded-lg transition ${
                  post.pinned
                    ? "text-blue-600 bg-blue-50"
                    : "text-gray-400 hover:bg-gray-100"
                }`}
                title={post.pinned ? "Unpin" : "Pin to top"}
              >
                <Pin className="w-4 h-4" />
              </button>
            )}
            {(isAdmin || post.author.id === currentUserId) && (
              <button
                onClick={handleDelete}
                className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition"
                title="Delete post"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Categories */}
        {post.categories.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-3">
            {post.categories.map((pc) => (
              <span
                key={pc.category.id}
                className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium text-white"
                style={{ backgroundColor: pc.category.color }}
              >
                {pc.category.name}
              </span>
            ))}
          </div>
        )}

        {/* Title */}
        <h2 className="text-lg font-bold text-gray-900 mb-2 leading-snug">{displayTitle}</h2>

        {/* Content */}
        <div className="text-gray-700 text-sm leading-relaxed prose-content">
          <div
            dangerouslySetInnerHTML={{
              __html: isLong && !expanded
                ? renderContent(displayContent.slice(0, 400)) + "…"
                : renderContent(displayContent),
            }}
          />
        </div>

        {isLong && (
          <button
            onClick={() => setExpanded(!expanded)}
            className="mt-2 flex items-center gap-1 text-blue-600 text-sm font-medium hover:underline"
          >
            {expanded ? (
              <><ChevronUp className="w-4 h-4" /> Show less</>
            ) : (
              <><ChevronDown className="w-4 h-4" /> Read more</>
            )}
          </button>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-100">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setShowComments(!showComments)}
              className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-blue-600 transition"
            >
              <MessageCircle className="w-4 h-4" />
              <span>{post._count.comments} comment{post._count.comments !== 1 ? "s" : ""}</span>
            </button>
            <span className="flex items-center gap-1.5 text-sm text-gray-400">
              <Eye className="w-4 h-4" />
              <span>{post.viewCount}</span>
            </span>
          </div>
          {segmentLabels.length > 0 && segmentLabels[0] !== "Everyone" && (
            <div className="text-xs text-gray-400 truncate max-w-32" title={segmentLabels.join(", ")}>
              {segmentLabels[0]}
              {segmentLabels.length > 1 && ` +${segmentLabels.length - 1}`}
            </div>
          )}
        </div>
      </div>

      {/* Comments */}
      {showComments && (
        <div className="border-t border-gray-100">
          <CommentSection postId={post.id} currentUserId={currentUserId} isAdmin={isAdmin} />
        </div>
      )}
    </article>
  );
}
