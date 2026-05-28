import { startOfDay } from "date-fns";
import { Prisma } from "@prisma/client";

import {
  canSendMessage,
  getBusinessDailyOutgoingCount,
  resetCustomerOutgoingCounterIfNeeded,
} from "@/lib/message-guard";
import { prisma } from "@/lib/prisma";
import { getWhatsAppProvider } from "@/lib/whatsapp";
import { SafeSendParams, SafeSendResult } from "@/types/sales";

const sendQueueByBusiness = new Map<string, Promise<void>>();

function wait(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function withBusinessQueue<T>(businessId: string, task: () => Promise<T>): Promise<T> {
  const previous = sendQueueByBusiness.get(businessId) ?? Promise.resolve();

  let release!: () => void;
  const current = new Promise<void>((resolve) => {
    release = resolve;
  });

  const queueTail = previous.then(() => current);
  sendQueueByBusiness.set(businessId, queueTail);

  await previous;

  try {
    return await task();
  } finally {
    release();
    if (sendQueueByBusiness.get(businessId) === queueTail) {
      sendQueueByBusiness.delete(businessId);
    }
  }
}

export async function safeSendWhatsAppMessage({
  businessId,
  customerId,
  conversationId,
  target,
  message,
  inboxId,
}: SafeSendParams): Promise<SafeSendResult> {
  return withBusinessQueue(businessId, async () => {
    const [business, customer] = await Promise.all([
      prisma.business.findUnique({ where: { id: businessId } }),
      prisma.customer.findUnique({ where: { id: customerId } }),
    ]);

    if (!business || !customer || customer.businessId !== businessId) {
      return {
        ok: false,
        blocked: true,
        code: "NO_INBOUND_HISTORY",
        reason: "Customer tidak ditemukan untuk bisnis ini.",
      };
    }

    const existingConversation =
      (conversationId &&
        (await prisma.conversation.findFirst({
          where: {
            id: conversationId,
            businessId,
          },
        }))) ||
      (await prisma.conversation.findFirst({
        where: {
          businessId,
          customerId,
          status: {
            in: ["open", "rate_limited"],
          },
        },
        orderBy: {
          updatedAt: "desc",
        },
      }));

    const sendLog = await prisma.messageSendLog.create({
      data: {
        businessId,
        customerId,
        conversationId: existingConversation?.id,
        message,
        status: "pending",
      },
    });

    let cooldownAppliedSeconds = 0;
    let guard = await canSendMessage({ businessId, customerId, includeCooldown: true });

    while (!guard.allowed && guard.code === "COOLDOWN_ACTIVE") {
      const seconds = guard.cooldownSecondsRemaining ?? business.replyCooldownSeconds;
      cooldownAppliedSeconds += seconds;
      await wait(seconds * 1000);
      guard = await canSendMessage({ businessId, customerId, includeCooldown: true });
    }

    if (!guard.allowed) {
      if (guard.code === "CUSTOMER_DAILY_LIMIT") {
        const rateLimitedConversation =
          existingConversation ??
          (await prisma.conversation.create({
            data: {
              businessId,
              customerId,
              status: "rate_limited",
              lastMessageAt: new Date(),
            },
          }));

        await prisma.conversation.update({
          where: { id: rateLimitedConversation.id },
          data: {
            status: "rate_limited",
          },
        });

        await prisma.messageSendLog.update({
          where: { id: sendLog.id },
          data: {
            conversationId: rateLimitedConversation.id,
          },
        });
      }

      await prisma.messageSendLog.update({
        where: { id: sendLog.id },
        data: {
          status: "blocked",
          blockedReason: guard.reason,
        },
      });

      return {
        ok: false,
        blocked: true,
        code: guard.code,
        reason: guard.reason,
        customerOutgoingToday: guard.customerOutgoingToday,
        businessOutgoingToday: guard.businessOutgoingToday,
      };
    }

    const provider = getWhatsAppProvider();
    const sendResult = await provider.sendText({
      target,
      text: message,
    });

    if (!sendResult.ok) {
      await prisma.messageSendLog.update({
        where: { id: sendLog.id },
        data: {
          status: "failed",
          blockedReason: sendResult.error ?? "Provider WhatsApp mengembalikan error",
          fonnteResponse: sendResult.payload as Prisma.InputJsonValue,
        },
      });

      return {
        ok: false,
        reason: sendResult.error ?? "Gagal mengirim pesan WhatsApp",
        sendResult,
        cooldownAppliedSeconds,
      };
    }

    const now = new Date();
    const activeConversation =
      existingConversation ??
      (await prisma.conversation.create({
        data: {
          businessId,
          customerId,
          status: "open",
          lastMessageAt: now,
        },
      }));

    const updatedCustomer = await prisma.$transaction(async (tx) => {
      const refreshedCustomer = await resetCustomerOutgoingCounterIfNeeded(customerId, tx);
      const currentCount = refreshedCustomer?.outgoingCountToday ?? 0;

      await tx.message.create({
        data: {
          businessId,
          customerId,
          conversationId: activeConversation.id,
          direction: "outgoing",
          message,
          rawPayload: sendResult.payload as Prisma.InputJsonValue,
          fonnteInboxId: inboxId ?? sendResult.messageId ?? null,
          aiProcessed: true,
        },
      });

      await tx.conversation.update({
        where: { id: activeConversation.id },
        data: {
          status: "open",
          lastMessageAt: now,
        },
      });

      const customerUpdate = await tx.customer.update({
        where: { id: customerId },
        data: {
          lastMessageAt: now,
          lastOutgoingAt: now,
          outgoingCountDate: startOfDay(now),
          outgoingCountToday: currentCount + 1,
        },
      });

      await tx.messageSendLog.update({
        where: { id: sendLog.id },
        data: {
          conversationId: activeConversation.id,
          status: "sent",
          blockedReason: null,
          fonnteResponse: sendResult.payload as Prisma.InputJsonValue,
        },
      });

      return customerUpdate;
    });

    const businessOutgoingToday = await getBusinessDailyOutgoingCount(businessId);

    return {
      ok: true,
      sendResult,
      cooldownAppliedSeconds,
      customerOutgoingToday: updatedCustomer.outgoingCountToday,
      businessOutgoingToday,
    };
  });
}
