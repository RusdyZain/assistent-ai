import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { z } from "zod";

import { requireBusiness, unauthorizedResponse } from "@/lib/business";
import { prisma } from "@/lib/prisma";

const productSchema = z.object({
  name: z.string().min(1),
  type: z.enum(["product", "service"]).default("product"),
  description: z.string().optional().nullable(),
  price: z.coerce.number().nonnegative(),
  promoPrice: z.coerce.number().nonnegative().optional().nullable(),
  benefits: z.string().optional().nullable(),
  suitableFor: z.string().optional().nullable(),
  stock: z.coerce.number().int().nonnegative().default(0),
  stockStatus: z.string().optional().nullable(),
  availability: z.string().optional().nullable(),
  duration: z.string().optional().nullable(),
  minimumOrder: z.coerce.number().int().nonnegative().optional().nullable(),
  processingTime: z.string().optional().nullable(),
  deliveryInfo: z.string().optional().nullable(),
  category: z.string().optional().nullable(),
  keywords: z.array(z.string()).optional().default([]),
  faq: z.union([z.string(), z.record(z.string(), z.unknown()), z.array(z.unknown())]).optional().nullable(),
  imageUrl: z.string().url().optional().nullable().or(z.literal("")),
  tags: z.array(z.string()).optional().default([]),
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
                { tags: { hasSome: [q] } },
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
        type: parsed.data.type,
        description: parsed.data.description || null,
        price: parsed.data.price,
        promoPrice: parsed.data.promoPrice ?? null,
        benefits: parsed.data.benefits || null,
        suitableFor: parsed.data.suitableFor || null,
        stock: parsed.data.stock,
        stockStatus: parsed.data.stockStatus || null,
        availability: parsed.data.availability || null,
        duration: parsed.data.duration || null,
        minimumOrder: parsed.data.minimumOrder ?? null,
        processingTime: parsed.data.processingTime || null,
        deliveryInfo: parsed.data.deliveryInfo || null,
        category: parsed.data.category || null,
        keywords: parsed.data.keywords,
        faq:
          parsed.data.faq === undefined
            ? undefined
            : parsed.data.faq === null
              ? Prisma.JsonNull
              : (parsed.data.faq as Prisma.InputJsonValue),
        imageUrl: parsed.data.imageUrl || null,
        tags: parsed.data.tags,
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
