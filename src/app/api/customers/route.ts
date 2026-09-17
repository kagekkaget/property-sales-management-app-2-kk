import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { customers, activityLogs } from "@/db/schema";
import { desc } from "drizzle-orm";
import { getSession } from "@/lib/auth";

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const allCustomers = await db
    .select()
    .from(customers)
    .orderBy(desc(customers.createdAt));

  return NextResponse.json({ customers: allCustomers });
}

export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const data = await request.json();
  const { name, email, phone, address, nik, occupation, budget, preferences, notes } = data;

  if (!name || !phone) {
    return NextResponse.json({ error: "Nama dan telepon diperlukan" }, { status: 400 });
  }

  const [newCustomer] = await db.insert(customers).values({
    name,
    email: email || null,
    phone,
    address: address || null,
    nik: nik || null,
    occupation: occupation || null,
    budget: budget || null,
    preferences: preferences ? JSON.stringify(preferences) : null,
    notes: notes || null,
    createdBy: session.id,
  }).returning();

  await db.insert(activityLogs).values({
    userId: session.id,
    action: "CREATE",
    entity: "customers",
    entityId: newCustomer.id,
    description: `Menambah pelanggan: ${name}`,
  });

  return NextResponse.json({ success: true, customer: newCustomer });
}
