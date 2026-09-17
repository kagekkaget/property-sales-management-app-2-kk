import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import bcryptjs from "bcryptjs";

const SECRET_KEY = new TextEncoder().encode(
  process.env.NEXTAUTH_SECRET || "kavlingo-palembang-secret-key"
);

export interface UserSession {
  id: number;
  name: string;
  email: string;
  role: "owner" | "manager" | "staff";
}

export async function hashPassword(password: string): Promise<string> {
  return bcryptjs.hash(password, 12);
}

export async function comparePassword(
  password: string,
  hash: string
): Promise<boolean> {
  return bcryptjs.compare(password, hash);
}

export async function createToken(user: UserSession): Promise<string> {
  return new SignJWT({ ...user })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(SECRET_KEY);
}

export async function verifyToken(token: string): Promise<UserSession | null> {
  try {
    const { payload } = await jwtVerify(token, SECRET_KEY);
    return payload as unknown as UserSession;
  } catch {
    return null;
  }
}

export async function getSession(): Promise<UserSession | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get("kavlingo_token")?.value;
  if (!token) return null;
  return verifyToken(token);
}

export async function setSession(user: UserSession): Promise<void> {
  const token = await createToken(user);
  const cookieStore = await cookies();
  cookieStore.set("kavlingo_token", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 7, // 7 days
    path: "/",
  });
}

export async function clearSession(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete("kavlingo_token");
}
