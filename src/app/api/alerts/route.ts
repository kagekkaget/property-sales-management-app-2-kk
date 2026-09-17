import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { stockAlerts, properties } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { getSession } from "@/lib/auth";

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const alerts = await db
    .select({
      id: stockAlerts.id,
      alertType: stockAlerts.alertType,
      message: stockAlerts.message,
      isRead: stockAlerts.isRead,
      createdAt: stockAlerts.createdAt,
      property: {
        id: properties.id,
        name: properties.name,
        code: properties.code,
      },
    })
    .from(stockAlerts)
    .leftJoin(properties, eq(stockAlerts.propertyId, properties.id))
    .orderBy(desc(stockAlerts.createdAt));

  return NextResponse.json({ alerts });
}

export async function PUT(request: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await request.json();
  await db.update(stockAlerts).set({ isRead: true }).where(eq(stockAlerts.id, id));

  return NextResponse.json({ success: true });
}
