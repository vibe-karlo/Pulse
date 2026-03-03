import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { db } from "@/lib/db";
import { apiErrorResponse } from "@/lib/utils";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin();
    const { id } = await params;

    const post = await db.post.findUnique({ where: { id } });
    if (!post) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    const updated = await db.post.update({
      where: { id },
      data: {
        pinned: !post.pinned,
        pinnedAt: !post.pinned ? new Date() : null,
      },
    });

    return NextResponse.json({ pinned: updated.pinned });
  } catch (error) {
    const err = apiErrorResponse(error);
    return NextResponse.json({ error: err.message }, { status: err.status });
  }
}
