import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { users, activityLogs } from "@/db/schema";
import { eq, desc, ne } from "drizzle-orm";
import { getSession, hashPassword } from "@/lib/auth";

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.role !== "owner" && session.role !== "manager") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const allUsers = await db
    .select({
      id: users.id,
      name: users.name,
      email: users.email,
      role: users.role,
      phone: users.phone,
      isActive: users.isActive,
      createdAt: users.createdAt,
    })
    .from(users)
    .orderBy(desc(users.createdAt));

  return NextResponse.json({ users: allUsers });
}

export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.role !== "owner") {
    return NextResponse.json({ error: "Hanya pemilik yang dapat menambah pengguna" }, { status: 403 });
  }

  const { name, email, password, role, phone } = await request.json();

  if (!name || !email || !password || !role) {
    return NextResponse.json({ error: "Data tidak lengkap" }, { status: 400 });
  }

  // Check if email exists
  const existing = await db.select().from(users).where(eq(users.email, email)).limit(1);
  if (existing.length > 0) {
    return NextResponse.json({ error: "Email sudah digunakan" }, { status: 400 });
  }

  const hashed = await hashPassword(password);

  const [newUser] = await db.insert(users).values({
    name,
    email,
    password: hashed,
    role,
    phone: phone || null,
    isActive: true,
  }).returning();

  await db.insert(activityLogs).values({
    userId: session.id,
    action: "CREATE",
    entity: "users",
    entityId: newUser.id,
    description: `Menambah pengguna baru: ${name} (${role})`,
  });

  return NextResponse.json({ success: true, user: { id: newUser.id, name: newUser.name, email: newUser.email, role: newUser.role } });
}
