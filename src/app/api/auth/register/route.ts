import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import { DEPARTMENT_OPTIONS, SENIORITY_OPTIONS, COUNTRY_OPTIONS, REGION_OPTIONS } from "@/lib/utils";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password, name, seniority, country, region, department } = body;

    if (!email || !password || !name) {
      return NextResponse.json(
        { error: "Name, email and password are required" },
        { status: 400 }
      );
    }

    if (password.length < 8) {
      return NextResponse.json(
        { error: "Password must be at least 8 characters" },
        { status: 400 }
      );
    }

    const existing = await db.user.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json(
        { error: "Email already registered" },
        { status: 409 }
      );
    }

    const hashed = await bcrypt.hash(password, 12);

    // Check if this is the first user - make them super admin
    const userCount = await db.user.count();

    const user = await db.user.create({
      data: {
        email,
        password: hashed,
        name,
        seniority: seniority || null,
        country: country || null,
        region: region || null,
        department: department || null,
        role: userCount === 0 ? "SUPER_ADMIN" : "USER",
        status: userCount === 0 ? "ACTIVE" : "PENDING",
      },
    });

    // Notify admins about new user registration
    if (userCount > 0) {
      const admins = await db.user.findMany({
        where: { role: { in: ["ADMIN", "SUPER_ADMIN"] }, status: "ACTIVE" },
        select: { id: true },
      });

      await db.notification.createMany({
        data: admins.map((admin) => ({
          userId: admin.id,
          type: "USER_APPROVED",
          title: "New user registration",
          message: `${name} (${email}) has registered and is awaiting approval`,
        })),
      });
    }

    return NextResponse.json({
      message: userCount === 0
        ? "Account created. You are the first user and have been granted super admin access."
        : "Registration successful. Your account is pending admin approval.",
      pending: userCount > 0,
    });
  } catch (error) {
    console.error("Register error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
