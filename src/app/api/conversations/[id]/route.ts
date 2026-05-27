import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";

import { requireBusiness, unauthorizedResponse } from "@/lib/business";
import { canSendMessage, getBusinessDailyOutgoingCount } from "@/lib/message-guard";
import { prisma } from "@/lib/prisma";

async function syncCustomerMessageTimestamps({
  tx,
  businessId,
  customerId,
}: {
  tx: Prisma.TransactionClient;
  businessId: string;
  customerId: string;
}) {
  const [lastMessage, lastIncoming, lastOutgoing] = await Promise.all([
    tx.message.findFirst({
      where: {
        businessId,
        customerId,
      },
      orderBy: {
        createdAt: "desc",
      },
      select: {
        createdAt: true,
      },
    }),
    tx.message.findFirst({
      where: {
        businessId,
        customerId,
        direction: "incoming",
      },
      orderBy: {
        createdAt: "desc",
      },
      select: {
        createdAt: true,
      },
    }),
    tx.message.findFirst({
      where: {
        businessId,
        customerId,
        direction: "outgoing",
      },
      orderBy: {
        createdAt: "desc",
      },
      select: {
        createdAt: true,
      },
    }),
  ]);

  await tx.customer.update({
    where: {
      id: customerId,
    },
    data: {
      lastMessageAt: lastMessage?.createdAt ?? null,
      lastIncomingAt: lastIncoming?.createdAt ?? null,
      lastOutgoingAt: lastOutgoing?.createdAt ?? null,
    },
  });
}

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
        warmLeadFollowUpHours: business.warmLeadFollowUpHours,
        hotLeadFollowUpHours: business.hotLeadFollowUpHours,
        closingPriorityFollowUpHours: business.closingPriorityFollowUpHours,
        waitingPaymentFollowUpHours: business.waitingPaymentFollowUpHours,
        maxFollowUpCount: business.maxFollowUpCount,
        markLostAfterDays: business.markLostAfterDays,
      },
    });
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return unauthorizedResponse();
    }

    return NextResponse.json({ error: "Gagal mengambil detail conversation" }, { status: 500 });
  }
}

export async function DELETE(
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
      select: {
        id: true,
        customerId: true,
      },
    });

    if (!conversation) {
      return NextResponse.json({ error: "Conversation tidak ditemukan" }, { status: 404 });
    }

    const result = await prisma.$transaction(async (tx) => {
      const deletedMessages = await tx.message.deleteMany({
        where: {
          businessId: business.id,
          conversationId: conversation.id,
        },
      });

      await tx.conversation.update({
        where: {
          id: conversation.id,
        },
        data: {
          summary: null,
          lastIntent: null,
          lastMessageAt: null,
          status: "open",
        },
      });

      await syncCustomerMessageTimestamps({
        tx,
        businessId: business.id,
        customerId: conversation.customerId,
      });

      return {
        deletedMessages: deletedMessages.count,
      };
    });

    return NextResponse.json({
      ok: true,
      ...result,
    });
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return unauthorizedResponse();
    }

    return NextResponse.json({ error: "Gagal menghapus isi chat" }, { status: 500 });
  }
}
