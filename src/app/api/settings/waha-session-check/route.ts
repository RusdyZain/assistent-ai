import { NextResponse } from "next/server";
import { z } from "zod";

import { requireBusiness, unauthorizedResponse } from "@/lib/business";
import { checkWahaSession } from "@/lib/whatsapp/waha-session";

const schema = z.object({
  session: z.string().optional().nullable(),
});

export async function POST(request: Request) {
  try {
    await requireBusiness();
    const body = await request.json().catch(() => ({}));
    const parsed = schema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: "Payload tidak valid" }, { status: 400 });
    }

    const result = await checkWahaSession(parsed.data.session);
    if (!result.ok) {
      return NextResponse.json(
        {
          ok: false,
          error: result.error,
          payload: result.payload,
        },
        { status: result.status || 500 },
      );
    }

    return NextResponse.json({
      ok: true,
      data: result.data,
    });
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return unauthorizedResponse();
    }

    return NextResponse.json({ error: "Gagal cek session WAHA" }, { status: 500 });
  }
}
