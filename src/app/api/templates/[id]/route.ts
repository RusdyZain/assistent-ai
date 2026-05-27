import { NextResponse } from "next/server";
import { z } from "zod";

import { requireBusiness, unauthorizedResponse } from "@/lib/business";
import { prisma } from "@/lib/prisma";
import { REPLY_TEMPLATE_TYPES } from "@/lib/setup";

const updateSchema = z.object({
  type: z.enum(REPLY_TEMPLATE_TYPES).optional(),
  title: z.string().min(1).optional(),
  content: z.string().min(1).optional(),
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
    const parsed = updateSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: "Payload template tidak valid" }, { status: 400 });
    }

    const existing = await prisma.replyTemplate.findFirst({
      where: {
        id: params.id,
        businessId: business.id,
      },
    });

    if (!existing) {
      return NextResponse.json({ error: "Template tidak ditemukan" }, { status: 404 });
    }

    const template = await prisma.replyTemplate.update({
      where: {
        id: params.id,
      },
      data: parsed.data,
    });

    return NextResponse.json({ ok: true, data: template });
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return unauthorizedResponse();
    }

    return NextResponse.json({ error: "Gagal update template balasan" }, { status: 500 });
  }
}

export async function DELETE(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const business = await requireBusiness();
    const params = await context.params;

    const existing = await prisma.replyTemplate.findFirst({
      where: {
        id: params.id,
        businessId: business.id,
      },
    });

    if (!existing) {
      return NextResponse.json({ error: "Template tidak ditemukan" }, { status: 404 });
    }

    await prisma.replyTemplate.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return unauthorizedResponse();
    }

    return NextResponse.json({ error: "Gagal hapus template balasan" }, { status: 500 });
  }
}
