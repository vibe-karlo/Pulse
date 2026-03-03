import { NextRequest, NextResponse } from "next/server";
import { requireAuth, requireAdmin, isAdmin } from "@/lib/auth";
import { db } from "@/lib/db";
import { apiErrorResponse } from "@/lib/utils";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireAuth();
    const { id } = await params;

    const post = await db.post.findUnique({
      where: { id },
      include: {
        author: {
          select: { id: true, name: true, email: true, role: true, avatar: true },
        },
        categories: { include: { category: true } },
        segments: true,
        _count: { select: { comments: true } },
      },
    });

    if (!post) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    // Non-admins can only see published posts
    if (!isAdmin(session.role) && post.status !== "PUBLISHED") {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    // Increment view count
    if (post.status === "PUBLISHED") {
      await db.post.update({
        where: { id },
        data: { viewCount: { increment: 1 } },
      });
    }

    return NextResponse.json(post);
  } catch (error) {
    const err = apiErrorResponse(error);
    return NextResponse.json({ error: err.message }, { status: err.status });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireAuth();
    const { id } = await params;
    const body = await request.json();

    const post = await db.post.findUnique({ where: { id } });
    if (!post) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    // Only author or admin can edit
    if (post.authorId !== session.id && !isAdmin(session.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { title, content, status, categoryIds, segments } = body;

    // Status transitions: admins can approve/reject
    const isStatusChange = status && status !== post.status;
    if (isStatusChange && !isAdmin(session.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const updateData: any = {};
    if (title !== undefined) updateData.title = title;
    if (content !== undefined) updateData.content = content;
    if (status !== undefined) {
      updateData.status = status;
      if (status === "PUBLISHED" && !post.publishedAt) {
        updateData.publishedAt = new Date();
      }
    }

    const updated = await db.post.update({
      where: { id },
      data: {
        ...updateData,
        ...(categoryIds !== undefined && {
          categories: {
            deleteMany: {},
            create: categoryIds.map((cid: string) => ({ categoryId: cid })),
          },
        }),
        ...(segments !== undefined && {
          segments: {
            deleteMany: {},
            create:
              segments.length > 0
                ? segments.map((s: { type: string; value: string }) => ({
                    type: s.type,
                    value: s.value,
                  }))
                : [{ type: "ALL", value: "all" }],
          },
        }),
      },
      include: {
        author: { select: { id: true, name: true } },
        categories: { include: { category: true } },
        segments: true,
      },
    });

    // Notify post author about approval/rejection
    if (isStatusChange && isAdmin(session.role)) {
      if (status === "PUBLISHED") {
        await db.notification.create({
          data: {
            userId: post.authorId,
            type: "POST_APPROVED",
            title: "Post approved!",
            message: `Your post "${post.title}" has been approved and published.`,
            postId: id,
          },
        });
        // Notify users
        const postSegments = await db.postSegment.findMany({ where: { postId: id } });
        await notifyUsers(id, post.title, session.name, postSegments);
      } else if (status === "REJECTED") {
        await db.notification.create({
          data: {
            userId: post.authorId,
            type: "POST_REJECTED",
            title: "Post rejected",
            message: `Your post "${post.title}" was not approved. Please revise and resubmit.`,
            postId: id,
          },
        });
      }
    }

    return NextResponse.json(updated);
  } catch (error) {
    const err = apiErrorResponse(error);
    return NextResponse.json({ error: err.message }, { status: err.status });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireAuth();
    const { id } = await params;

    const post = await db.post.findUnique({ where: { id } });
    if (!post) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    if (post.authorId !== session.id && !isAdmin(session.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    await db.post.delete({ where: { id } });
    return NextResponse.json({ success: true });
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
