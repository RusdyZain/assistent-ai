import { NextResponse } from "next/server";
import { Prisma, type OrderStatus } from "@prisma/client";
import { z } from "zod";

import { requireBusiness, unauthorizedResponse } from "@/lib/business";
import { prisma } from "@/lib/prisma";

const orderCreateSchema = z.object({
  customerId: z.string().min(1),
  conversationId: z.string().optional().nullable(),
  status: z
    .enum(["draft", "confirmed", "waiting_payment", "paid", "cancelled", "completed"])
    .default("draft"),
  items: z.array(z.record(z.string(), z.unknown())).default([]),
  totalEstimate: z.coerce.number().nonnegative().optional().nullable(),
  notes: z.string().optional().nullable(),
});

export async function GET(request: Request) {
  try {
    const business = await requireBusiness();
    const { searchParams } = new URL(request.url);
    const statusParam = searchParams.get("status")?.trim();
    const orderStatuses: OrderStatus[] = [
      "draft",
      "confirmed",
      "waiting_payment",
      "paid",
      "cancelled",
      "completed",
    ];
    const status =
      statusParam && orderStatuses.includes(statusParam as OrderStatus)
        ? (statusParam as OrderStatus)
        : undefined;

    const orders = await prisma.order.findMany({
      where: {
        businessId: business.id,
        ...(status ? { status } : {}),
      },
      include: {
        customer: true,
        conversation: true,
      },
      orderBy: {
        updatedAt: "desc",
      },
    });

    return NextResponse.json({ data: orders });
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return unauthorizedResponse();
    }

    return NextResponse.json({ error: "Gagal mengambil orders" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const business = await requireBusiness();
    const body = await request.json();
    const parsed = orderCreateSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: "Payload order tidak valid" }, { status: 400 });
    }

    const customer = await prisma.customer.findFirst({
      where: {
        id: parsed.data.customerId,
        businessId: business.id,
      },
    });

    if (!customer) {
      return NextResponse.json({ error: "Customer tidak ditemukan" }, { status: 404 });
    }

    const order = await prisma.order.create({
      data: {
        businessId: business.id,
        customerId: parsed.data.customerId,
        conversationId: parsed.data.conversationId || null,
        status: parsed.data.status,
        items: parsed.data.items as Prisma.InputJsonValue,
        totalEstimate: parsed.data.totalEstimate,
        notes: parsed.data.notes || null,
      },
      include: {
        customer: true,
        conversation: true,
      },
    });

    return NextResponse.json({ ok: true, data: order }, { status: 201 });
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return unauthorizedResponse();
    }

    return NextResponse.json({ error: "Gagal membuat order" }, { status: 500 });
  }
}
