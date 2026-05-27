import { NextResponse } from "next/server";
import { z } from "zod";

import { requireBusiness, unauthorizedResponse } from "@/lib/business";
import { sendWhatsAppMessage } from "@/lib/fonnte";
import { normalizePhone } from "@/lib/utils";

const schema = z.object({
  target: z.string().min(6),
  message: z.string().min(1).optional(),
});

function resolveToken(dbToken: string | null) {
  if (dbToken?.trim()) return dbToken.trim();
  if (process.env.FONNTE_TOKEN?.trim()) return process.env.FONNTE_TOKEN.trim();
  if (process.env.SEED_FONNTE_TOKEN?.trim()) return process.env.SEED_FONNTE_TOKEN.trim();
  return null;
}

export async function POST(request: Request) {
  try {
    const business = await requireBusiness();
    const body = await request.json();
    const parsed = schema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: "Payload test Fonnte tidak valid" }, { status: 400 });
    }

    const token = resolveToken(business.fonnteToken);
    if (!token) {
      return NextResponse.json({ error: "Fonnte token belum diatur" }, { status: 400 });
    }

    const sendResult = await sendWhatsAppMessage({
      token,
      target: normalizePhone(parsed.data.target),
      message:
        parsed.data.message ??
        "Test koneksi dari WAI Sales Assistant. Jika pesan ini masuk, koneksi Fonnte sudah aktif.",
    });

    if (!sendResult.ok) {
      return NextResponse.json(
        { error: sendResult.error ?? "Gagal kirim test message ke Fonnte", sendResult },
        { status: 500 },
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
