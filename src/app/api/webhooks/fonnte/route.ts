import { NextResponse } from "next/server";

export async function POST() {
  return NextResponse.json({
    ok: true,
    ignored: "deprecated_fonnte_webhook",
    message: "Webhook Fonnte sudah deprecated. Gunakan /api/webhooks/waha.",
  });
}
