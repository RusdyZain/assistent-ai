import { Prisma } from "@prisma/client";
import { NextResponse } from "next/server";

import { requireBusiness, unauthorizedResponse } from "@/lib/business";
import { prisma } from "@/lib/prisma";
import { evaluateSetupCompletion } from "@/lib/setup";

function toNumber(value: Prisma.Decimal | null) {
  return value ? Number(value.toString()) : null;
}

export async function POST() {
  try {
    const business = await requireBusiness();

    const [currentBusiness, productCount, templates, knowledgeCount] = await Promise.all([
      prisma.business.findUnique({
        where: { id: business.id },
        select: {
          id: true,
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
          fonnteToken: true,
        },
      }),
      prisma.product.count({ where: { businessId: business.id, isActive: true } }),
      prisma.replyTemplate.findMany({
        where: {
          businessId: business.id,
          isActive: true,
        },
        select: { type: true },
      }),
      prisma.knowledgeBaseItem.count({ where: { businessId: business.id, isActive: true } }),
    ]);

    if (!currentBusiness) {
      return unauthorizedResponse();
    }

    const completion = evaluateSetupCompletion({
      business: {
        ...currentBusiness,
        downPaymentAmount: toNumber(currentBusiness.downPaymentAmount),
        minimumOrder: toNumber(currentBusiness.minimumOrder),
      },
      productCount,
      activeTemplateTypes: templates.map((item) => item.type),
      knowledgeCount,
    });

    if (!completion.setupCompleted) {
      await prisma.business.update({
        where: { id: business.id },
        data: {
          setupCompleted: false,
          setupStep: completion.setupStep,
        },
      });

      return NextResponse.json(
        {
          error: "Semua langkah setup wajib dilengkapi sebelum diselesaikan.",
          setupStep: completion.setupStep,
          steps: completion.steps,
        },
        { status: 400 },
      );
    }

    await prisma.business.update({
      where: { id: business.id },
      data: {
        setupCompleted: true,
        setupStep: 7,
      },
    });

    return NextResponse.json({
      ok: true,
      data: {
        setupCompleted: true,
        setupStep: 7,
      },
    });
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return unauthorizedResponse();
    }

    return NextResponse.json({ error: "Gagal menyelesaikan setup bisnis" }, { status: 500 });
  }
}
