import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { db } from "@/lib/db";
import { apiErrorResponse } from "@/lib/utils";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireAdmin();
    const { id } = await params;
    const body = await request.json();
    const { status, role } = body;

    const target = await db.user.findUnique({ where: { id } });
    if (!target) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // SUPER_ADMIN can't be demoted by ADMIN
    if (
      target.role === "SUPER_ADMIN" &&
      session.role !== "SUPER_ADMIN"
    ) {
      return NextResponse.json(
        { error: "Cannot modify super admin" },
        { status: 403 }
      );
    }

    const updated = await db.user.update({
      where: { id },
      data: {
        ...(status !== undefined && { status }),
        ...(role !== undefined && session.role === "SUPER_ADMIN" && { role }),
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        status: true,
        department: true,
        seniority: true,
        country: true,
        region: true,
        createdAt: true,
      },
    });

    // Notify user if approved
    if (status === "ACTIVE" && target.status === "PENDING") {
      await db.notification.create({
        data: {
          userId: id,
          type: "USER_APPROVED",
          title: "Account approved!",
          message:
            "Your account has been approved. Welcome to Pulse!",
        },
      });
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
    const session = await requireAdmin();
    const { id } = await params;

    if (id === session.id) {
      return NextResponse.json(
        { error: "Cannot delete yourself" },
        { status: 400 }
      );
    }

    const target = await db.user.findUnique({ where: { id } });
    if (!target) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    if (target.role === "SUPER_ADMIN") {
      return NextResponse.json(
        { error: "Cannot delete super admin" },
        { status: 403 }
      );
    }

    await db.user.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    const err = apiErrorResponse(error);
    return NextResponse.json({ error: err.message }, { status: err.status });
  }
}
