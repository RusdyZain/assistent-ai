export function readString(value: unknown) {
  if (typeof value === "string") {
    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : null;
  }

  if (typeof value === "number" && Number.isFinite(value)) {
    return String(value);
  }

  return null;
}

function normalizeNumericPhone(value: string) {
  const digits = value.replace(/\D/g, "");
  if (!digits) return null;

  if (digits.startsWith("0")) {
    return `62${digits.slice(1)}`;
  }

  if (digits.startsWith("62")) {
    return digits;
  }

  if (digits.startsWith("8")) {
    return `62${digits}`;
  }

  return digits;
}

export function normalizeIndonesianPhone(value: string) {
  const normalized = normalizeNumericPhone(value);
  if (!normalized) {
    throw new Error("Nomor telepon tidak valid.");
  }
  return normalized;
}

export function toWahaChatId(target: string) {
  const trimmed = target.trim();
  if (!trimmed) {
    throw new Error("Target chat tidak boleh kosong.");
  }

  const atIndex = trimmed.indexOf("@");
  if (atIndex >= 0) {
    const localPart = trimmed.slice(0, atIndex).trim();
    const domainPart = trimmed.slice(atIndex + 1).trim().toLowerCase();

    if (domainPart === "g.us") {
      if (!localPart) {
        throw new Error("Group chatId tidak valid.");
      }
      return `${localPart}@g.us`;
    }

    if (domainPart === "c.us" || domainPart === "s.whatsapp.net") {
      const phone = normalizeIndonesianPhone(localPart);
      return `${phone}@c.us`;
    }
  }

  const phone = normalizeIndonesianPhone(trimmed);
  return `${phone}@c.us`;
}

export function isGroupChatId(chatId: string) {
  return chatId.toLowerCase().endsWith("@g.us");
}

export function extractPhoneFromWhatsAppId(value: string | null | undefined) {
  if (!value) return null;
  const trimmed = value.trim();
  if (!trimmed) return null;

  const lower = trimmed.toLowerCase();
  if (lower.endsWith("@g.us") || lower.endsWith("@newsletter") || lower === "status@broadcast") {
    return null;
  }

  const localPart = trimmed.includes("@") ? trimmed.split("@")[0] : trimmed;
  const normalized = normalizeNumericPhone(localPart);
  return normalized;
}

export function toMillisecondsTimestamp(value: unknown) {
  if (typeof value === "number" && Number.isFinite(value)) {
    if (value > 10_000_000_000) {
      return Math.trunc(value);
    }
    if (value > 100_000_000) {
      return Math.trunc(value * 1000);
    }
  }

  if (typeof value === "string") {
    const parsed = Number(value);
    if (!Number.isNaN(parsed)) {
      return toMillisecondsTimestamp(parsed);
    }
  }

  return Date.now();
}
