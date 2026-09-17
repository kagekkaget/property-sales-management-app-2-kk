import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { properties, customers, orders } from "@/db/schema";
import { eq, desc, gte, lte, and } from "drizzle-orm";
import { getSession } from "@/lib/auth";

export async function GET(request: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const type = searchParams.get("type") || "inventory";
  const startDate = searchParams.get("startDate");
  const endDate = searchParams.get("endDate");

  let data: unknown[] = [];

  if (type === "inventory") {
    data = await db.select().from(properties).orderBy(desc(properties.createdAt));
  } else if (type === "sales") {
    let query = db
      .select({
        id: orders.id,
        orderNumber: orders.orderNumber,
        status: orders.status,
        paymentStatus: orders.paymentStatus,
        totalAmount: orders.totalAmount,
        paidAmount: orders.paidAmount,
        commission: orders.commission,
        orderDate: orders.orderDate,
        completedDate: orders.completedDate,
        customerName: customers.name,
        customerPhone: customers.phone,
        propertyName: properties.name,
        propertyCode: properties.code,
        propertyType: properties.type,
      })
      .from(orders)
      .leftJoin(customers, eq(orders.customerId, customers.id))
      .leftJoin(properties, eq(orders.propertyId, properties.id))
      .orderBy(desc(orders.orderDate));

    data = await query;
  } else if (type === "customers") {
    data = await db.select().from(customers).orderBy(desc(customers.createdAt));
  }

  return NextResponse.json({ data, type });
}
