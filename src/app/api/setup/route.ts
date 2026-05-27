import { Prisma } from "@prisma/client";
import { NextResponse } from "next/server";
import { z } from "zod";

import { requireBusiness, unauthorizedResponse } from "@/lib/business";
import { normalizeFonnteToken } from "@/lib/fonnte";
import { prisma } from "@/lib/prisma";
import { evaluateSetupCompletion } from "@/lib/setup";

const profileSchema = z.object({
  businessName: z.string().min(1),
  businessCategory: z.string().min(1),
  businessDescription: z.string().min(1),
  businessLocation: z.string().min(1),
  serviceArea: z.string().min(1),
  operatingHours: z.string().min(1),
  whatsappNumber: z.string().min(6),
  replyLanguage: z.string().min(1),
  brandTone: z.string().min(1),
});

const salesRulesSchema = z.object({
  acceptsCOD: z.boolean(),
  acceptsTransfer: z.boolean(),
  acceptsQRIS: z.boolean(),
  requiresDownPayment: z.boolean(),
  downPaymentAmount: z.coerce.number().nonnegative().nullable().optional(),
  downPaymentPercentage: z.coerce.number().int().min(0).max(100).nullable().optional(),
  allowNegotiation: z.boolean(),
  minimumOrder: z.coerce.number().nonnegative().nullable().optional(),
  refundPolicy: z.string().min(1),
  reschedulePolicy: z.string().min(1),
  shippingPolicy: z.string().min(1),
  paymentInstructions: z.string().min(1),
  orderProcess: z.string().min(1),
});

const followUpRulesSchema = z.object({
  warmLeadFollowUpHours: z.coerce.number().int().min(1),
  hotLeadFollowUpHours: z.coerce.number().int().min(1),
  closingPriorityFollowUpHours: z.coerce.number().int().min(1),
  waitingPaymentFollowUpHours: z.coerce.number().int().min(1),
  maxFollowUpCount: z.coerce.number().int().min(0),
  markLostAfterDays: z.coerce.number().int().min(1),
});

const fonnteSchema = z.object({
  fonnteToken: z.string().min(1),
  whatsappNumber: z.string().min(6),
});

const patchSchema = z.discriminatedUnion("section", [
  z.object({
    section: z.literal("business_profile"),
    payload: profileSchema,
  }),
  z.object({
    section: z.literal("sales_rules"),
    payload: salesRulesSchema,
  }),
  z.object({
    section: z.literal("follow_up_rules"),
    payload: followUpRulesSchema,
  }),
  z.object({
    section: z.literal("fonnte_connection"),
    payload: fonnteSchema,
  }),
]);

function toNumber(value: Prisma.Decimal | null) {
  return value ? Number(value.toString()) : null;
}

async function getSetupData(businessId: string) {
  const [business, productCount, templates, knowledgeCount] = await Promise.all([
    prisma.business.findUnique({
      where: { id: businessId },
      select: {
        id: true,
        name: true,
        phone: true,
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
        fonnteToken: true,
        setupCompleted: true,
        setupStep: true,
      },
    }),
    prisma.product.count({
      where: {
        businessId,
        isActive: true,
      },
    }),
    prisma.replyTemplate.findMany({
      where: {
        businessId,
        isActive: true,
      },
      select: {
        type: true,
      },
    }),
    prisma.knowledgeBaseItem.count({
      where: {
        businessId,
        isActive: true,
      },
    }),
  ]);

  if (!business) {
    throw new Error("UNAUTHORIZED");
  }

  const completion = evaluateSetupCompletion({
    business: {
      ...business,
      downPaymentAmount: toNumber(business.downPaymentAmount),
      minimumOrder: toNumber(business.minimumOrder),
    },
    productCount,
    activeTemplateTypes: templates.map((item) => item.type),
    knowledgeCount,
  });

  return {
    business,
    productCount,
    knowledgeCount,
    templateCount: templates.length,
    completion,
  };
}

