import { NextResponse } from "next/server";
import { type FollowUpStatus } from "@prisma/client";
import { z } from "zod";

import { requireBusiness, unauthorizedResponse } from "@/lib/business";
import { prisma } from "@/lib/prisma";

const createSchema = z.object({
  customerId: z.string().min(1),
  conversationId: z.string().optional().nullable(),
  message: z.string().min(1),
  scheduledAt: z.coerce.date(),
  status: z.enum(["pending", "sent", "cancelled"]).default("pending"),
});

export async function GET(request: Request) {
  try {
    const business = await requireBusiness();
    const { searchParams } = new URL(request.url);
    const statusParam = searchParams.get("status")?.trim();
    const followUpStatuses: FollowUpStatus[] = ["pending", "sent", "cancelled"];
    const status =
      statusParam && followUpStatuses.includes(statusParam as FollowUpStatus)
        ? (statusParam as FollowUpStatus)
        : undefined;

    const followUps = await prisma.followUp.findMany({
      where: {
        businessId: business.id,
        ...(status ? { status } : {}),
      },
      include: {
        customer: true,
        conversation: true,
      },
      orderBy: [{ status: "asc" }, { scheduledAt: "asc" }],
    });

    return NextResponse.json({ data: followUps });
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return unauthorizedResponse();
    }

    return NextResponse.json({ error: "Gagal mengambil follow up" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const business = await requireBusiness();
    const body = await request.json();

    const parsed = createSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Payload follow-up tidak valid" }, { status: 400 });
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

    const existingFollowUpCount = await prisma.followUp.count({
      where: {
        businessId: business.id,
        customerId: parsed.data.customerId,
        conversationId: parsed.data.conversationId || null,
        status: {
          in: ["pending", "sent"],
        },
      },
    });

    if (existingFollowUpCount >= business.maxFollowUpCount) {
      return NextResponse.json(
        { error: `Maksimal follow-up (${business.maxFollowUpCount}) untuk lead ini sudah tercapai.` },
        { status: 400 },
      );
    }

    const followUp = await prisma.followUp.create({
      data: {
        businessId: business.id,
        customerId: parsed.data.customerId,
        conversationId: parsed.data.conversationId || null,
        message: parsed.data.message,
        scheduledAt: parsed.data.scheduledAt,
        status: parsed.data.status,
      },
      include: {
        customer: true,
      },
    });

    return NextResponse.json({ ok: true, data: followUp }, { status: 201 });
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return unauthorizedResponse();
    }

    return NextResponse.json({ error: "Gagal membuat follow up" }, { status: 500 });
  }
}
