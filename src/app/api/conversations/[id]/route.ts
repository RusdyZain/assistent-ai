import { NextResponse } from "next/server";

import { requireBusiness, unauthorizedResponse } from "@/lib/business";
import { canSendMessage, getBusinessDailyOutgoingCount } from "@/lib/message-guard";
import { prisma } from "@/lib/prisma";

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const business = await requireBusiness();
    const params = await context.params;

    const conversation = await prisma.conversation.findFirst({
      where: {
        id: params.id,
        businessId: business.id,
      },
      include: {
        customer: true,
        messages: {
          orderBy: {
            createdAt: "asc",
          },
        },
        orders: {
          orderBy: {
            createdAt: "desc",
          },
        },
        followUps: {
          orderBy: {
            createdAt: "desc",
          },
        },
      },
    });

    if (!conversation) {
      return NextResponse.json({ error: "Conversation tidak ditemukan" }, { status: 404 });
    }

    const sendGuard = await canSendMessage({
      businessId: business.id,
      customerId: conversation.customerId,
      includeCooldown: true,
    });
    const businessOutgoingToday = await getBusinessDailyOutgoingCount(business.id);

    return NextResponse.json({
      data: conversation,
      sendGuard,
      safety: {
        inboundOnlyMode: business.inboundOnlyMode,
        replyCooldownSeconds: business.replyCooldownSeconds,
        perCustomerDailyLimit: business.perCustomerDailyLimit,
        dailyMessageLimit: business.dailyMessageLimit,
        businessOutgoingToday,
        businessLimitReached: businessOutgoingToday >= business.dailyMessageLimit,
      },
    });
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return unauthorizedResponse();
    }

    return NextResponse.json({ error: "Gagal mengambil detail conversation" }, { status: 500 });
  }
}
