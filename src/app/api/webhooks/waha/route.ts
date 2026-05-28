import { createHmac, timingSafeEqual } from "node:crypto";

import { after, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { subSeconds } from "date-fns";

import { runAIAnalysisForConversation } from "@/lib/pipeline";
import { prisma } from "@/lib/prisma";
import { safeSendWhatsAppMessage } from "@/lib/safe-send";
import { shouldIgnoreIncomingMessage } from "@/lib/whatsapp/incoming";
import { getWhatsAppProvider } from "@/lib/whatsapp";
import { extractPhoneFromWhatsAppId, readString } from "@/lib/whatsapp/utils";

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

function safeEqualString(left: string, right: string) {
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);
  if (leftBuffer.length !== rightBuffer.length) {
    return false;
  }
  return timingSafeEqual(leftBuffer, rightBuffer);
}

function verifyWebhookSecret(request: Request, rawBody: string) {
  const configuredSecret = process.env.WAHA_WEBHOOK_SECRET?.trim();
  if (!configuredSecret) return true;

  const hmacHeader = request.headers.get("x-webhook-hmac")?.trim().toLowerCase();
  const algorithmHeader = request.headers.get("x-webhook-hmac-algorithm")?.trim().toLowerCase();

  if (hmacHeader) {
    if (algorithmHeader && algorithmHeader !== "sha512") {
      return false;
    }

    const computed = createHmac("sha512", configuredSecret).update(rawBody).digest("hex");
    return safeEqualString(computed, hmacHeader);
  }

  const explicitSecretHeader =
    request.headers.get("x-waha-webhook-secret")?.trim() ??
    request.headers.get("x-webhook-secret")?.trim();

  if (!explicitSecretHeader) {
    return false;
  }

  return safeEqualString(explicitSecretHeader, configuredSecret);
}

async function resolveBusinessByIncomingData(input: {
  normalizedTo: string | null;
  meId: string | null;
}) {
  const candidateNumbers = [input.normalizedTo, input.meId]
    .map((value) => extractPhoneFromWhatsAppId(value))
    .filter((value): value is string => Boolean(value));

  if (candidateNumbers.length > 0) {
    const business = await prisma.business.findFirst({
      where: {
        OR: [
          { whatsappNumber: { in: candidateNumbers } },
          { phone: { in: candidateNumbers } },
        ],
      },
    });

    if (business) return business;
  }

  return prisma.business.findFirst({
    orderBy: {
      createdAt: "asc",
    },
  });
}

export async function POST(request: Request) {
  const rawBody = await request.text();
  if (!verifyWebhookSecret(request, rawBody)) {
    return NextResponse.json({ ok: false, error: "Unauthorized webhook" }, { status: 401 });
  }

  let payload: unknown;
  try {
    payload = rawBody ? JSON.parse(rawBody) : {};
  } catch {
    return NextResponse.json({ ok: true, ignored: "invalid_json" });
  }

  const provider = getWhatsAppProvider();
  const normalized = await provider.normalizeIncomingWebhook(payload);

  if (!normalized) {
    return NextResponse.json({ ok: true, ignored: "unsupported_payload" });
  }

  if (shouldIgnoreIncomingMessage(normalized)) {
    return NextResponse.json({ ok: true, ignored: "from_me_message" });
  }

  const payloadObject = payload as Record<string, unknown>;
  const me = payloadObject.me as Record<string, unknown> | undefined;
  const business = await resolveBusinessByIncomingData({
    normalizedTo: normalized.to,
    meId: readString(me?.id),
  });

  if (!business) {
    return NextResponse.json({ ok: true, ignored: "business_not_found" });
  }

  await prisma.webhookEvent.create({
    data: {
      businessId: business.id,
      payload: payload as Prisma.InputJsonValue,
      source: "waha",
    },
  });

  const phone = normalized.phone;
  const now = new Date(normalized.timestamp || Date.now());
  const webhookPayload = payloadObject.payload as Record<string, unknown> | undefined;
  const senderName =
    readString(webhookPayload?.pushName) ??
    readString(webhookPayload?.notifyName) ??
    readString(webhookPayload?.name);

  const [customer, conversation, incomingMessage] = await prisma.$transaction(async (tx) => {
    const customerRecord = await tx.customer.upsert({
      where: {
        businessId_phone: {
          businessId: business.id,
          phone,
        },
      },
      update: {
        name: senderName ?? undefined,
        lastIncomingAt: now,
        lastMessageAt: now,
      },
      create: {
        businessId: business.id,
        phone,
        name: senderName ?? undefined,
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
        message: normalized.text,
        rawPayload: payload as Prisma.InputJsonValue,
        fonnteInboxId: normalized.messageId,
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

      if (!latestIncomingMessage || latestIncomingMessage.id !== incomingMessage.id) {
        return;
      }

      const sendResult = await safeSendWhatsAppMessage({
        businessId: business.id,
        customerId: customer.id,
        conversationId: conversation.id,
        target: phone,
        message: replyMessage,
        inboxId: normalized.messageId,
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
