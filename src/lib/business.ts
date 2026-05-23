import "server-only";

import { NextResponse } from "next/server";

import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function getCurrentBusiness() {
  const session = await getSession();
  if (!session?.businessId) return null;

  return prisma.business.findUnique({
    where: { id: session.businessId },
  });
}

export async function requireBusiness() {
  const business = await getCurrentBusiness();
  if (!business) {
    throw new Error("UNAUTHORIZED");
  }

  return business;
}

export function unauthorizedResponse() {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}

export function badRequestResponse(message: string) {
  return NextResponse.json({ error: message }, { status: 400 });
}

export function serverErrorResponse(message = "Terjadi kesalahan server") {
  return NextResponse.json({ error: message }, { status: 500 });
}
