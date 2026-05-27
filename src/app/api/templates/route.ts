import { NextResponse } from "next/server";
import { z } from "zod";

import { requireBusiness, unauthorizedResponse } from "@/lib/business";
import { prisma } from "@/lib/prisma";
import { REPLY_TEMPLATE_TYPES } from "@/lib/setup";

const templateSchema = z.object({
  type: z.enum(REPLY_TEMPLATE_TYPES),
  title: z.string().min(1),
  content: z.string().min(1),
  isActive: z.boolean().default(true),
});

export async function GET(request: Request) {
  try {
    const business = await requireBusiness();
    const { searchParams } = new URL(request.url);
    const typeParam = searchParams.get("type");

    const templates = await prisma.replyTemplate.findMany({
      where: {
        businessId: business.id,
        ...(typeParam && REPLY_TEMPLATE_TYPES.includes(typeParam as (typeof REPLY_TEMPLATE_TYPES)[number])
          ? { type: typeParam as (typeof REPLY_TEMPLATE_TYPES)[number] }
          : {}),
      },
      orderBy: {
        updatedAt: "desc",
      },
    });

    return NextResponse.json({ data: templates });
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return unauthorizedResponse();
    }

    return NextResponse.json({ error: "Gagal mengambil template balasan" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const business = await requireBusiness();
    const body = await request.json();
    const parsed = templateSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: "Payload template tidak valid" }, { status: 400 });
    }

    const template = await prisma.replyTemplate.upsert({
      where: {
        businessId_type: {
          businessId: business.id,
          type: parsed.data.type,
        },
      },
      update: {
        title: parsed.data.title,
        content: parsed.data.content,
        isActive: parsed.data.isActive,
      },
      create: {
        businessId: business.id,
        type: parsed.data.type,
        title: parsed.data.title,
        content: parsed.data.content,
        isActive: parsed.data.isActive,
      },
    });

    return NextResponse.json({ ok: true, data: template }, { status: 201 });
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return unauthorizedResponse();
    }

    return NextResponse.json({ error: "Gagal menyimpan template balasan" }, { status: 500 });
  }
}
