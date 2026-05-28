import { readString } from "@/lib/whatsapp/utils";

const DEFAULT_WAHA_BASE_URL = "http://localhost:3000";
const DEFAULT_WAHA_SESSION = "default";
const DEFAULT_WAHA_TIMEOUT_MS = 15_000;

function getConfig(sessionOverride?: string | null) {
  const baseUrl = (process.env.WAHA_BASE_URL ?? DEFAULT_WAHA_BASE_URL).trim().replace(/\/+$/, "");
  const session = sessionOverride?.trim() || process.env.WAHA_SESSION?.trim() || DEFAULT_WAHA_SESSION;

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

function parseFailureReason(payload: unknown, fallback: string) {
  if (!payload || typeof payload !== "object") return fallback;
  const data = payload as Record<string, unknown>;

  return (
    readString(data.message) ??
    readString(data.error) ??
    readString(data.reason) ??
    readString(data.detail) ??
    fallback
  );
}

export async function checkWahaSession(sessionOverride?: string | null) {
  const config = getConfig(sessionOverride);
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), config.timeoutMs);

  try {
    const response = await fetch(
      `${config.baseUrl}/api/sessions/${encodeURIComponent(config.session)}`,
      {
        method: "GET",
        headers: {
          Accept: "application/json",
          ...(config.apiKey ? { "X-Api-Key": config.apiKey } : {}),
        },
        cache: "no-store",
        signal: controller.signal,
      },
    );

    const text = await response.text();
    const payload = parseJsonSafely(text);

    if (!response.ok) {
      return {
        ok: false as const,
        status: response.status,
        error: parseFailureReason(payload, "Gagal membaca status session WAHA."),
        payload,
      };
    }

    const payloadObject = payload as Record<string, unknown>;
    const me = payloadObject.me as Record<string, unknown> | undefined;

    return {
      ok: true as const,
      status: response.status,
      data: {
        provider: "waha" as const,
        session: config.session,
        status: readString(payloadObject.status),
        engine: readString((payloadObject.engine as Record<string, unknown> | undefined)?.engine),
        me: {
          id: readString(me?.id),
          pushName: readString(me?.pushName),
        },
      },
      payload,
    };
  } catch (error) {
    const isAbortError = error instanceof Error && error.name === "AbortError";
    return {
      ok: false as const,
      status: isAbortError ? 504 : 500,
      error: isAbortError
        ? `Request ke WAHA timeout setelah ${config.timeoutMs}ms.`
        : error instanceof Error
          ? error.message
          : "Gagal menghubungi WAHA.",
      payload: null,
    };
  } finally {
    clearTimeout(timeout);
  }
}
