import { addHours } from "date-fns";
import { Prisma } from "@prisma/client";

import { analyzeConversation } from "@/lib/ai";
import { prisma } from "@/lib/prisma";
import { AIAnalysisResult, DraftOrderItem } from "@/types/sales";

interface RunAiParams {
  businessId: string;
  conversationId: string;
}

function hasMeaningfulOrderData(analysis: AIAnalysisResult) {
  const extracted = analysis.extractedOrder;
  return Boolean(extracted.product || extracted.quantity || extracted.budget || extracted.deadline);
}

function buildDraftOrderItems(analysis: AIAnalysisResult): DraftOrderItem[] {
  const extracted = analysis.extractedOrder;
  if (!extracted.product) return [];

  return [
    {
      product: extracted.product,
      quantity: extracted.quantity ?? 1,
      estimatedPrice: extracted.budget,
    },
  ];
}

export async function runAIAnalysisForConversation({
  businessId,
  conversationId,
}: RunAiParams) {
  const conversation = await prisma.conversation.findFirst({
    where: {
      id: conversationId,
      businessId,
    },
    include: {
      customer: true,
      messages: {
        orderBy: {
          createdAt: "asc",
        },
        take: 40,
      },
    },
  });

  if (!conversation) {
    throw new Error("Conversation tidak ditemukan");
  }

  const products = await prisma.product.findMany({
    where: {
      businessId,
      isActive: true,
    },
    orderBy: {
      updatedAt: "desc",
    },
    take: 100,
  });

  const analysis = await analyzeConversation({
    conversation: {
      id: conversation.id,
      summary: conversation.summary,
      lastIntent: conversation.lastIntent,
      internalNotesOnly:
        conversation.customer.spamSuspected || conversation.status === "rate_limited",
    },
    messages: conversation.messages.map((item) => ({
      direction: item.direction,
      message: item.message,
      createdAt: item.createdAt,
    })),
    products: products.map((item) => ({
      name: item.name,
      description: item.description,
      price: item.price.toString(),
      stock: item.stock,
      category: item.category,
      keywords: item.keywords,
      isActive: item.isActive,
    })),
  });

  const latestMessageAt = conversation.messages[conversation.messages.length - 1]?.createdAt ?? new Date();

  await prisma.$transaction(async (tx) => {
    await tx.conversation.update({
      where: { id: conversation.id },
      data: {
        summary: analysis.summary,
        lastIntent: analysis.intent,
        lastMessageAt: latestMessageAt,
      },
    });

    await tx.customer.update({
      where: { id: conversation.customerId },
      data: {
        leadStatus: analysis.leadStatus,
        lastMessageAt: latestMessageAt,
      },
    });

    await tx.message.updateMany({
      where: {
        conversationId: conversation.id,
        aiProcessed: false,
      },
      data: {
        aiProcessed: true,
      },
    });

    const restrictedReplyMode =
      conversation.customer.spamSuspected || conversation.status === "rate_limited";

    if (hasMeaningfulOrderData(analysis) && !restrictedReplyMode) {
      const draftOrder = await tx.order.findFirst({
        where: {
          businessId,
          customerId: conversation.customerId,
          conversationId: conversation.id,
          status: "draft",
        },
        orderBy: {
          updatedAt: "desc",
        },
      });

      const items = buildDraftOrderItems(analysis);

      const orderPayload = {
        items: items as unknown as Prisma.InputJsonValue,
        totalEstimate: analysis.extractedOrder.budget,
        notes: analysis.extractedOrder.notes,
      };

      if (draftOrder) {
        await tx.order.update({
          where: { id: draftOrder.id },
          data: orderPayload,
        });
      } else {
        await tx.order.create({
          data: {
            businessId,
            customerId: conversation.customerId,
            conversationId: conversation.id,
            status: "draft",
            ...orderPayload,
          },
        });
      }
    }

    if (analysis.nextAction === "follow_up_later" && !restrictedReplyMode) {
      await tx.followUp.create({
        data: {
          businessId,
          customerId: conversation.customerId,
          conversationId: conversation.id,
          message:
            analysis.suggestedReply ||
            "Follow up pelanggan ini untuk melanjutkan proses penawaran.",
          scheduledAt: addHours(new Date(), 24),
          status: "pending",
        },
      });
    }
  });

  return analysis;
}
