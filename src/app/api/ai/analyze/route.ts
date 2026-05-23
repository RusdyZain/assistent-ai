import { NextResponse } from "next/server";
import { z } from "zod";

import { requireBusiness, unauthorizedResponse } from "@/lib/business";
import { runAIAnalysisForConversation } from "@/lib/pipeline";

const schema = z.object({
  conversationId: z.string().min(1),
});

export async function POST(request: Request) {
  try {
    const business = await requireBusiness();
    const body = await request.json();

    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "conversationId wajib diisi" }, { status: 400 });
    }

    const analysis = await runAIAnalysisForConversation({
      businessId: business.id,
      conversationId: parsed.data.conversationId,
    });

    return NextResponse.json({ ok: true, analysis });
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return unauthorizedResponse();
    }

    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Gagal analisa AI" },
      { status: 500 },
    );
  }
}
