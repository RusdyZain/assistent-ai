import { NextResponse } from "next/server";
import { z } from "zod";

import { requireBusiness, unauthorizedResponse } from "@/lib/business";
import { prisma } from "@/lib/prisma";
import { safeSendWhatsAppMessage } from "@/lib/safe-send";

const updateSchema = z.object({
  message: z.string().min(1).optional(),
  scheduledAt: z.coerce.date().optional(),
  status: z.enum(["pending", "sent", "cancelled"]).optional(),
  sendNow: z.boolean().optional(),
});

function getBlockedStatusCode(code?: string) {
  switch (code) {
    case "NO_INBOUND_HISTORY":
      return 400;
    case "CUSTOMER_DAILY_LIMIT":
    case "BUSINESS_DAILY_LIMIT":
    case "SPAM_SUSPECTED":
    case "COOLDOWN_ACTIVE":
      return 429;
    default:
      return 400;
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

    const existing = await prisma.followUp.findFirst({
      where: {
        id: params.id,
        businessId: business.id,
      },
      include: {
        customer: true,
      },
    });

    if (!existing) {
      return NextResponse.json({ error: "Follow-up tidak ditemukan" }, { status: 404 });
    }

    let sendResult: unknown = null;

    if (parsed.data.sendNow) {
      const safeSendResult = await safeSendWhatsAppMessage({
        businessId: business.id,
        customerId: existing.customerId,
        conversationId: existing.conversationId ?? undefined,
        target: existing.customer.phone,
        message: parsed.data.message ?? existing.message,
      });

      sendResult = safeSendResult;

      if (!safeSendResult.ok) {
        return NextResponse.json(
          {
            ok: false,
            blocked: safeSendResult.blocked,
            code: safeSendResult.code,
            error: safeSendResult.reason ?? "Follow-up tidak bisa dikirim saat ini.",
            cooldownAppliedSeconds: safeSendResult.cooldownAppliedSeconds ?? 0,
          },
          { status: safeSendResult.blocked ? getBlockedStatusCode(safeSendResult.code) : 500 },
        );
      }
    }

    const followUp = await prisma.followUp.update({
      where: {
        id: params.id,
      },
      data: {
        message: parsed.data.message,
        scheduledAt: parsed.data.scheduledAt,
        status: parsed.data.sendNow ? "sent" : parsed.data.status,
      },
      include: {
        customer: true,
      },
    });

    return NextResponse.json({
      ok: true,
      data: followUp,
      sendResult,
    });
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return unauthorizedResponse();
    }

    return NextResponse.json({ error: "Gagal update follow-up" }, { status: 500 });
  }
}
