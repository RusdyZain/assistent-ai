import { NextResponse } from "next/server";
import { z } from "zod";

import { requireBusiness, unauthorizedResponse } from "@/lib/business";
import { getWhatsAppProvider } from "@/lib/whatsapp";

const schema = z.object({
  target: z.string().min(6),
  message: z.string().min(1).optional(),
});

export async function POST(request: Request) {
  try {
    await requireBusiness();
    const body = await request.json();
    const parsed = schema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: "Payload test WhatsApp tidak valid" }, { status: 400 });
    }

    const provider = getWhatsAppProvider();
    const sendResult = await provider.sendText({
      target: parsed.data.target,
      text:
        parsed.data.message ??
        "Test koneksi dari WAI Sales Assistant. Jika pesan ini masuk, koneksi WhatsApp sudah aktif.",
    });

    if (!sendResult.ok) {
      return NextResponse.json(
        { error: sendResult.error ?? "Gagal kirim test message ke provider WhatsApp", sendResult },
        { status: sendResult.status || 500 },
      );
    }

    return NextResponse.json({
      ok: true,
      sendResult,
    });
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return unauthorizedResponse();
    }

    return NextResponse.json({ error: "Gagal mengirim test message" }, { status: 500 });
  }
}
