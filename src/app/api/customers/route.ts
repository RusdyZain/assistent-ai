import { NextResponse } from "next/server";
import { type LeadStatus } from "@prisma/client";

import { requireBusiness, unauthorizedResponse } from "@/lib/business";
import { prisma } from "@/lib/prisma";
import { LEAD_STATUS_VALUES } from "@/types/sales";

export async function GET(request: Request) {
  try {
    const business = await requireBusiness();
    const { searchParams } = new URL(request.url);

    const leadStatusParam = searchParams.get("leadStatus")?.trim();
    const leadStatus =
      leadStatusParam && LEAD_STATUS_VALUES.includes(leadStatusParam as LeadStatus)
        ? (leadStatusParam as LeadStatus)
        : undefined;
    const q = searchParams.get("q")?.trim();

    const customers = await prisma.customer.findMany({
      where: {
        businessId: business.id,
        ...(leadStatus ? { leadStatus } : {}),
        ...(q
          ? {
              OR: [
                { name: { contains: q, mode: "insensitive" } },
                { phone: { contains: q, mode: "insensitive" } },
              ],
            }
          : {}),
      },
      include: {
        orders: {
          orderBy: {
            createdAt: "desc",
          },
          take: 2,
        },
      },
      orderBy: {
        lastMessageAt: "desc",
      },
      take: 200,
    });

    return NextResponse.json({ data: customers });
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return unauthorizedResponse();
    }

    return NextResponse.json({ error: "Gagal mengambil customer" }, { status: 500 });
  }
}
