import { NextResponse } from "next/server";
import { z } from "zod";

import { requireBusiness, unauthorizedResponse } from "@/lib/business";
import { prisma } from "@/lib/prisma";

const productSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional().nullable(),
  price: z.coerce.number().nonnegative(),
  stock: z.coerce.number().int().nonnegative().default(0),
  category: z.string().optional().nullable(),
  keywords: z.array(z.string()).optional().default([]),
  imageUrl: z.string().url().optional().nullable().or(z.literal("")),
  isActive: z.boolean().default(true),
});

export async function GET(request: Request) {
  try {
    const business = await requireBusiness();
    const { searchParams } = new URL(request.url);

    const q = searchParams.get("q")?.trim();

    const products = await prisma.product.findMany({
      where: {
        businessId: business.id,
        ...(q
          ? {
              OR: [
                { name: { contains: q, mode: "insensitive" } },
                { description: { contains: q, mode: "insensitive" } },
                { category: { contains: q, mode: "insensitive" } },
              ],
            }
          : {}),
      },
      orderBy: {
        updatedAt: "desc",
      },
    });

    return NextResponse.json({ data: products });
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return unauthorizedResponse();
    }

    return NextResponse.json({ error: "Gagal mengambil products" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const business = await requireBusiness();
    const body = await request.json();
    const parsed = productSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: "Payload product tidak valid" }, { status: 400 });
    }

    const product = await prisma.product.create({
      data: {
        businessId: business.id,
        name: parsed.data.name,
        description: parsed.data.description || null,
        price: parsed.data.price,
        stock: parsed.data.stock,
        category: parsed.data.category || null,
        keywords: parsed.data.keywords,
        imageUrl: parsed.data.imageUrl || null,
        isActive: parsed.data.isActive,
      },
    });

    return NextResponse.json({ ok: true, data: product }, { status: 201 });
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return unauthorizedResponse();
    }

    return NextResponse.json({ error: "Gagal membuat product" }, { status: 500 });
  }
}
