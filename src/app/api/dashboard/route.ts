import { NextResponse } from "next/server";
import { db } from "@/db";
import { properties, customers, orders, stockAlerts, activityLogs, users } from "@/db/schema";
import { eq, count, sum, desc, and, gte } from "drizzle-orm";
import { getSession } from "@/lib/auth";

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Property stats
  const [propertyCount] = await db.select({ count: count() }).from(properties);
  const [availableCount] = await db.select({ count: count() }).from(properties).where(eq(properties.status, "tersedia"));
  const [soldCount] = await db.select({ count: count() }).from(properties).where(eq(properties.status, "terjual"));

  // Customer stats
  const [customerCount] = await db.select({ count: count() }).from(customers);

  // Order stats
  const [orderCount] = await db.select({ count: count() }).from(orders);
  const [completedOrders] = await db.select({ count: count() }).from(orders).where(eq(orders.status, "completed"));
  const [totalRevenue] = await db.select({ total: sum(orders.totalAmount) }).from(orders).where(eq(orders.status, "completed"));
  const [pendingOrders] = await db.select({ count: count() }).from(orders).where(eq(orders.status, "pending"));

  // Alert stats
  const [unreadAlerts] = await db.select({ count: count() }).from(stockAlerts).where(eq(stockAlerts.isRead, false));

  // Recent orders
  const recentOrders = await db
    .select({
      id: orders.id,
      orderNumber: orders.orderNumber,
      status: orders.status,
      paymentStatus: orders.paymentStatus,
      totalAmount: orders.totalAmount,
      orderDate: orders.orderDate,
    })
    .from(orders)
    .orderBy(desc(orders.createdAt))
    .limit(5);

  // Recent activity
  const recentActivity = await db
    .select({
      id: activityLogs.id,
      action: activityLogs.action,
      entity: activityLogs.entity,
      description: activityLogs.description,
      createdAt: activityLogs.createdAt,
    })
    .from(activityLogs)
    .orderBy(desc(activityLogs.createdAt))
    .limit(10);

  // Monthly revenue (last 6 months)
  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

  const monthlyRevenue = await db
    .select({
      total: sum(orders.totalAmount),
      orderDate: orders.orderDate,
    })
    .from(orders)
    .where(and(eq(orders.status, "completed"), gte(orders.orderDate, sixMonthsAgo)))
    .orderBy(orders.orderDate);

  return NextResponse.json({
    stats: {
      totalProperties: propertyCount.count,
      availableProperties: availableCount.count,
      soldProperties: soldCount.count,
      totalCustomers: customerCount.count,
      totalOrders: orderCount.count,
      completedOrders: completedOrders.count,
      pendingOrders: pendingOrders.count,
      totalRevenue: totalRevenue.total || 0,
      unreadAlerts: unreadAlerts.count,
    },
    recentOrders,
    recentActivity,
    monthlyRevenue,
  });
}
