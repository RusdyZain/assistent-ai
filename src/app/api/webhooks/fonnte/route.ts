import { after, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { subSeconds } from "date-fns";

import { extractFonnteMessage } from "@/lib/fonnte-webhook";
import { normalizeFonnteToken } from "@/lib/fonnte";
import { runAIAnalysisForConversation } from "@/lib/pipeline";
import { prisma } from "@/lib/prisma";
import { safeSendWhatsAppMessage } from "@/lib/safe-send";
import { normalizePhone } from "@/lib/utils";

const AUTO_REPLY_ALLOWED_ACTIONS = new Set([
  "reply_now",
  "ask_more_info",
  "create_order",
  "handle_complaint",
]);

function isAutoReplyEnabled() {
  const rawValue = process.env.AUTO_REPLY_ENABLED;
  if (!rawValue) return true;

  const normalized = rawValue.trim().toLowerCase();
  return !["0", "false", "no", "off"].includes(normalized);
}

async function resolveBusinessByWebhook(payload: Record<string, unknown>) {
  const tokenFromPayload = normalizeFonnteToken(
    (typeof payload.token === "string" && payload.token) ||
      (typeof payload.device === "string" && payload.device) ||
      null,
  );

  if (tokenFromPayload) {
    const business = await prisma.business.findFirst({
      where: {
        fonnteToken: tokenFromPayload,
      },
    });

    if (business) return business;
  }

  const deviceFromPayload =
    (typeof payload.device === "string" && payload.device.trim()) ||
    (typeof payload.sender === "string" && payload.sender.trim()) ||
    null;

  if (deviceFromPayload) {
    const normalizedDevice = normalizePhone(deviceFromPayload);
    const businessByDevice = await prisma.business.findFirst({
      where: {
        OR: [
          { whatsappNumber: normalizedDevice },
          { phone: normalizedDevice },
        ],
      },
    });

    if (businessByDevice) return businessByDevice;
  }

  return prisma.business.findFirst({
    orderBy: {
      createdAt: "asc",
    },
  });
}

async function parseWebhookPayload(request: Request) {
  const contentType = request.headers.get("content-type") ?? "";

  if (contentType.includes("application/json")) {
    return (await request.json()) as Record<string, unknown>;
  }

  if (
    contentType.includes("application/x-www-form-urlencoded") ||
    contentType.includes("multipart/form-data")
  ) {
    const formData = await request.formData();
    return Object.fromEntries(formData.entries()) as Record<string, unknown>;
  }

  const rawText = await request.text();
  if (!rawText) return {};

  try {
    return JSON.parse(rawText) as Record<string, unknown>;
  } catch {
    return Object.fromEntries(new URLSearchParams(rawText).entries()) as Record<string, unknown>;
  }
}

export async function POST(request: Request) {
  let payload: Record<string, unknown>;

  try {
    payload = await parseWebhookPayload(request);
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON" }, { status: 200 });
  }

  const business = await resolveBusinessByWebhook(payload);
  if (!business) {
    return NextResponse.json({ ok: true, ignored: "business_not_found" });
  }

  await prisma.webhookEvent.create({
    data: {
      businessId: business.id,
      payload: payload as Prisma.InputJsonValue,
      source: "fonnte",
    },
  });

  const normalized = extractFonnteMessage(payload);
  if (!normalized) {
    return NextResponse.json({ ok: true, ignored: "unsupported_payload" });
  }

  const phone = normalizePhone(normalized.phone);
  const now = new Date();

  const [customer, conversation, incomingMessage] = await prisma.$transaction(async (tx) => {
    const customerRecord = await tx.customer.upsert({
      where: {
        businessId_phone: {
          businessId: business.id,
          phone,
        },
      },
      update: {
        name: normalized.senderName ?? undefined,
        lastIncomingAt: now,
        lastMessageAt: now,
      },
      create: {
        businessId: business.id,
        phone,
        name: normalized.senderName,
        leadStatus: "cold",
        lastIncomingAt: now,
        lastMessageAt: now,
      },
    });

    let conversation = await tx.conversation.findFirst({
      where: {
        businessId: business.id,
        customerId: customerRecord.id,
        status: {
          in: ["open", "rate_limited"],
        },
      },
      orderBy: {
        updatedAt: "desc",
      },
    });

    if (!conversation) {
      conversation = await tx.conversation.create({
        data: {
          businessId: business.id,
          customerId: customerRecord.id,
          status: "open",
          lastMessageAt: now,
        },
      });
    }

    const incomingMessageRecord = await tx.message.create({
      data: {
        businessId: business.id,
        customerId: customerRecord.id,
        conversationId: conversation.id,
        direction: "incoming",
        message: normalized.messageText,
        rawPayload: payload as Prisma.InputJsonValue,
        fonnteInboxId: normalized.inboxId,
      },
    });

    await tx.conversation.update({
      where: { id: conversation.id },
      data: {
        lastMessageAt: now,
      },
    });

    const incomingMessageCount60s = await tx.message.count({
      where: {
        businessId: business.id,
        customerId: customerRecord.id,
        direction: "incoming",
        createdAt: {
          gte: subSeconds(now, 60),
        },
      },
    });

    if (incomingMessageCount60s > 10 && !customerRecord.spamSuspected) {
      await tx.customer.update({
        where: { id: customerRecord.id },
        data: {
          spamSuspected: true,
          spamReason: "Lebih dari 10 pesan masuk dalam 60 detik.",
        },
      });
    }

    return [customerRecord, conversation, incomingMessageRecord] as const;
  });

  after(() => {
    void (async () => {
      const analysis = await runAIAnalysisForConversation({
        businessId: business.id,
        conversationId: conversation.id,
      });

      if (!isAutoReplyEnabled()) {
        return;
      }

      if (!AUTO_REPLY_ALLOWED_ACTIONS.has(analysis.nextAction)) {
        return;
      }

      const replyMessage = analysis.suggestedReply.trim();
      if (!replyMessage) {
        return;
      }

      const latestIncomingMessage = await prisma.message.findFirst({
        where: {
          conversationId: conversation.id,
          direction: "incoming",
        },
        orderBy: {
          createdAt: "desc",
        },
      });

      // Only the latest inbound webhook message in a conversation can trigger auto-reply.
      if (!latestIncomingMessage || latestIncomingMessage.id !== incomingMessage.id) {
        return;
      }

      const sendResult = await safeSendWhatsAppMessage({
        businessId: business.id,
        customerId: customer.id,
        conversationId: conversation.id,
        target: phone,
        message: replyMessage,
        inboxId: normalized.inboxId ?? undefined,
      });

      if (!sendResult.ok) {
        console.warn("Auto reply skipped or failed", {
          conversationId: conversation.id,
          customerId: customer.id,
          code: sendResult.code,
          reason: sendResult.reason,
        });
      }
    })().catch((error) => {
      console.error("AI pipeline failed", error);
    });
  });

  return NextResponse.json({ ok: true });
}
