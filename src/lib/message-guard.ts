import { addSeconds, differenceInSeconds, startOfDay } from "date-fns";
import { Prisma } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { CanSendResult } from "@/types/sales";

interface SendGuardParams {
  businessId: string;
  customerId: string;
  includeCooldown?: boolean;
  tx?: Prisma.TransactionClient;
}

function getClient(tx?: Prisma.TransactionClient) {
  return tx ?? prisma;
}

function isSameLocalDay(left: Date, right: Date) {
  return startOfDay(left).getTime() === startOfDay(right).getTime();
}

export async function resetCustomerOutgoingCounterIfNeeded(
  customerId: string,
  tx?: Prisma.TransactionClient,
) {
  const client = getClient(tx);
  const customer = await client.customer.findUnique({
    where: { id: customerId },
  });

  if (!customer) return null;

  const now = new Date();
  const needsReset = !customer.outgoingCountDate || !isSameLocalDay(customer.outgoingCountDate, now);

  if (!needsReset) return customer;

  return client.customer.update({
    where: { id: customerId },
    data: {
      outgoingCountToday: 0,
      outgoingCountDate: startOfDay(now),
    },
  });
}

export async function getBusinessDailyOutgoingCount(
  businessId: string,
  tx?: Prisma.TransactionClient,
) {
  const client = getClient(tx);
  const todayStart = startOfDay(new Date());

  return client.messageSendLog.count({
    where: {
      businessId,
      status: "sent",
      createdAt: {
        gte: todayStart,
      },
    },
  });
}

export async function canSendMessage({
  businessId,
  customerId,
  includeCooldown = true,
  tx,
}: SendGuardParams): Promise<CanSendResult> {
  const client = getClient(tx);

  const [business, customer] = await Promise.all([
    client.business.findUnique({
      where: { id: businessId },
    }),
    client.customer.findUnique({
      where: { id: customerId },
    }),
  ]);

  if (!business || !customer || customer.businessId !== businessId) {
    return {
      allowed: false,
      reason: "Customer tidak ditemukan untuk bisnis ini.",
      code: "NO_INBOUND_HISTORY",
    };
  }

  const refreshedCustomer = await resetCustomerOutgoingCounterIfNeeded(customerId, tx);
  const customerState = refreshedCustomer ?? customer;

  if (business.inboundOnlyMode) {
    const inboundCount = await client.message.count({
      where: {
        businessId,
        customerId,
        direction: "incoming",
      },
    });

    if (inboundCount <= 0) {
      return {
        allowed: false,
        reason: "Cannot send first message. Customer has not contacted this WhatsApp number yet.",
        code: "NO_INBOUND_HISTORY",
      };
    }
  }

  if (customerState.spamSuspected) {
    return {
      allowed: false,
      reason: "This customer may be spamming. Reply manually.",
      code: "SPAM_SUSPECTED",
      customerOutgoingToday: customerState.outgoingCountToday,
    };
  }

  if (customerState.outgoingCountToday >= business.perCustomerDailyLimit) {
    return {
      allowed: false,
      reason: "Daily reply limit reached for this customer.",
      code: "CUSTOMER_DAILY_LIMIT",
      customerOutgoingToday: customerState.outgoingCountToday,
    };
  }

  const businessOutgoingToday = await getBusinessDailyOutgoingCount(businessId, tx);
  if (businessOutgoingToday >= business.dailyMessageLimit) {
    return {
      allowed: false,
      reason: "Business daily message limit reached.",
      code: "BUSINESS_DAILY_LIMIT",
      businessOutgoingToday,
    };
  }

  if (includeCooldown) {
    const lastSentLog = await client.messageSendLog.findFirst({
      where: {
        businessId,
        status: "sent",
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    if (lastSentLog) {
      const availableAt = addSeconds(lastSentLog.createdAt, business.replyCooldownSeconds);
      const now = new Date();

      if (availableAt.getTime() > now.getTime()) {
        const remainingSeconds = Math.max(1, differenceInSeconds(availableAt, now));
        return {
          allowed: false,
          reason: `Cooldown aktif. Coba lagi dalam ${remainingSeconds} detik.`,
          code: "COOLDOWN_ACTIVE",
          cooldownSecondsRemaining: remainingSeconds,
          customerOutgoingToday: customerState.outgoingCountToday,
          businessOutgoingToday,
        };
      }
    }
  }

  return {
    allowed: true,
    customerOutgoingToday: customerState.outgoingCountToday,
    businessOutgoingToday,
  };
}
