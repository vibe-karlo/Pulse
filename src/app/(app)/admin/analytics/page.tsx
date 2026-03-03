"use client";

import { useEffect, useState } from "react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from "recharts";
import { Eye, MessageCircle, FileText, Users, TrendingUp } from "lucide-react";
import { formatDate } from "@/lib/utils";

interface AnalyticsData {
  overview: {
    totalUsers: number;
    activeUsers: number;
    pendingUsers: number;
    totalPosts: number;
    publishedPosts: number;
    pendingPosts: number;
    totalComments: number;
    totalViews: number;
  };
  topPosts: {
    id: string;
    title: string;
    viewCount: number;
    publishedAt: string;
    _count: { comments: number };
  }[];
  postsByCategory: { name: string; color: string; count: number }[];
  usersByDepartment: { department: string | null; count: number }[];
  recentActivity: {
    publishedAt: string;
    viewCount: number;
    _count: { comments: number };
  }[];
}

export default function AnalyticsPage() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/analytics")
      .then((r) => r.json())
      .then(setData)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="p-6 max-w-6xl mx-auto">
        <div className="h-8 bg-gray-200 rounded w-48 mb-6 animate-pulse" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-white rounded-xl border border-gray-200 p-5 animate-pulse">
              <div className="h-8 bg-gray-200 rounded w-16 mb-2" />
              <div className="h-3 bg-gray-100 rounded w-24" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!data) return <div className="p-6 text-red-500">Failed to load analytics</div>;

  const { overview, topPosts, postsByCategory, usersByDepartment, recentActivity } = data;

  const kpis = [
    { label: "Total Views", value: overview.totalViews.toLocaleString(), icon: Eye, color: "blue" },
    { label: "Published Posts", value: overview.publishedPosts, icon: FileText, color: "green" },
    { label: "Total Comments", value: overview.totalComments, icon: MessageCircle, color: "purple" },
    { label: "Active Users", value: overview.activeUsers, icon: Users, color: "indigo" },
  ];

  const colorMap: Record<string, string> = {
    blue: "text-blue-600 bg-blue-50",
    green: "text-green-600 bg-green-50",
    purple: "text-purple-600 bg-purple-50",
    indigo: "text-indigo-600 bg-indigo-50",
  };

  const deptData = usersByDepartment
    .filter((d) => d.department)
    .map((d) => ({ name: d.department!, value: d.count }));

  const RADIAN = Math.PI / 180;
  const renderCustomLabel = ({
    cx, cy, midAngle, innerRadius, outerRadius, percent,
  }: { cx: number; cy: number; midAngle: number; innerRadius: number; outerRadius: number; percent: number }) => {
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);
    return percent > 0.05 ? (
      <text x={x} y={y} fill="white" textAnchor="middle" dominantBaseline="central" fontSize={11} fontWeight={600}>
        {`${(percent * 100).toFixed(0)}%`}
      </text>
    ) : null;
  };

  const PIE_COLORS = ["#3B82F6", "#10B981", "#8B5CF6", "#F59E0B", "#EF4444", "#06B6D4", "#EC4899", "#84CC16"];

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Analytics</h1>
        <p className="text-gray-500 mt-0.5">Platform performance and engagement metrics</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {kpis.map((kpi) => (
          <div key={kpi.label} className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${colorMap[kpi.color]}`}>
              <kpi.icon className="w-5 h-5" />
            </div>
            <div className="text-3xl font-bold text-gray-900 mb-1">{kpi.value}</div>
            <div className="text-sm text-gray-500">{kpi.label}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Posts by Category */}
        <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
          <h3 className="font-semibold text-gray-900 mb-5">Posts by Category</h3>
          {postsByCategory.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-8">No data yet</p>
          ) : (
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={postsByCategory} margin={{ top: 0, right: 0, bottom: 0, left: -20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                <Tooltip
                  contentStyle={{ borderRadius: 8, border: "1px solid #e2e8f0", fontSize: 12 }}
                />
                <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                  {postsByCategory.map((entry, index) => (
                    <Cell key={index} fill={entry.color || "#3B82F6"} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Users by Department */}
        <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
          <h3 className="font-semibold text-gray-900 mb-5">Users by Department</h3>
          {deptData.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-8">No data yet</p>
          ) : (
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={deptData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={90}
                  labelLine={false}
                  label={renderCustomLabel}
                >
                  {deptData.map((_, index) => (
                    <Cell key={index} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ borderRadius: 8, fontSize: 12 }} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Top Posts */}
      <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm mb-6">
        <div className="flex items-center gap-2 mb-5">
          <TrendingUp className="w-5 h-5 text-blue-600" />
          <h3 className="font-semibold text-gray-900">Top Performing Posts</h3>
        </div>
        {topPosts.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-4">No published posts yet</p>
        ) : (
          <div className="space-y-3">
            {topPosts.map((post, i) => (
              <div key={post.id} className="flex items-center gap-4 p-3 rounded-lg hover:bg-gray-50 transition">
                <span className="text-2xl font-black text-gray-200 w-8 flex-shrink-0">
                  {i + 1}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{post.title}</p>
                  <p className="text-xs text-gray-400">
                    Published {post.publishedAt ? formatDate(post.publishedAt) : "—"}
                  </p>
                </div>
                <div className="flex items-center gap-4 flex-shrink-0">
                  <div className="flex items-center gap-1 text-sm text-gray-600">
                    <Eye className="w-4 h-4 text-gray-400" />
                    {post.viewCount}
                  </div>
                  <div className="flex items-center gap-1 text-sm text-gray-600">
                    <MessageCircle className="w-4 h-4 text-gray-400" />
                    {post._count.comments}
                  </div>
                </div>
                {/* View bar */}
                <div className="w-24">
                  <div className="bg-gray-100 rounded-full h-1.5">
                    <div
                      className="bg-blue-500 h-1.5 rounded-full"
                      style={{
                        width: `${Math.min(100, (post.viewCount / Math.max(...topPosts.map(p => p.viewCount), 1)) * 100)}%`,
                      }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
