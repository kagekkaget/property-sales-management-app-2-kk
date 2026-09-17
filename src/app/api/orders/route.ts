import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { orders, customers, properties, users, activityLogs } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { getSession } from "@/lib/auth";
import { generateOrderNumber } from "@/lib/utils";

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const allOrders = await db
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
      createdAt: orders.createdAt,
      customer: {
        id: customers.id,
        name: customers.name,
        phone: customers.phone,
        email: customers.email,
      },
      property: {
        id: properties.id,
        name: properties.name,
        code: properties.code,
        type: properties.type,
        price: properties.price,
      },
    })
    .from(orders)
    .leftJoin(customers, eq(orders.customerId, customers.id))
    .leftJoin(properties, eq(orders.propertyId, properties.id))
    .orderBy(desc(orders.createdAt));

  return NextResponse.json({ orders: allOrders });
}

export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const data = await request.json();
  const { customerId, propertyId, assignedTo, totalAmount, paidAmount, commission, notes, status, paymentStatus } = data;

  if (!customerId || !propertyId || !totalAmount) {
    return NextResponse.json({ error: "Data tidak lengkap" }, { status: 400 });
  }

  const orderNumber = generateOrderNumber();

  const [newOrder] = await db.insert(orders).values({
    orderNumber,
    customerId: parseInt(customerId),
    propertyId: parseInt(propertyId),
    assignedTo: assignedTo ? parseInt(assignedTo) : session.id,
    status: status || "pending",
    paymentStatus: paymentStatus || "unpaid",
    totalAmount: totalAmount.toString(),
    paidAmount: paidAmount ? paidAmount.toString() : "0",
    commission: commission ? commission.toString() : null,
    notes: notes || null,
    createdBy: session.id,
  }).returning();

  await db.insert(activityLogs).values({
    userId: session.id,
    action: "CREATE",
    entity: "orders",
    entityId: newOrder.id,
    description: `Membuat pesanan baru: ${orderNumber}`,
  });

  return NextResponse.json({ success: true, order: newOrder });
}
