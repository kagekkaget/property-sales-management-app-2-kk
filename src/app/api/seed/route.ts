import { NextResponse } from "next/server";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { hashPassword } from "@/lib/auth";

export async function POST() {
  try {
    // Check if admin already exists
    const existing = await db.select().from(users).where(eq(users.email, "owner@kavlingo.com")).limit(1);
    
    if (existing.length > 0) {
      return NextResponse.json({ message: "Data sudah ada" });
    }

    const ownerPassword = await hashPassword("owner123");
    const managerPassword = await hashPassword("manager123");
    const staffPassword = await hashPassword("staff123");

    await db.insert(users).values([
      {
        name: "Ahmad Fauzi",
        email: "owner@kavlingo.com",
        password: ownerPassword,
        role: "owner",
        phone: "081234567890",
        isActive: true,
      },
      {
        name: "Siti Rahayu",
        email: "manager@kavlingo.com",
        password: managerPassword,
        role: "manager",
        phone: "082345678901",
        isActive: true,
      },
      {
        name: "Budi Santoso",
        email: "staff@kavlingo.com",
        password: staffPassword,
        role: "staff",
        phone: "083456789012",
        isActive: true,
      },
    ]);

    return NextResponse.json({ 
      success: true, 
      message: "Data berhasil dibuat",
      accounts: [
        { email: "owner@kavlingo.com", password: "owner123", role: "Pemilik" },
        { email: "manager@kavlingo.com", password: "manager123", role: "Manajer" },
        { email: "staff@kavlingo.com", password: "staff123", role: "Staf" },
      ]
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Gagal membuat data" }, { status: 500 });
  }
}
