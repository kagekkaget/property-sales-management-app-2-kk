import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { orders, customers, properties, activityLogs } from "@/db/schema";
import { eq } from "drizzle-orm";
import { getSession } from "@/lib/auth";

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const [order] = await db
    .select({
      id: orders.id,
      orderNumber: orders.orderNumber,
      status: orders.status,
      paymentStatus: orders.paymentStatus,
      totalAmount: orders.totalAmount,
      paidAmount: orders.paidAmount,
      commission: orders.commission,
      notes: orders.notes,
      orderDate: orders.orderDate,
      completedDate: orders.completedDate,
      customer: {
        id: customers.id,
        name: customers.name,
        phone: customers.phone,
        email: customers.email,
        address: customers.address,
      },
      property: {
        id: properties.id,
        name: properties.name,
        code: properties.code,
        type: properties.type,
        price: properties.price,
        address: properties.address,
      },
    })
    .from(orders)
    .leftJoin(customers, eq(orders.customerId, customers.id))
    .leftJoin(properties, eq(orders.propertyId, properties.id))
    .where(eq(orders.id, parseInt(id)));

  if (!order) {
    return NextResponse.json({ error: "Pesanan tidak ditemukan" }, { status: 404 });
  }

  return NextResponse.json({ order });
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const orderId = parseInt(id);
  const data = await request.json();
  const { status, paymentStatus, paidAmount, commission, notes, completedDate } = data;

  const [updated] = await db.update(orders).set({
    status,
    paymentStatus,
    paidAmount: paidAmount ? paidAmount.toString() : "0",
    commission: commission ? commission.toString() : null,
    notes: notes || null,
    completedDate: completedDate ? new Date(completedDate) : null,
    updatedAt: new Date(),
  }).where(eq(orders.id, orderId)).returning();

  await db.insert(activityLogs).values({
    userId: session.id,
    action: "UPDATE",
    entity: "orders",
    entityId: orderId,
    description: `Mengubah pesanan: ${updated.orderNumber} - Status: ${status}`,
  });

  return NextResponse.json({ success: true, order: updated });
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.role === "staff") {
    return NextResponse.json({ error: "Tidak memiliki izin" }, { status: 403 });
  }

  const { id } = await params;
  const orderId = parseInt(id);

  const [order] = await db.select().from(orders).where(eq(orders.id, orderId));
  if (!order) {
    return NextResponse.json({ error: "Pesanan tidak ditemukan" }, { status: 404 });
  }

  await db.delete(orders).where(eq(orders.id, orderId));

  await db.insert(activityLogs).values({
    userId: session.id,
    action: "DELETE",
    entity: "orders",
    entityId: orderId,
    description: `Menghapus pesanan: ${order.orderNumber}`,
  });

  return NextResponse.json({ success: true });
}
