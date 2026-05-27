import { NextResponse } from "next/server";
import { z } from "zod";

import { requireBusiness, unauthorizedResponse } from "@/lib/business";
import { normalizeFonnteToken } from "@/lib/fonnte";

const schema = z.object({
  token: z.string().optional().nullable(),
});

function parseFailureReason(payload: unknown, fallback: string) {
  if (!payload || typeof payload !== "object") {
    return fallback;
  }

  const data = payload as Record<string, unknown>;
  return (
    (typeof data.reason === "string" && data.reason.trim()) ||
    (typeof data.detail === "string" && data.detail.trim()) ||
    fallback
  );
}

export async function POST(request: Request) {
  try {
    const business = await requireBusiness();
    const body = await request.json().catch(() => ({}));
    const parsed = schema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: "Payload tidak valid" }, { status: 400 });
    }

    const tokenFromInput = normalizeFonnteToken(parsed.data.token);
    const tokenFromBusiness = normalizeFonnteToken(business.fonnteToken);
    const tokenFromEnv = normalizeFonnteToken(process.env.FONNTE_TOKEN ?? process.env.SEED_FONNTE_TOKEN);
    const token = tokenFromInput ?? tokenFromBusiness ?? tokenFromEnv;

    if (!token) {
      return NextResponse.json({ error: "Fonnte token belum diisi." }, { status: 400 });
    }

    const response = await fetch("https://api.fonnte.com/device", {
      method: "POST",
      headers: {
        Authorization: token,
      },
      cache: "no-store",
    });

    const text = await response.text();
    let payload: unknown = text;

    try {
      payload = JSON.parse(text);
    } catch {
      payload = { raw: text };
    }

    const payloadObject = payload as Record<string, unknown>;
    const statusField = payloadObject?.status;
    const success = statusField === true;

    if (!success) {
      const reason = parseFailureReason(payload, "Token tidak valid atau device belum aktif.");
      return NextResponse.json(
        {
          ok: false,
          error: reason,
          payload,
        },
        { status: 400 },
      );
    }

    return NextResponse.json({
      ok: true,
      data: {
        device: typeof payloadObject.device === "string" ? payloadObject.device : null,
        deviceStatus:
          typeof payloadObject.device_status === "string" ? payloadObject.device_status : null,
        name: typeof payloadObject.name === "string" ? payloadObject.name : null,
        quota: payloadObject.quota ?? null,
        expired: payloadObject.expired ?? null,
        messages: payloadObject.messages ?? null,
        package: payloadObject.package ?? null,
      },
    });
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return unauthorizedResponse();
    }

    return NextResponse.json({ error: "Gagal cek token Fonnte" }, { status: 500 });
  }
}

