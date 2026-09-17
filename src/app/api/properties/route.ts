import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { properties, activityLogs, stockAlerts } from "@/db/schema";
import { eq, desc, lt, lte, and } from "drizzle-orm";
import { getSession } from "@/lib/auth";
import { generatePropertyCode, getDaysUntilExpiry } from "@/lib/utils";

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const allProperties = await db
    .select()
    .from(properties)
    .orderBy(desc(properties.createdAt));

  return NextResponse.json({ properties: allProperties });
}

export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.role === "staff") {
    return NextResponse.json({ error: "Hanya owner dan manager yang dapat menambah properti" }, { status: 403 });
  }

  const data = await request.json();
  const { name, description, type, address, area, price, pricePerMeter, stock, minStock, status, expiryDate, imageUrl, features } = data;

  if (!name || !type || !address || !price) {
    return NextResponse.json({ error: "Data tidak lengkap" }, { status: 400 });
  }

  const code = generatePropertyCode(type);

  const [newProperty] = await db.insert(properties).values({
    code,
    name,
    description: description || null,
    type,
    address,
    area: area || null,
    price,
    pricePerMeter: pricePerMeter || null,
    stock: stock || 1,
    minStock: minStock || 1,
    status: status || "tersedia",
    expiryDate: expiryDate || null,
    imageUrl: imageUrl || null,
    features: features ? JSON.stringify(features) : null,
    createdBy: session.id,
  }).returning();

  // Check for alerts
  if (newProperty.stock <= newProperty.minStock) {
    await db.insert(stockAlerts).values({
      propertyId: newProperty.id,
      alertType: "low_stock",
      message: `Stok properti "${name}" rendah (${newProperty.stock} unit)`,
    });
  }

  if (expiryDate) {
    const days = getDaysUntilExpiry(expiryDate);
    if (days !== null && days <= 30) {
      await db.insert(stockAlerts).values({
        propertyId: newProperty.id,
        alertType: "expiring",
        message: `Listing properti "${name}" akan berakhir dalam ${days} hari`,
      });
    }
  }

  await db.insert(activityLogs).values({
    userId: session.id,
    action: "CREATE",
    entity: "properties",
    entityId: newProperty.id,
    description: `Menambah properti: ${name} (${code})`,
  });

  return NextResponse.json({ success: true, property: newProperty });
}
