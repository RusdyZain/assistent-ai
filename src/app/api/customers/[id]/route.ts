import { NextResponse } from "next/server";
import { z } from "zod";

import { requireBusiness, unauthorizedResponse } from "@/lib/business";
import { prisma } from "@/lib/prisma";
import { LEAD_STATUS_VALUES } from "@/types/sales";

const updateSchema = z.object({
  name: z.string().min(1).optional(),
  leadStatus: z.enum(LEAD_STATUS_VALUES).optional(),
  tags: z.array(z.string()).optional(),
  optIn: z.boolean().optional(),
  spamSuspected: z.boolean().optional(),
  spamReason: z.string().nullable().optional(),
});

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const business = await requireBusiness();
    const params = await context.params;

    const customer = await prisma.customer.findFirst({
      where: {
        id: params.id,
        businessId: business.id,
      },
      include: {
        conversations: {
          include: {
            messages: {
              orderBy: {
                createdAt: "asc",
              },
              take: 50,
            },
          },
          orderBy: {
            updatedAt: "desc",
          },
        },
        orders: {
          orderBy: {
            createdAt: "desc",
          },
        },
      },
    });

    if (!customer) {
      return NextResponse.json({ error: "Customer tidak ditemukan" }, { status: 404 });
    }

    return NextResponse.json({ data: customer });
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return unauthorizedResponse();
    }

    return NextResponse.json({ error: "Gagal mengambil customer" }, { status: 500 });
  }
}

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

    const existing = await prisma.customer.findFirst({
      where: {
        id: params.id,
        businessId: business.id,
      },
    });

    if (!existing) {
      return NextResponse.json({ error: "Customer tidak ditemukan" }, { status: 404 });
    }

    const customer = await prisma.customer.update({
      where: {
        id: params.id,
      },
      data: {
        ...parsed.data,
        ...(parsed.data.spamSuspected === false && parsed.data.spamReason === undefined
          ? { spamReason: null }
          : {}),
      },
    });

    return NextResponse.json({ ok: true, data: customer });
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return unauthorizedResponse();
    }

    return NextResponse.json({ error: "Gagal update customer" }, { status: 500 });
  }
}
