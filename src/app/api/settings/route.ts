import { NextResponse } from "next/server";
import { z } from "zod";

import { requireBusiness, unauthorizedResponse } from "@/lib/business";
import { getBusinessDailyOutgoingCount } from "@/lib/message-guard";
import { prisma } from "@/lib/prisma";

const schema = z.object({
  name: z.string().min(1).optional(),
  ownerName: z.string().min(1).optional(),
  phone: z.string().min(6).optional(),
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
        whatsappProvider: process.env.WHATSAPP_PROVIDER ?? "waha",
        wahaBaseUrl: process.env.WAHA_BASE_URL ?? "http://localhost:3000",
        wahaSession: process.env.WAHA_SESSION ?? "default",
        wahaApiKeyConfigured: Boolean(process.env.WAHA_API_KEY?.trim()),
        wahaWebhookSecretConfigured: Boolean(process.env.WAHA_WEBHOOK_SECRET?.trim()),
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

    const updated = await prisma.business.update({
      where: {
        id: business.id,
      },
      data: {
        ...parsed.data,
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
