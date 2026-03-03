import { NextRequest, NextResponse } from "next/server";
import { requireAuth, requireAdmin } from "@/lib/auth";
import { db } from "@/lib/db";
import { apiErrorResponse } from "@/lib/utils";

export async function GET() {
  try {
    await requireAuth();
    const categories = await db.category.findMany({
      orderBy: { name: "asc" },
      include: { _count: { select: { posts: true } } },
    });
    return NextResponse.json(categories);
  } catch (error) {
    const err = apiErrorResponse(error);
    return NextResponse.json({ error: err.message }, { status: err.status });
  }
}

export async function POST(request: NextRequest) {
  try {
    await requireAdmin();
    const { name, color } = await request.json();

    if (!name) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 });
    }

    const category = await db.category.create({
      data: { name, color: color || "#3B82F6" },
    });

    return NextResponse.json(category, { status: 201 });
  } catch (error) {
    const err = apiErrorResponse(error);
    return NextResponse.json({ error: err.message }, { status: err.status });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    await requireAdmin();
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "ID required" }, { status: 400 });
    }

    await db.category.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    const err = apiErrorResponse(error);
    return NextResponse.json({ error: err.message }, { status: err.status });
  }
}
