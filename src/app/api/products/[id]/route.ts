import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { z } from "zod";

import { requireBusiness, unauthorizedResponse } from "@/lib/business";
import { prisma } from "@/lib/prisma";

const schema = z.object({
  name: z.string().min(1).optional(),
  type: z.enum(["product", "service"]).optional(),
  description: z.string().nullable().optional(),
  price: z.coerce.number().nonnegative().optional(),
  promoPrice: z.coerce.number().nonnegative().nullable().optional(),
  benefits: z.string().nullable().optional(),
  suitableFor: z.string().nullable().optional(),
  stock: z.coerce.number().int().nonnegative().optional(),
  stockStatus: z.string().nullable().optional(),
  availability: z.string().nullable().optional(),
  duration: z.string().nullable().optional(),
  minimumOrder: z.coerce.number().int().nonnegative().nullable().optional(),
  processingTime: z.string().nullable().optional(),
  deliveryInfo: z.string().nullable().optional(),
  category: z.string().nullable().optional(),
  keywords: z.array(z.string()).optional(),
  faq: z.union([z.string(), z.record(z.string(), z.unknown()), z.array(z.unknown())]).nullable().optional(),
  imageUrl: z.string().url().nullable().optional().or(z.literal("")),
  tags: z.array(z.string()).optional(),
  isActive: z.boolean().optional(),
});

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const business = await requireBusiness();
    const params = await context.params;
    const body = await request.json();
    const parsed = schema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: "Payload tidak valid" }, { status: 400 });
    }

    const existing = await prisma.product.findFirst({
      where: { id: params.id, businessId: business.id },
    });

    if (!existing) {
      return NextResponse.json({ error: "Product tidak ditemukan" }, { status: 404 });
    }

    const product = await prisma.product.update({
      where: { id: params.id },
      data: {
        ...parsed.data,
        benefits:
          parsed.data.benefits === undefined ? undefined : parsed.data.benefits || null,
        suitableFor:
          parsed.data.suitableFor === undefined ? undefined : parsed.data.suitableFor || null,
        stockStatus:
          parsed.data.stockStatus === undefined ? undefined : parsed.data.stockStatus || null,
        availability:
          parsed.data.availability === undefined ? undefined : parsed.data.availability || null,
        duration: parsed.data.duration === undefined ? undefined : parsed.data.duration || null,
        processingTime:
          parsed.data.processingTime === undefined ? undefined : parsed.data.processingTime || null,
        deliveryInfo:
          parsed.data.deliveryInfo === undefined ? undefined : parsed.data.deliveryInfo || null,
        faq:
          parsed.data.faq === undefined
            ? undefined
            : parsed.data.faq === null
              ? Prisma.JsonNull
              : (parsed.data.faq as Prisma.InputJsonValue),
        imageUrl:
          parsed.data.imageUrl === ""
            ? null
            : parsed.data.imageUrl === undefined
              ? undefined
              : parsed.data.imageUrl,
      },
    });

    return NextResponse.json({ ok: true, data: product });
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return unauthorizedResponse();
    }

    return NextResponse.json({ error: "Gagal update product" }, { status: 500 });
  }
}

export async function DELETE(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const business = await requireBusiness();
    const params = await context.params;

    const existing = await prisma.product.findFirst({
      where: { id: params.id, businessId: business.id },
    });

    if (!existing) {
      return NextResponse.json({ error: "Product tidak ditemukan" }, { status: 404 });
    }

    await prisma.product.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return unauthorizedResponse();
    }

    return NextResponse.json({ error: "Gagal hapus product" }, { status: 500 });
  }
}
