import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await db.user.findUnique({
    where: { id: session.id },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      status: true,
      language: true,
      seniority: true,
      country: true,
      region: true,
      department: true,
      avatar: true,
      createdAt: true,
    },
  });

  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  return NextResponse.json(user);
}

export async function PATCH(request: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { name, language, seniority, country, region, department } = body;

  const user = await db.user.update({
    where: { id: session.id },
    data: {
      ...(name && { name }),
      ...(language && { language }),
      ...(seniority !== undefined && { seniority }),
      ...(country !== undefined && { country }),
      ...(region !== undefined && { region }),
      ...(department !== undefined && { department }),
    },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      status: true,
      language: true,
      seniority: true,
      country: true,
      region: true,
      department: true,
    },
  });

  return NextResponse.json(user);
}
