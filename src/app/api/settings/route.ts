import { NextResponse } from "next/server";
import { z } from "zod";

import { requireBusiness, unauthorizedResponse } from "@/lib/business";
import { normalizeFonnteToken } from "@/lib/fonnte";
import { getBusinessDailyOutgoingCount } from "@/lib/message-guard";
import { prisma } from "@/lib/prisma";

const schema = z.object({
  name: z.string().min(1).optional(),
  ownerName: z.string().min(1).optional(),
  phone: z.string().min(6).optional(),
  fonnteToken: z.string().optional().nullable(),
  inboundOnlyMode: z.boolean().optional(),
  replyCooldownSeconds: z.coerce.number().int().min(1).max(60).optional(),
  perCustomerDailyLimit: z.coerce.number().int().min(1).max(500).optional(),
  dailyMessageLimit: z.coerce.number().int().min(1).max(10000).optional(),
});

export async function GET() {
  try {
    const business = await requireBusiness();
    const businessOutgoingToday = await getBusinessDailyOutgoingCount(business.id);
    const businessLimitReached = businessOutgoingToday >= business.dailyMessageLimit;

    return NextResponse.json({
      data: {
        id: business.id,
        name: business.name,
        ownerName: business.ownerName,
        phone: business.phone,
        email: business.email,
        fonnteToken: business.fonnteToken,
        inboundOnlyMode: business.inboundOnlyMode,
        replyCooldownSeconds: business.replyCooldownSeconds,
        perCustomerDailyLimit: business.perCustomerDailyLimit,
        dailyMessageLimit: business.dailyMessageLimit,
        businessOutgoingToday,
        businessLimitReached,
        setupCompleted: business.setupCompleted,
        setupStep: business.setupStep,
        whatsappNumber: business.whatsappNumber ?? business.phone,
      },
    });
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return unauthorizedResponse();
    }

    return NextResponse.json({ error: "Gagal mengambil settings" }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const business = await requireBusiness();
    const body = await request.json();
    const parsed = schema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: "Payload settings tidak valid" }, { status: 400 });
    }

    const normalizedFonnteToken =
      parsed.data.fonnteToken === undefined
        ? undefined
        : normalizeFonnteToken(parsed.data.fonnteToken);

    const updated = await prisma.business.update({
      where: {
        id: business.id,
      },
      data: {
        ...parsed.data,
        fonnteToken: normalizedFonnteToken,
      },
    });

    return NextResponse.json({ ok: true, data: updated });
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return unauthorizedResponse();
    }

    return NextResponse.json({ error: "Gagal update settings" }, { status: 500 });
  }
}
