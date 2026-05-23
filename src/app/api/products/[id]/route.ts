import { NextResponse } from "next/server";
import { z } from "zod";

import { requireBusiness, unauthorizedResponse } from "@/lib/business";
import { prisma } from "@/lib/prisma";

const schema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().nullable().optional(),
  price: z.coerce.number().nonnegative().optional(),
  stock: z.coerce.number().int().nonnegative().optional(),
  category: z.string().nullable().optional(),
  keywords: z.array(z.string()).optional(),
  imageUrl: z.string().url().nullable().optional().or(z.literal("")),
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
