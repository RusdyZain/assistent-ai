import { FonnteSendParams, FonnteSendResult } from "@/types/sales";

const FONNTE_SEND_URL = "https://api.fonnte.com/send";

export async function sendWhatsAppMessage({
  token,
  target,
  message,
  inboxId,
}: FonnteSendParams): Promise<FonnteSendResult> {
  const body = new URLSearchParams({
    target,
    message,
  });

  if (inboxId) {
    body.set("inboxid", inboxId);
  }

  try {
    const response = await fetch(FONNTE_SEND_URL, {
      method: "POST",
      headers: {
        Authorization: token,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body,
      cache: "no-store",
    });

    const text = await response.text();
    let payload: unknown = text;

    try {
      payload = JSON.parse(text);
    } catch {
      payload = { raw: text };
    }

    if (!response.ok) {
      return {
        ok: false,
        status: response.status,
        payload,
        error: "Fonnte API mengembalikan status non-2xx",
      };
    }

    return {
      ok: true,
      status: response.status,
      payload,
    };
  } catch (error) {
    return {
      ok: false,
      status: 500,
      payload: null,
      error: error instanceof Error ? error.message : "Gagal menghubungi Fonnte",
    };
  }
}
