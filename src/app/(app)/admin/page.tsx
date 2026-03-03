"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Users, FileText, MessageCircle, Eye, Clock, TrendingUp,
  CheckCircle, AlertCircle, BarChart3
} from "lucide-react";

interface Overview {
  totalUsers: number;
  activeUsers: number;
  pendingUsers: number;
  totalPosts: number;
  publishedPosts: number;
  pendingPosts: number;
  totalComments: number;
  totalViews: number;
}

interface TopPost {
  id: string;
  title: string;
  viewCount: number;
  publishedAt: string;
  _count: { comments: number };
}

export default function AdminDashboard() {
  const [overview, setOverview] = useState<Overview | null>(null);
  const [topPosts, setTopPosts] = useState<TopPost[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/analytics")
      .then((r) => r.json())
      .then((data) => {
        setOverview(data.overview);
        setTopPosts(data.topPosts || []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const stats = overview
    ? [
        {
          label: "Total Users",
          value: overview.totalUsers,
          sub: `${overview.activeUsers} active`,
          icon: Users,
          color: "blue",
          href: "/admin/users",
        },
        {
          label: "Pending Approvals",
          value: overview.pendingUsers,
          sub: "Users awaiting review",
          icon: Clock,
          color: "amber",
          href: "/admin/users?status=PENDING",
          alert: overview.pendingUsers > 0,
        },
        {
          label: "Published Posts",
          value: overview.publishedPosts,
          sub: `${overview.pendingPosts} pending`,
          icon: FileText,
          color: "green",
          href: "/admin/posts",
        },
        {
          label: "Total Comments",
          value: overview.totalComments,
          sub: "Across all posts",
          icon: MessageCircle,
          color: "purple",
          href: "/admin/analytics",
        },
        {
          label: "Total Views",
          value: overview.totalViews.toLocaleString(),
          sub: "Post impressions",
          icon: Eye,
          color: "indigo",
          href: "/admin/analytics",
        },
        {
          label: "Posts Pending",
          value: overview.pendingPosts,
          sub: "Awaiting approval",
          icon: AlertCircle,
          color: "orange",
          href: "/admin/posts?status=PENDING_APPROVAL",
          alert: overview.pendingPosts > 0,
        },
      ]
    : [];

  const colorMap: Record<string, string> = {
    blue: "bg-blue-50 text-blue-600",
    amber: "bg-amber-50 text-amber-600",
    green: "bg-green-50 text-green-600",
    purple: "bg-purple-50 text-purple-600",
    indigo: "bg-indigo-50 text-indigo-600",
    orange: "bg-orange-50 text-orange-600",
  };

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
        <p className="text-gray-500 mt-1">Overview of Pulse activity</p>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="bg-white rounded-xl border border-gray-200 p-5 animate-pulse">
              <div className="h-8 bg-gray-200 rounded w-16 mb-2" />
              <div className="h-3 bg-gray-100 rounded w-24" />
            </div>
          ))}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
            {stats.map((stat) => (
              <Link
                key={stat.label}
                href={stat.href}
                className={`bg-white rounded-xl border p-5 hover:shadow-md transition group ${
                  stat.alert ? "border-orange-200" : "border-gray-200"
                }`}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${colorMap[stat.color]}`}>
                    <stat.icon className="w-5 h-5" />
                  </div>
                  {stat.alert && (
                    <span className="flex h-2.5 w-2.5">
                      <span className="animate-ping absolute inline-flex h-2.5 w-2.5 rounded-full bg-orange-400 opacity-75" />
                      <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-orange-500" />
                    </span>
                  )}
                </div>
                <div className="text-3xl font-bold text-gray-900 mb-1">{stat.value}</div>
                <div className="text-sm font-medium text-gray-700">{stat.label}</div>
                <div className="text-xs text-gray-400 mt-0.5">{stat.sub}</div>
              </Link>
            ))}
          </div>

          {/* Quick actions */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Top Posts */}
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-gray-900">Top Posts by Views</h3>
                <Link href="/admin/analytics" className="text-xs text-blue-600 hover:underline">
                  View analytics →
                </Link>
              </div>
              {topPosts.length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-4">No published posts yet</p>
              ) : (
                <div className="space-y-3">
                  {topPosts.map((post, i) => (
                    <div key={post.id} className="flex items-center gap-3">
                      <span className="text-lg font-bold text-gray-300 w-6 flex-shrink-0">
                        {i + 1}
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">{post.title}</p>
                        <p className="text-xs text-gray-400">
                          {post.viewCount} views · {post._count.comments} comments
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Quick actions */}
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <h3 className="font-semibold text-gray-900 mb-4">Quick Actions</h3>
              <div className="space-y-2">
                <Link
                  href="/admin/users?status=PENDING"
                  className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-gray-50 transition group"
                >
                  <div className="w-8 h-8 bg-amber-100 rounded-lg flex items-center justify-center">
                    <Clock className="w-4 h-4 text-amber-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">Review pending users</p>
                    <p className="text-xs text-gray-400">{overview?.pendingUsers || 0} awaiting approval</p>
                  </div>
                </Link>
                <Link
                  href="/admin/posts?status=PENDING_APPROVAL"
                  className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-gray-50 transition group"
                >
                  <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                    <FileText className="w-4 h-4 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">Review pending posts</p>
                    <p className="text-xs text-gray-400">{overview?.pendingPosts || 0} awaiting review</p>
                  </div>
                </Link>
                <Link
                  href="/admin/analytics"
                  className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-gray-50 transition group"
                >
                  <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                    <BarChart3 className="w-4 h-4 text-green-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">View analytics</p>
                    <p className="text-xs text-gray-400">Posts, views, and engagement</p>
                  </div>
                </Link>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
