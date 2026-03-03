import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { db } from "@/lib/db";
import { apiErrorResponse } from "@/lib/utils";

export async function GET() {
  try {
    await requireAdmin();

    const [
      totalUsers,
      activeUsers,
      pendingUsers,
      totalPosts,
      publishedPosts,
      pendingPosts,
      totalComments,
      totalViews,
      topPosts,
      postsByCategory,
      usersByDepartment,
      recentActivity,
    ] = await Promise.all([
      db.user.count(),
      db.user.count({ where: { status: "ACTIVE" } }),
      db.user.count({ where: { status: "PENDING" } }),
      db.post.count(),
      db.post.count({ where: { status: "PUBLISHED" } }),
      db.post.count({ where: { status: "PENDING_APPROVAL" } }),
      db.comment.count(),
      db.post.aggregate({ _sum: { viewCount: true } }),
      db.post.findMany({
        where: { status: "PUBLISHED" },
        orderBy: { viewCount: "desc" },
        take: 5,
        select: {
          id: true,
          title: true,
          viewCount: true,
          publishedAt: true,
          _count: { select: { comments: true } },
        },
      }),
      db.postCategory.groupBy({
        by: ["categoryId"],
        _count: { postId: true },
        orderBy: { _count: { postId: "desc" } },
      }),
      db.user.groupBy({
        by: ["department"],
        _count: { id: true },
        where: { status: "ACTIVE", department: { not: null } },
        orderBy: { _count: { id: "desc" } },
        take: 10,
      }),
      db.post.findMany({
        where: { status: "PUBLISHED" },
        orderBy: { publishedAt: "desc" },
        take: 7,
        select: {
          publishedAt: true,
          viewCount: true,
          _count: { select: { comments: true } },
        },
      }),
    ]);

    // Get category names for postsByCategory
    const categoryIds = postsByCategory.map((c) => c.categoryId);
    const categories = await db.category.findMany({
      where: { id: { in: categoryIds } },
      select: { id: true, name: true, color: true },
    });
    const categoryMap = Object.fromEntries(categories.map((c) => [c.id, c]));

    const postsByCategoryWithNames = postsByCategory.map((item) => ({
      name: categoryMap[item.categoryId]?.name || "Unknown",
      color: categoryMap[item.categoryId]?.color || "#3B82F6",
      count: item._count.postId,
    }));

    return NextResponse.json({
      overview: {
        totalUsers,
        activeUsers,
        pendingUsers,
        totalPosts,
        publishedPosts,
        pendingPosts,
        totalComments,
        totalViews: totalViews._sum.viewCount || 0,
      },
      topPosts,
      postsByCategory: postsByCategoryWithNames,
      usersByDepartment: usersByDepartment.map((u) => ({
        department: u.department,
        count: u._count.id,
      })),
      recentActivity,
    });
  } catch (error) {
    const err = apiErrorResponse(error);
    return NextResponse.json({ error: err.message }, { status: err.status });
  }
}
