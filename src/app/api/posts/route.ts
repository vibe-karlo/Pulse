import { NextRequest, NextResponse } from "next/server";
import { requireAuth, isAdmin } from "@/lib/auth";
import { db } from "@/lib/db";
import { apiErrorResponse } from "@/lib/utils";

export async function GET(request: NextRequest) {
  try {
    const session = await requireAuth();
    const { searchParams } = new URL(request.url);
    const categoryId = searchParams.get("category");
    const status = searchParams.get("status");
    const search = searchParams.get("search");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const skip = (page - 1) * limit;

    // Build where clause
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const where: any = {};

    // Non-admins only see published posts visible to them
    if (!isAdmin(session.role)) {
      where.status = "PUBLISHED";

      // Filter by user's segments
      const user = await db.user.findUnique({ where: { id: session.id } });
      if (user) {
        where.segments = {
          some: {
            OR: [
              { type: "ALL" },
              ...(user.seniority
                ? [{ type: "SENIORITY", value: user.seniority }]
                : []),
              ...(user.country
                ? [{ type: "COUNTRY", value: user.country }]
                : []),
              ...(user.region
                ? [{ type: "REGION", value: user.region }]
                : []),
              ...(user.department
                ? [{ type: "DEPARTMENT", value: user.department }]
                : []),
            ],
          },
        };
      }
    } else if (status) {
      where.status = status;
    }

    if (categoryId) {
      where.categories = { some: { categoryId } };
    }

    if (search) {
      where.OR = [
        { title: { contains: search } },
        { content: { contains: search } },
      ];
    }

    const [posts, total] = await Promise.all([
      db.post.findMany({
        where,
        include: {
          author: {
            select: { id: true, name: true, email: true, role: true, avatar: true },
          },
          categories: {
            include: { category: true },
          },
          segments: true,
          _count: { select: { comments: true } },
        },
        orderBy: [{ pinned: "desc" }, { pinnedAt: "desc" }, { publishedAt: "desc" }, { createdAt: "desc" }],
        skip,
        take: limit,
      }),
      db.post.count({ where }),
    ]);

    return NextResponse.json({
      posts,
      total,
      page,
      pages: Math.ceil(total / limit),
    });
  } catch (error) {
    const err = apiErrorResponse(error);
    return NextResponse.json({ error: err.message }, { status: err.status });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await requireAuth();
    const body = await request.json();
    const { title, content, categoryIds, segments, status } = body;

    if (!title || !content) {
      return NextResponse.json(
        { error: "Title and content are required" },
        { status: 400 }
      );
    }

    const postStatus = isAdmin(session.role)
      ? (status || "PUBLISHED")
      : "PENDING_APPROVAL";

    const post = await db.post.create({
      data: {
        title,
        content,
        authorId: session.id,
        status: postStatus,
        publishedAt: postStatus === "PUBLISHED" ? new Date() : null,
        categories: {
          create: (categoryIds || []).map((id: string) => ({ categoryId: id })),
        },
        segments: {
          create:
            segments && segments.length > 0
              ? segments.map((s: { type: string; value: string }) => ({
                  type: s.type,
                  value: s.value,
                }))
              : [{ type: "ALL", value: "all" }],
        },
      },
      include: {
        author: { select: { id: true, name: true } },
        categories: { include: { category: true } },
        segments: true,
      },
    });

    // If published, notify relevant users
    if (postStatus === "PUBLISHED") {
      await notifyUsers(post.id, title, session.name, post.segments);
    } else if (postStatus === "PENDING_APPROVAL") {
      // Notify admins
      const admins = await db.user.findMany({
        where: { role: { in: ["ADMIN", "SUPER_ADMIN"] }, status: "ACTIVE" },
        select: { id: true },
      });

      await db.notification.createMany({
        data: admins.map((admin) => ({
          userId: admin.id,
          type: "POST_APPROVED",
          title: "Post pending approval",
          message: `${session.name} submitted a post for review: "${title}"`,
          postId: post.id,
        })),
      });
    }

    return NextResponse.json(post, { status: 201 });
  } catch (error) {
    const err = apiErrorResponse(error);
    return NextResponse.json({ error: err.message }, { status: err.status });
  }
}

async function notifyUsers(
  postId: string,
  title: string,
  authorName: string,
  segments: { type: string; value: string }[]
) {
  const hasAll = segments.some((s) => s.type === "ALL");

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let userWhere: any = { status: "ACTIVE" };

  if (!hasAll) {
    const conditions = segments.map((s) => {
      if (s.type === "SENIORITY") return { seniority: s.value };
      if (s.type === "COUNTRY") return { country: s.value };
      if (s.type === "REGION") return { region: s.value };
      if (s.type === "DEPARTMENT") return { department: s.value };
      return {};
    });
    userWhere = { status: "ACTIVE", OR: conditions };
  }

  const users = await db.user.findMany({
    where: userWhere,
    select: { id: true },
    take: 500,
  });

  await db.notification.createMany({
    data: users.map((u) => ({
      userId: u.id,
      type: "NEW_POST",
      title: `New post: ${title}`,
      message: `${authorName} published a new post`,
      postId,
    })),
  });
}
