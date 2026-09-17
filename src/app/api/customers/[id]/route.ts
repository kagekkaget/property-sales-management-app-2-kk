import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { customers, orders, activityLogs } from "@/db/schema";
import { eq } from "drizzle-orm";
import { getSession } from "@/lib/auth";

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const [customer] = await db.select().from(customers).where(eq(customers.id, parseInt(id)));

  if (!customer) {
    return NextResponse.json({ error: "Pelanggan tidak ditemukan" }, { status: 404 });
  }

  const customerOrders = await db.select().from(orders).where(eq(orders.customerId, parseInt(id)));

  return NextResponse.json({ customer, orders: customerOrders });
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const customerId = parseInt(id);
  const data = await request.json();
  const { name, email, phone, address, nik, occupation, budget, preferences, notes } = data;

  const [updated] = await db.update(customers).set({
    name,
    email: email || null,
    phone,
    address: address || null,
    nik: nik || null,
    occupation: occupation || null,
    budget: budget || null,
    preferences: preferences ? JSON.stringify(preferences) : null,
    notes: notes || null,
    updatedAt: new Date(),
  }).where(eq(customers.id, customerId)).returning();

  await db.insert(activityLogs).values({
    userId: session.id,
    action: "UPDATE",
    entity: "customers",
    entityId: customerId,
    description: `Mengubah pelanggan: ${name}`,
  });

  return NextResponse.json({ success: true, customer: updated });
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const customerId = parseInt(id);

  const [customer] = await db.select().from(customers).where(eq(customers.id, customerId));
  if (!customer) {
    return NextResponse.json({ error: "Pelanggan tidak ditemukan" }, { status: 404 });
  }

  await db.delete(customers).where(eq(customers.id, customerId));

  await db.insert(activityLogs).values({
    userId: session.id,
    action: "DELETE",
    entity: "customers",
    entityId: customerId,
    description: `Menghapus pelanggan: ${customer.name}`,
  });

  return NextResponse.json({ success: true });
}
