import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { users, activityLogs } from "@/db/schema";
import { eq } from "drizzle-orm";
import { getSession, hashPassword } from "@/lib/auth";

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.role !== "owner") {
    return NextResponse.json({ error: "Hanya pemilik yang dapat mengubah pengguna" }, { status: 403 });
  }

  const { id } = await params;
  const userId = parseInt(id);
  const { name, email, role, phone, isActive, password } = await request.json();

  const updateData: Partial<typeof users.$inferInsert> = {
    name,
    email,
    role,
    phone: phone || null,
    isActive,
    updatedAt: new Date(),
  };

  if (password) {
    updateData.password = await hashPassword(password);
  }

  await db.update(users).set(updateData).where(eq(users.id, userId));

  await db.insert(activityLogs).values({
    userId: session.id,
    action: "UPDATE",
    entity: "users",
    entityId: userId,
    description: `Mengubah pengguna: ${name}`,
  });

  return NextResponse.json({ success: true });
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.role !== "owner") {
    return NextResponse.json({ error: "Hanya pemilik yang dapat menghapus pengguna" }, { status: 403 });
  }

  const { id } = await params;
  const userId = parseInt(id);

  if (userId === session.id) {
    return NextResponse.json({ error: "Tidak dapat menghapus akun sendiri" }, { status: 400 });
  }

  await db.update(users).set({ isActive: false, updatedAt: new Date() }).where(eq(users.id, userId));

  await db.insert(activityLogs).values({
    userId: session.id,
    action: "DELETE",
    entity: "users",
    entityId: userId,
    description: `Menonaktifkan pengguna ID: ${userId}`,
  });

  return NextResponse.json({ success: true });
}
