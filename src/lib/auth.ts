import "server-only";

import bcrypt from "bcryptjs";
import { SignJWT, jwtVerify, type JWTPayload } from "jose";
import { cookies } from "next/headers";

import { SESSION_COOKIE } from "@/lib/constants";
import { prisma } from "@/lib/prisma";

const SESSION_TTL_SECONDS = 60 * 60 * 24 * 7;

interface SessionData extends JWTPayload {
  businessId: string;
  email: string;
}

function getJwtSecret() {
  const secret = process.env.AUTH_SECRET;
  if (!secret) {
    throw new Error("AUTH_SECRET belum di-set");
  }

  return new TextEncoder().encode(secret);
}

export async function createSessionToken(payload: {
  businessId: string;
  email: string;
}) {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_TTL_SECONDS}s`)
    .sign(getJwtSecret());
}

export async function verifySessionToken(token: string) {
  try {
    const result = await jwtVerify<SessionData>(token, getJwtSecret());
    return result.payload;
  } catch {
    return null;
  }
}

export async function getSession() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;

  if (!token) return null;

  return verifySessionToken(token);
}

export async function setSessionCookie(token: string) {
  const cookieStore = await cookies();
  cookieStore.set({
    name: SESSION_COOKIE,
    value: token,
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_TTL_SECONDS,
  });
}

export async function clearSessionCookie() {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE);
}

export async function authenticate(email: string, password: string) {
  const business = await prisma.business.findUnique({
    where: { email: email.toLowerCase() },
  });

  if (!business) return null;

  const passwordValid = await bcrypt.compare(password, business.passwordHash);
  if (!passwordValid) return null;

  return business;
}
