import { NextResponse } from "next/server";
import { z } from "zod";

import { requireBusiness, unauthorizedResponse } from "@/lib/business";
import { prisma } from "@/lib/prisma";
import { KNOWLEDGE_CATEGORIES } from "@/lib/setup";

const knowledgeSchema = z.object({
  title: z.string().min(1),
  category: z.enum(KNOWLEDGE_CATEGORIES),
  content: z.string().min(1),
  isActive: z.boolean().default(true),
});

export async function GET(request: Request) {
  try {
    const business = await requireBusiness();
    const { searchParams } = new URL(request.url);
    const category = searchParams.get("category");
    const q = searchParams.get("q")?.trim();

    const items = await prisma.knowledgeBaseItem.findMany({
      where: {
        businessId: business.id,
        ...(category && KNOWLEDGE_CATEGORIES.includes(category as (typeof KNOWLEDGE_CATEGORIES)[number])
          ? { category: category as (typeof KNOWLEDGE_CATEGORIES)[number] }
          : {}),
        ...(q
          ? {
              OR: [
                { title: { contains: q, mode: "insensitive" } },
                { content: { contains: q, mode: "insensitive" } },
              ],
            }
          : {}),
      },
      orderBy: {
        updatedAt: "desc",
      },
    });

    return NextResponse.json({ data: items });
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return unauthorizedResponse();
    }

    return NextResponse.json({ error: "Gagal mengambil knowledge base" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const business = await requireBusiness();
    const body = await request.json();
    const parsed = knowledgeSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: "Payload knowledge base tidak valid" }, { status: 400 });
    }

    const item = await prisma.knowledgeBaseItem.create({
      data: {
        businessId: business.id,
        title: parsed.data.title,
        category: parsed.data.category,
        content: parsed.data.content,
        isActive: parsed.data.isActive,
      },
    });

    return NextResponse.json({ ok: true, data: item }, { status: 201 });
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return unauthorizedResponse();
    }

    return NextResponse.json({ error: "Gagal menyimpan knowledge base" }, { status: 500 });
  }
}
