import { NextResponse } from "next/server";
import { z } from "zod";

import { requireBusiness, unauthorizedResponse } from "@/lib/business";
import { safeSendWhatsAppMessage } from "@/lib/safe-send";
import { prisma } from "@/lib/prisma";
import { normalizePhone } from "@/lib/utils";

const schema = z.object({
  target: z.string().min(6),
  message: z.string().min(1),
  customerId: z.string().optional(),
  conversationId: z.string().optional(),
  inboxId: z.string().optional(),
});

function getBlockedStatusCode(code?: string) {
  switch (code) {
    case "NO_INBOUND_HISTORY":
      return 400;
    case "CUSTOMER_DAILY_LIMIT":
    case "BUSINESS_DAILY_LIMIT":
    case "SPAM_SUSPECTED":
      return 429;
    case "COOLDOWN_ACTIVE":
      return 429;
    default:
      return 400;
  }
}

export async function POST(request: Request) {
  try {
    const business = await requireBusiness();

    const body = await request.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Payload tidak valid" }, { status: 400 });
    }

    const target = normalizePhone(parsed.data.target);

    const customer = parsed.data.customerId
      ? await prisma.customer.findFirst({
          where: {
            id: parsed.data.customerId,
            businessId: business.id,
          },
        })
      : await prisma.customer.upsert({
          where: {
            businessId_phone: {
              businessId: business.id,
              phone: target,
            },
          },
          update: {},
          create: {
            businessId: business.id,
            phone: target,
            leadStatus: "cold",
            outgoingCountDate: new Date(),
          },
        });

    if (!customer) {
      return NextResponse.json({ error: "Customer tidak ditemukan" }, { status: 404 });
    }

    const safeSendResult = await safeSendWhatsAppMessage({
      businessId: business.id,
      customerId: customer.id,
      conversationId: parsed.data.conversationId,
      target,
      message: parsed.data.message,
      inboxId: parsed.data.inboxId,
    });

    if (!safeSendResult.ok) {
      return NextResponse.json(
        {
          ok: false,
          blocked: safeSendResult.blocked,
          code: safeSendResult.code,
          error: safeSendResult.reason ?? "Pesan diblokir oleh sistem keamanan.",
          cooldownAppliedSeconds: safeSendResult.cooldownAppliedSeconds ?? 0,
          customerOutgoingToday: safeSendResult.customerOutgoingToday,
          businessOutgoingToday: safeSendResult.businessOutgoingToday,
        },
        { status: safeSendResult.blocked ? getBlockedStatusCode(safeSendResult.code) : 500 },
      );
    }

    return NextResponse.json({
      ok: true,
      sendResult: safeSendResult.sendResult,
      warning:
        safeSendResult.cooldownAppliedSeconds && safeSendResult.cooldownAppliedSeconds > 0
          ? `Cooldown ${safeSendResult.cooldownAppliedSeconds} detik diterapkan sebelum kirim.`
          : null,
      cooldownAppliedSeconds: safeSendResult.cooldownAppliedSeconds ?? 0,
      customerOutgoingToday: safeSendResult.customerOutgoingToday,
      businessOutgoingToday: safeSendResult.businessOutgoingToday,
    });
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return unauthorizedResponse();
    }

    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Gagal kirim pesan" },
      { status: 500 },
    );
  }
}
