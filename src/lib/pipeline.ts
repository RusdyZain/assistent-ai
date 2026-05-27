import { addHours, subDays } from "date-fns";
import { Prisma } from "@prisma/client";

import { analyzeConversation } from "@/lib/ai";
import { prisma } from "@/lib/prisma";
import { AIAnalysisResult, DraftOrderItem } from "@/types/sales";

interface RunAiParams {
  businessId: string;
  conversationId: string;
}

interface FollowUpRuleContext {
  warmLeadFollowUpHours: number;
  hotLeadFollowUpHours: number;
  closingPriorityFollowUpHours: number;
  waitingPaymentFollowUpHours: number;
  maxFollowUpCount: number;
  markLostAfterDays: number;
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

function resolveFollowUpDelayHours(analysis: AIAnalysisResult, rules: FollowUpRuleContext) {
  if (analysis.intent === "payment_confirmation") {
    return rules.waitingPaymentFollowUpHours;
  }

  if (analysis.leadStatus === "deal") {
    return rules.closingPriorityFollowUpHours;
  }

  if (analysis.leadStatus === "hot") {
    return rules.hotLeadFollowUpHours;
  }

  return rules.warmLeadFollowUpHours;
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

  const [business, products, replyTemplates, knowledgeBase] = await Promise.all([
    prisma.business.findUnique({
      where: { id: businessId },
      select: {
        name: true,
        businessCategory: true,
        businessDescription: true,
        businessLocation: true,
        serviceArea: true,
        operatingHours: true,
        whatsappNumber: true,
        replyLanguage: true,
        brandTone: true,
        acceptsCOD: true,
        acceptsTransfer: true,
        acceptsQRIS: true,
        requiresDownPayment: true,
        downPaymentAmount: true,
        downPaymentPercentage: true,
        allowNegotiation: true,
        minimumOrder: true,
        refundPolicy: true,
        reschedulePolicy: true,
        shippingPolicy: true,
        paymentInstructions: true,
        orderProcess: true,
        warmLeadFollowUpHours: true,
        hotLeadFollowUpHours: true,
        closingPriorityFollowUpHours: true,
        waitingPaymentFollowUpHours: true,
        maxFollowUpCount: true,
        markLostAfterDays: true,
      },
    }),
    prisma.product.findMany({
      where: {
        businessId,
        isActive: true,
      },
      orderBy: {
        updatedAt: "desc",
      },
      take: 100,
    }),
    prisma.replyTemplate.findMany({
      where: {
        businessId,
        isActive: true,
      },
      orderBy: {
        updatedAt: "desc",
      },
      take: 50,
    }),
    prisma.knowledgeBaseItem.findMany({
      where: {
        businessId,
        isActive: true,
      },
      orderBy: {
        updatedAt: "desc",
      },
      take: 100,
    }),
  ]);

  if (!business) {
    throw new Error("Business tidak ditemukan");
  }

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
      type: item.type,
      description: item.description,
      price: item.price.toString(),
      promoPrice: item.promoPrice?.toString() ?? null,
      benefits: item.benefits,
      suitableFor: item.suitableFor,
      stock: item.stock,
      stockStatus: item.stockStatus,
      availability: item.availability,
      duration: item.duration,
      minimumOrder: item.minimumOrder,
      processingTime: item.processingTime,
      deliveryInfo: item.deliveryInfo,
      category: item.category,
      keywords: item.keywords,
      faq: item.faq,
      tags: item.tags,
      isActive: item.isActive,
    })),
    businessProfile: {
      businessName: business.name,
      businessCategory: business.businessCategory,
      businessDescription: business.businessDescription,
      businessLocation: business.businessLocation,
      serviceArea: business.serviceArea,
      operatingHours: business.operatingHours,
      whatsappNumber: business.whatsappNumber,
      replyLanguage: business.replyLanguage,
      brandTone: business.brandTone,
    },
    salesRules: {
      acceptsCOD: business.acceptsCOD,
      acceptsTransfer: business.acceptsTransfer,
      acceptsQRIS: business.acceptsQRIS,
      requiresDownPayment: business.requiresDownPayment,
      downPaymentAmount: business.downPaymentAmount ? Number(business.downPaymentAmount.toString()) : null,
      downPaymentPercentage: business.downPaymentPercentage,
      allowNegotiation: business.allowNegotiation,
      minimumOrder: business.minimumOrder ? Number(business.minimumOrder.toString()) : null,
      refundPolicy: business.refundPolicy,
      reschedulePolicy: business.reschedulePolicy,
      shippingPolicy: business.shippingPolicy,
      paymentInstructions: business.paymentInstructions,
      orderProcess: business.orderProcess,
    },
    replyTemplates: replyTemplates.map((item) => ({
      type: item.type,
      title: item.title,
      content: item.content,
      isActive: item.isActive,
    })),
    knowledgeBase: knowledgeBase.map((item) => ({
      title: item.title,
      category: item.category,
      content: item.content,
      isActive: item.isActive,
    })),
    followUpRules: {
      warmLeadFollowUpHours: business.warmLeadFollowUpHours,
      hotLeadFollowUpHours: business.hotLeadFollowUpHours,
      closingPriorityFollowUpHours: business.closingPriorityFollowUpHours,
      waitingPaymentFollowUpHours: business.waitingPaymentFollowUpHours,
      maxFollowUpCount: business.maxFollowUpCount,
      markLostAfterDays: business.markLostAfterDays,
    },
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
      const existingFollowUps = await tx.followUp.count({
        where: {
          businessId,
          customerId: conversation.customerId,
          conversationId: conversation.id,
          status: {
            in: ["pending", "sent"],
          },
        },
      });

      if (existingFollowUps < business.maxFollowUpCount) {
        await tx.followUp.create({
          data: {
            businessId,
            customerId: conversation.customerId,
            conversationId: conversation.id,
            message:
              analysis.suggestedReply ||
              "Follow up pelanggan ini untuk melanjutkan proses penawaran.",
            scheduledAt: addHours(
              new Date(),
              resolveFollowUpDelayHours(analysis, {
                warmLeadFollowUpHours: business.warmLeadFollowUpHours,
                hotLeadFollowUpHours: business.hotLeadFollowUpHours,
                closingPriorityFollowUpHours: business.closingPriorityFollowUpHours,
                waitingPaymentFollowUpHours: business.waitingPaymentFollowUpHours,
                maxFollowUpCount: business.maxFollowUpCount,
                markLostAfterDays: business.markLostAfterDays,
              }),
            ),
            status: "pending",
          },
        });
      }

      const lastIncomingAt = conversation.customer.lastIncomingAt ?? latestMessageAt;
      const markLostThreshold = subDays(new Date(), business.markLostAfterDays);
      if (lastIncomingAt < markLostThreshold && analysis.leadStatus !== "deal") {
        await tx.customer.update({
          where: { id: conversation.customerId },
          data: {
            leadStatus: "lost",
          },
        });
      }
    }
  });

  return analysis;
}
