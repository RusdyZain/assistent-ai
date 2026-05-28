import {
  extractPhoneFromWhatsAppId,
  isGroupChatId,
  readString,
  toMillisecondsTimestamp,
  toWahaChatId,
} from "@/lib/whatsapp/utils";
import {
  NormalizedIncomingMessage,
  SendTextInput,
  SendTextResult,
  WhatsAppProvider,
} from "@/lib/whatsapp/types";

const DEFAULT_WAHA_BASE_URL = "http://localhost:3000";
const DEFAULT_WAHA_SESSION = "default";
const DEFAULT_WAHA_TIMEOUT_MS = 15_000;

function getWahaConfig() {
  const baseUrl = (process.env.WAHA_BASE_URL ?? DEFAULT_WAHA_BASE_URL).trim().replace(/\/+$/, "");
  const session = (process.env.WAHA_SESSION ?? DEFAULT_WAHA_SESSION).trim() || DEFAULT_WAHA_SESSION;

  const parsedTimeout = Number(process.env.WAHA_REQUEST_TIMEOUT_MS ?? DEFAULT_WAHA_TIMEOUT_MS);
  const timeoutMs = Number.isFinite(parsedTimeout) && parsedTimeout > 0 ? parsedTimeout : DEFAULT_WAHA_TIMEOUT_MS;

  const apiKey = process.env.WAHA_API_KEY?.trim() || null;

  return {
    baseUrl,
    session,
    timeoutMs,
    apiKey,
  };
}

function parseJsonSafely(text: string) {
  if (!text) return null;
  try {
    return JSON.parse(text) as unknown;
  } catch {
    return { raw: text };
  }
}

function getErrorFromPayload(payload: unknown) {
  if (!payload || typeof payload !== "object") return null;
  const data = payload as Record<string, unknown>;
  return (
    readString(data.error) ??
    readString(data.message) ??
    readString(data.reason) ??
    readString(data.detail)
  );
}

function resolveText(payload: Record<string, unknown>) {
  return (
    readString(payload.body) ??
    readString(payload.text) ??
    readString(payload.message) ??
    readString(payload.caption) ??
    readString((payload.content as Record<string, unknown> | undefined)?.text) ??
    readString((payload._data as Record<string, unknown> | undefined)?.body) ??
    null
  );
}

function resolveChatId({
  payload,
  from,
  to,
  fromMe,
}: {
  payload: Record<string, unknown>;
  from: string;
  to: string | null;
  fromMe: boolean;
}) {
  const explicitChatId = readString(payload.chatId) ?? readString(payload.chat_id);
  if (explicitChatId) {
    return explicitChatId.endsWith("@s.whatsapp.net")
      ? `${explicitChatId.replace(/@s\.whatsapp\.net$/i, "")}@c.us`
      : explicitChatId;
  }

  if (fromMe) {
    return to ?? from;
  }

  return from || to;
}

function resolveMessageId(eventPayload: Record<string, unknown>, session: string, timestamp: number) {
  const payload = (eventPayload.payload ?? null) as Record<string, unknown> | null;
  return (
    readString(payload?.id) ??
    readString(payload?.messageId) ??
    readString(eventPayload.id) ??
    `${session}:${timestamp}`
  );
}

export class WahaProvider implements WhatsAppProvider {
  getProviderName() {
    return "waha" as const;
  }

  async sendText(input: SendTextInput): Promise<SendTextResult> {
    const config = getWahaConfig();
    const session = input.session?.trim() || config.session;
    const chatId = toWahaChatId(input.target);

    const controller = new AbortController();
    const timeout = setTimeout(() => {
      controller.abort();
    }, config.timeoutMs);

    try {
      const response = await fetch(`${config.baseUrl}/api/sendText`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(config.apiKey ? { "X-Api-Key": config.apiKey } : {}),
        },
        body: JSON.stringify({
          session,
          chatId,
          text: input.text,
        }),
        cache: "no-store",
        signal: controller.signal,
      });

      const text = await response.text();
      const payload = parseJsonSafely(text);
      const messageId =
        readString((payload as Record<string, unknown> | null)?.id) ??
        readString((payload as Record<string, unknown> | null)?.messageId) ??
        null;

      if (!response.ok) {
        return {
          ok: false,
          status: response.status,
          payload,
          provider: "waha",
          session,
          chatId,
          messageId,
          error: getErrorFromPayload(payload) ?? `WAHA mengembalikan status HTTP ${response.status}.`,
        };
      }

      return {
        ok: true,
        status: response.status,
        payload,
        provider: "waha",
        session,
        chatId,
        messageId,
      };
    } catch (error) {
      const isAbortError = error instanceof Error && error.name === "AbortError";
      return {
        ok: false,
        status: isAbortError ? 504 : 500,
        payload: null,
        provider: "waha",
        session,
        chatId,
        messageId: null,
        error: isAbortError
          ? `Request ke WAHA timeout setelah ${config.timeoutMs}ms.`
          : error instanceof Error
            ? error.message
            : "Gagal menghubungi WAHA.",
      };
    } finally {
      clearTimeout(timeout);
    }
  }

  async normalizeIncomingWebhook(payload: unknown): Promise<NormalizedIncomingMessage | null> {
    if (!payload || typeof payload !== "object") return null;
    const data = payload as Record<string, unknown>;

    const event = readString(data.event);
    if (event !== "message" && event !== "message.any") {
      return null;
    }

    const innerPayload =
      data.payload && typeof data.payload === "object" ? (data.payload as Record<string, unknown>) : null;
    if (!innerPayload) return null;

    const session = readString(data.session) ?? getWahaConfig().session;
    const fromMe = innerPayload.fromMe === true;

    const from = readString(innerPayload.from) ?? readString(data.from) ?? "";
    const to =
      readString(innerPayload.to) ??
      readString(data.to) ??
      readString((data.me as Record<string, unknown> | undefined)?.id);

    const chatId = resolveChatId({ payload: innerPayload, from, to, fromMe });
    if (!chatId) return null;

    const text = resolveText(innerPayload);
    if (!text) return null;

    const isGroup = isGroupChatId(chatId);
    const participant = readString(innerPayload.participant);

    const phone =
      extractPhoneFromWhatsAppId(
        isGroup ? participant ?? from ?? to : fromMe ? to ?? from : from ?? to,
      ) ??
      extractPhoneFromWhatsAppId(chatId);

    if (!phone) return null;

    const timestamp = toMillisecondsTimestamp(innerPayload.timestamp ?? data.timestamp);
    const messageId = resolveMessageId(data, session, timestamp);

    return {
      provider: "waha",
      session,
      messageId,
      from,
      to: to ?? null,
      phone,
      chatId,
      text,
      timestamp,
      isGroup,
      fromMe,
      rawPayload: payload,
    };
  }
}