export async function GET(request: Request) {
  try {
    const business = await requireBusiness();
    const { business: currentBusiness, productCount, knowledgeCount, templateCount, completion } =
      await getSetupData(business.id);

    if (
      currentBusiness.setupCompleted !== completion.setupCompleted ||
      currentBusiness.setupStep !== completion.setupStep
    ) {
      await prisma.business.update({
        where: { id: business.id },
        data: {
          setupCompleted: completion.setupCompleted,
          setupStep: completion.setupStep,
        },
      });
    }

    const webhookUrl = new URL("/api/webhooks/fonnte", request.url).toString();

    return NextResponse.json({
      data: {
        businessId: currentBusiness.id,
        setupCompleted: completion.setupCompleted,
        setupStep: completion.setupStep,
        steps: completion.steps,
        counts: {
          productCount,
          templateCount,
          knowledgeCount,
        },
        businessProfile: {
          businessName: currentBusiness.name,
          businessCategory: currentBusiness.businessCategory ?? "",
          businessDescription: currentBusiness.businessDescription ?? "",
          businessLocation: currentBusiness.businessLocation ?? "",
          serviceArea: currentBusiness.serviceArea ?? "",
          operatingHours: currentBusiness.operatingHours ?? "",
          whatsappNumber: currentBusiness.whatsappNumber ?? currentBusiness.phone,
          replyLanguage: currentBusiness.replyLanguage,
          brandTone: currentBusiness.brandTone,
        },
        salesRules: {
          acceptsCOD: currentBusiness.acceptsCOD,
          acceptsTransfer: currentBusiness.acceptsTransfer,
          acceptsQRIS: currentBusiness.acceptsQRIS,
          requiresDownPayment: currentBusiness.requiresDownPayment,
          downPaymentAmount: toNumber(currentBusiness.downPaymentAmount),
          downPaymentPercentage: currentBusiness.downPaymentPercentage,
          allowNegotiation: currentBusiness.allowNegotiation,
          minimumOrder: toNumber(currentBusiness.minimumOrder),
          refundPolicy: currentBusiness.refundPolicy ?? "",
          reschedulePolicy: currentBusiness.reschedulePolicy ?? "",
          shippingPolicy: currentBusiness.shippingPolicy ?? "",
          paymentInstructions: currentBusiness.paymentInstructions ?? "",
          orderProcess: currentBusiness.orderProcess ?? "",
        },
        followUpRules: {
          warmLeadFollowUpHours: currentBusiness.warmLeadFollowUpHours,
          hotLeadFollowUpHours: currentBusiness.hotLeadFollowUpHours,
          closingPriorityFollowUpHours: currentBusiness.closingPriorityFollowUpHours,
          waitingPaymentFollowUpHours: currentBusiness.waitingPaymentFollowUpHours,
          maxFollowUpCount: currentBusiness.maxFollowUpCount,
          markLostAfterDays: currentBusiness.markLostAfterDays,
        },
        fonnteConnection: {
          fonnteToken: currentBusiness.fonnteToken ?? "",
          whatsappNumber: currentBusiness.whatsappNumber ?? currentBusiness.phone,
          webhookUrl,
        },
      },
    });
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return unauthorizedResponse();
    }

    return NextResponse.json({ error: "Gagal mengambil setup bisnis" }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const business = await requireBusiness();
    const body = await request.json();
    const parsed = patchSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: "Payload setup tidak valid" }, { status: 400 });
    }

    if (parsed.data.section === "business_profile") {
      await prisma.business.update({
        where: { id: business.id },
        data: {
          name: parsed.data.payload.businessName,
          businessCategory: parsed.data.payload.businessCategory,
          businessDescription: parsed.data.payload.businessDescription,
          businessLocation: parsed.data.payload.businessLocation,
          serviceArea: parsed.data.payload.serviceArea,
          operatingHours: parsed.data.payload.operatingHours,
          whatsappNumber: parsed.data.payload.whatsappNumber,
          phone: parsed.data.payload.whatsappNumber,
          replyLanguage: parsed.data.payload.replyLanguage,
          brandTone: parsed.data.payload.brandTone,
        },
      });
    }

    if (parsed.data.section === "sales_rules") {
      await prisma.business.update({
        where: { id: business.id },
        data: {
          acceptsCOD: parsed.data.payload.acceptsCOD,
          acceptsTransfer: parsed.data.payload.acceptsTransfer,
          acceptsQRIS: parsed.data.payload.acceptsQRIS,
          requiresDownPayment: parsed.data.payload.requiresDownPayment,
          downPaymentAmount: parsed.data.payload.requiresDownPayment
            ? parsed.data.payload.downPaymentAmount ?? null
            : null,
          downPaymentPercentage: parsed.data.payload.requiresDownPayment
            ? parsed.data.payload.downPaymentPercentage ?? null
            : null,
          allowNegotiation: parsed.data.payload.allowNegotiation,
          minimumOrder: parsed.data.payload.minimumOrder ?? null,
          refundPolicy: parsed.data.payload.refundPolicy,
          reschedulePolicy: parsed.data.payload.reschedulePolicy,
          shippingPolicy: parsed.data.payload.shippingPolicy,
          paymentInstructions: parsed.data.payload.paymentInstructions,
          orderProcess: parsed.data.payload.orderProcess,
        },
      });
    }

    if (parsed.data.section === "follow_up_rules") {
      await prisma.business.update({
        where: { id: business.id },
        data: parsed.data.payload,
      });
    }

    if (parsed.data.section === "fonnte_connection") {
      await prisma.business.update({
        where: { id: business.id },
        data: {
          fonnteToken: normalizeFonnteToken(parsed.data.payload.fonnteToken),
          whatsappNumber: parsed.data.payload.whatsappNumber,
          phone: parsed.data.payload.whatsappNumber,
        },
      });
    }

    const { completion } = await getSetupData(business.id);
    await prisma.business.update({
      where: { id: business.id },
      data: {
        setupCompleted: completion.setupCompleted,
        setupStep: completion.setupStep,
      },
    });

    return NextResponse.json({
      ok: true,
      data: {
        setupCompleted: completion.setupCompleted,
        setupStep: completion.setupStep,
        steps: completion.steps,
      },
    });
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return unauthorizedResponse();
    }

    return NextResponse.json({ error: "Gagal menyimpan setup bisnis" }, { status: 500 });
  }
}
