import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { db } from "./db";

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "fallback-secret-change-in-production-32-chars!!"
);

export interface SessionUser {
  id: string;
  email: string;
  name: string;
  role: string;
  status: string;
  language: string;
}

export async function createToken(payload: SessionUser): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(JWT_SECRET);
}

export async function verifyToken(token: string): Promise<SessionUser | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    return payload as unknown as SessionUser;
  } catch {
    return null;
  }
}

export async function getSession(): Promise<SessionUser | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get("pulse-session")?.value;
  if (!token) return null;
  return verifyToken(token);
}

export async function requireAuth(): Promise<SessionUser> {
  const session = await getSession();
  if (!session) {
    throw new Error("UNAUTHORIZED");
  }
  if (session.status !== "ACTIVE") {
    throw new Error("ACCOUNT_PENDING");
  }
  return session;
}

export async function requireAdmin(): Promise<SessionUser> {
  const session = await requireAuth();
  if (session.role !== "ADMIN" && session.role !== "SUPER_ADMIN") {
    throw new Error("FORBIDDEN");
  }
  return session;
}

export function isAdmin(role: string): boolean {
  return role === "ADMIN" || role === "SUPER_ADMIN";
}

export async function setSessionCookie(token: string) {
  const cookieStore = await cookies();
  cookieStore.set("pulse-session", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 7, // 7 days
    path: "/",
  });
}

export async function clearSessionCookie() {
  const cookieStore = await cookies();
  cookieStore.delete("pulse-session");
}

export async function getUserFromDb(userId: string) {
  return db.user.findUnique({
    where: { id: userId },
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
    },
  });
}
