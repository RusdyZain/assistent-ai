interface NormalizedWebhookMessage {
  phone: string;
  senderName: string | null;
  messageText: string;
  inboxId: string | null;
}

function readString(value: unknown) {
  if (typeof value === "string") {
    const trimmed = value.trim();
    return trimmed.length ? trimmed : null;
  }

  if (typeof value === "number") {
    return String(value);
  }

  return null;
}

export function extractFonnteMessage(payload: unknown): NormalizedWebhookMessage | null {
  if (!payload || typeof payload !== "object") return null;
  const data = payload as Record<string, unknown>;

  const phone =
    readString(data.sender) ??
    readString(data.phone) ??
    readString(data.number) ??
    readString(data.from);

  const messageText =
    readString(data.message) ?? readString(data.text) ?? readString(data.chat) ?? "";

  if (!phone || !messageText) return null;

  const senderName = readString(data.name) ?? readString(data.senderName) ?? readString(data.pushname);

  const inboxId = readString(data.inboxid) ?? readString(data.inboxId);

  return {
    phone,
    senderName,
    messageText,
    inboxId,
  };
}
