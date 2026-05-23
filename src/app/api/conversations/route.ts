import { NextResponse } from "next/server";
import { type LeadStatus } from "@prisma/client";

import { requireBusiness, unauthorizedResponse } from "@/lib/business";
import { prisma } from "@/lib/prisma";
import { LEAD_STATUS_VALUES } from "@/types/sales";

export async function GET(request: Request) {
  try {
    const business = await requireBusiness();
    const { searchParams } = new URL(request.url);

    const query = searchParams.get("q")?.trim();
    const leadStatusParam = searchParams.get("leadStatus")?.trim();
    const leadStatus =
      leadStatusParam && LEAD_STATUS_VALUES.includes(leadStatusParam as LeadStatus)
        ? (leadStatusParam as LeadStatus)
        : undefined;

    const conversations = await prisma.conversation.findMany({
      where: {
        businessId: business.id,
        ...(leadStatus ? { customer: { leadStatus } } : {}),
        ...(query
          ? {
              OR: [
                { customer: { name: { contains: query, mode: "insensitive" } } },
                { customer: { phone: { contains: query, mode: "insensitive" } } },
              ],
            }
          : {}),
      },
      include: {
        customer: true,
        messages: {
          orderBy: {
            createdAt: "desc",
          },
          take: 1,
        },
      },
      orderBy: {
        lastMessageAt: "desc",
      },
      take: 100,
    });

    return NextResponse.json({
      data: conversations.map((item) => ({
        id: item.id,
        status: item.status,
        summary: item.summary,
        lastIntent: item.lastIntent,
        lastMessageAt: item.lastMessageAt,
        customer: {
          id: item.customer.id,
          name: item.customer.name,
          phone: item.customer.phone,
          leadStatus: item.customer.leadStatus,
          spamSuspected: item.customer.spamSuspected,
          outgoingCountToday: item.customer.outgoingCountToday,
          lastOutgoingAt: item.customer.lastOutgoingAt,
        },
        lastMessage: item.messages[0] ?? null,
      })),
    });
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return unauthorizedResponse();
    }

    return NextResponse.json({ error: "Gagal mengambil conversation" }, { status: 500 });
  }
}
