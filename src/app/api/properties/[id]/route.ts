import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { properties, activityLogs, stockAlerts } from "@/db/schema";
import { eq } from "drizzle-orm";
import { getSession } from "@/lib/auth";
import { getDaysUntilExpiry } from "@/lib/utils";

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const [property] = await db.select().from(properties).where(eq(properties.id, parseInt(id)));

  if (!property) {
    return NextResponse.json({ error: "Properti tidak ditemukan" }, { status: 404 });
  }

  return NextResponse.json({ property });
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.role === "staff") {
    return NextResponse.json({ error: "Tidak memiliki izin" }, { status: 403 });
  }

  const { id } = await params;
  const propertyId = parseInt(id);
  const data = await request.json();
  const { name, description, type, address, area, price, pricePerMeter, stock, minStock, status, expiryDate, imageUrl, features } = data;

  const [updated] = await db.update(properties).set({
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
    updatedAt: new Date(),
  }).where(eq(properties.id, propertyId)).returning();

  // Check and update alerts
  await db.delete(stockAlerts).where(eq(stockAlerts.propertyId, propertyId));

  if (updated.stock <= updated.minStock) {
    await db.insert(stockAlerts).values({
      propertyId,
      alertType: "low_stock",
      message: `Stok properti "${name}" rendah (${updated.stock} unit)`,
    });
  }

  if (expiryDate) {
    const days = getDaysUntilExpiry(expiryDate);
    if (days !== null && days <= 30) {
      await db.insert(stockAlerts).values({
        propertyId,
        alertType: "expiring",
        message: `Listing properti "${name}" akan berakhir dalam ${days} hari`,
      });
    }
  }

  await db.insert(activityLogs).values({
    userId: session.id,
    action: "UPDATE",
    entity: "properties",
    entityId: propertyId,
    description: `Mengubah properti: ${name}`,
  });

  return NextResponse.json({ success: true, property: updated });
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.role === "staff") {
    return NextResponse.json({ error: "Tidak memiliki izin" }, { status: 403 });
  }

  const { id } = await params;
  const propertyId = parseInt(id);

  const [property] = await db.select().from(properties).where(eq(properties.id, propertyId));
  if (!property) {
    return NextResponse.json({ error: "Properti tidak ditemukan" }, { status: 404 });
  }

  await db.delete(stockAlerts).where(eq(stockAlerts.propertyId, propertyId));
  await db.delete(properties).where(eq(properties.id, propertyId));

  await db.insert(activityLogs).values({
    userId: session.id,
    action: "DELETE",
    entity: "properties",
    entityId: propertyId,
    description: `Menghapus properti: ${property.name}`,
  });

  return NextResponse.json({ success: true });
}
