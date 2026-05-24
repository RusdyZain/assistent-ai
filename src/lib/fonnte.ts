import { FonnteSendParams, FonnteSendResult } from "@/types/sales";

const FONNTE_SEND_URL = "https://api.fonnte.com/send";

function parseFonnteFailure(payload: unknown) {
  if (!payload || typeof payload !== "object") return null;

  const data = payload as Record<string, unknown>;
  const statusField = data.status ?? data.Status;

  if (statusField === false) {
    const reason =
      (typeof data.reason === "string" && data.reason.trim()) ||
      (typeof data.detail === "string" && data.detail.trim()) ||
      "Fonnte API mengembalikan status false";

    return reason;
  }

  return null;
}

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

    const payloadFailureReason = parseFonnteFailure(payload);
    if (payloadFailureReason) {
      return {
        ok: false,
        status: response.status,
        payload,
        error: payloadFailureReason,
      };
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
