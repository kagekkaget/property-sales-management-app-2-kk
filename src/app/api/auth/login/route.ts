import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { comparePassword, setSession } from "@/lib/auth";

export async function POST(request: NextRequest) {
  try {
    let email: string, password: string;
    try {
      const body = await request.json();
      email = body.email;
      password = body.password;
    } catch (e) {
      return NextResponse.json(
        { error: "Invalid JSON body", detail: String(e) },
        { status: 400 }
      );
    }

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email dan password diperlukan" },
        { status: 400 }
      );
    }

    const user = await db
      .select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    if (!user.length) {
      return NextResponse.json(
        { error: "Email atau password salah" },
        { status: 401 }
      );
    }

    const foundUser = user[0];

    if (!foundUser.isActive) {
      return NextResponse.json(
        { error: "Akun tidak aktif. Hubungi administrator" },
        { status: 403 }
      );
    }

    const isValid = await comparePassword(password, foundUser.password);

    if (!isValid) {
      return NextResponse.json(
        { error: "Email atau password salah" },
        { status: 401 }
      );
    }

    const sessionUser = {
      id: foundUser.id,
      name: foundUser.name,
      email: foundUser.email,
      role: foundUser.role,
    };

    await setSession(sessionUser);

    return NextResponse.json({
      success: true,
      user: sessionUser,
    });
  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json(
      { error: "Terjadi kesalahan server", detail: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
