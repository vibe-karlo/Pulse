import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { db } from "@/lib/db";
import { apiErrorResponse } from "@/lib/utils";

export async function GET(request: NextRequest) {
  try {
    const session = await requireAuth();
    const { searchParams } = new URL(request.url);
    const unreadOnly = searchParams.get("unread") === "true";

    const notifications = await db.notification.findMany({
      where: {
        userId: session.id,
        ...(unreadOnly && { read: false }),
      },
      orderBy: { createdAt: "desc" },
      take: 50,
    });

    const unreadCount = await db.notification.count({
      where: { userId: session.id, read: false },
    });

    return NextResponse.json({ notifications, unreadCount });
  } catch (error) {
    const err = apiErrorResponse(error);
    return NextResponse.json({ error: err.message }, { status: err.status });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const session = await requireAuth();
    const { ids, all } = await request.json();

    if (all) {
      await db.notification.updateMany({
        where: { userId: session.id, read: false },
        data: { read: true },
      });
    } else if (ids?.length) {
      await db.notification.updateMany({
        where: { userId: session.id, id: { in: ids } },
        data: { read: true },
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    const err = apiErrorResponse(error);
    return NextResponse.json({ error: err.message }, { status: err.status });
  }
}
