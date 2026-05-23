import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { z } from "zod";

import { requireBusiness, unauthorizedResponse } from "@/lib/business";
import { prisma } from "@/lib/prisma";

const updateSchema = z.object({
  status: z
    .enum(["draft", "confirmed", "waiting_payment", "paid", "cancelled", "completed"])
    .optional(),
  items: z.array(z.record(z.string(), z.unknown())).optional(),
  totalEstimate: z.coerce.number().nonnegative().optional().nullable(),
  notes: z.string().optional().nullable(),
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
      return NextResponse.json({ error: "Payload tidak valid" }, { status: 400 });
    }

    const existing = await prisma.order.findFirst({
      where: {
        id: params.id,
        businessId: business.id,
      },
    });

    if (!existing) {
      return NextResponse.json({ error: "Order tidak ditemukan" }, { status: 404 });
    }

    const updateData: {
      status?: "draft" | "confirmed" | "waiting_payment" | "paid" | "cancelled" | "completed";
      items?: Prisma.InputJsonValue;
      totalEstimate?: number | null;
      notes?: string | null;
    } = {
      status: parsed.data.status,
      totalEstimate: parsed.data.totalEstimate,
      notes: parsed.data.notes,
    };

    if (parsed.data.items !== undefined) {
      updateData.items = parsed.data.items as Prisma.InputJsonValue;
    }

    const order = await prisma.order.update({
      where: {
        id: params.id,
      },
      data: updateData,
      include: {
        customer: true,
      },
    });

    return NextResponse.json({ ok: true, data: order });
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return unauthorizedResponse();
    }

    return NextResponse.json({ error: "Gagal update order" }, { status: 500 });
  }
}
