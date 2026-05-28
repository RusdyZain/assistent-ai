import assert from "node:assert/strict";
import test from "node:test";

import { WahaProvider } from "@/lib/whatsapp/providers/waha";

test("WahaProvider.sendText generates WAHA payload and headers", async (t) => {
  const originalFetch = globalThis.fetch;
  const originalEnv = { ...process.env };

  t.after(() => {
    globalThis.fetch = originalFetch;
    process.env = originalEnv;
  });

  process.env.WAHA_BASE_URL = "http://waha.local:3000";
  process.env.WAHA_SESSION = "default";
  process.env.WAHA_API_KEY = "secret-key";
  process.env.WAHA_REQUEST_TIMEOUT_MS = "15000";

  let capturedUrl = "";
  let capturedInit: RequestInit | undefined;

  globalThis.fetch = (async (input: URL | RequestInfo, init?: RequestInit) => {
    capturedUrl = String(input);
    capturedInit = init;
    return new Response(JSON.stringify({ id: "wamid-123" }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
      },
    });
  }) as typeof fetch;

  const provider = new WahaProvider();
  const result = await provider.sendText({
    target: "0812-345 678",
    text: "Halo WAHA",
  });

  assert.equal(result.ok, true);
  assert.equal(capturedUrl, "http://waha.local:3000/api/sendText");
  assert.ok(capturedInit);

  const payload = JSON.parse(String(capturedInit?.body));
  assert.deepEqual(payload, {
    session: "default",
    chatId: "62812345678@c.us",
    text: "Halo WAHA",
  });

  const headers = capturedInit?.headers as Record<string, string>;
  assert.equal(headers["X-Api-Key"], "secret-key");
});

test("WahaProvider.normalizeIncomingWebhook normalizes message payload", async () => {
  const provider = new WahaProvider();
  const normalized = await provider.normalizeIncomingWebhook({
    event: "message",
    session: "default",
    payload: {
      id: "true_62811111111@c.us_ABC123",
      timestamp: 1710000000,
      from: "62811111111@c.us",
      to: "62822222222@c.us",
      fromMe: false,
      body: "Halo dari customer",
    },
  });

  assert.ok(normalized);
  assert.equal(normalized?.provider, "waha");
  assert.equal(normalized?.session, "default");
  assert.equal(normalized?.messageId, "true_62811111111@c.us_ABC123");
  assert.equal(normalized?.phone, "62811111111");
  assert.equal(normalized?.chatId, "62811111111@c.us");
  assert.equal(normalized?.text, "Halo dari customer");
  assert.equal(normalized?.fromMe, false);
});

test("WahaProvider.normalizeIncomingWebhook returns null for unsupported events", async () => {
  const provider = new WahaProvider();
  const normalized = await provider.normalizeIncomingWebhook({
    event: "message.ack",
    session: "default",
    payload: {
      id: "id-1",
    },
  });

  assert.equal(normalized, null);
});

test("WahaProvider.normalizeIncomingWebhook keeps fromMe flag", async () => {
  const provider = new WahaProvider();
  const normalized = await provider.normalizeIncomingWebhook({
    event: "message.any",
    session: "default",
    payload: {
      id: "id-2",
      timestamp: 1710000000,
      from: "62811111111@c.us",
      to: "62822222222@c.us",
      fromMe: true,
      body: "Outgoing echo",
    },
  });

  assert.equal(normalized?.fromMe, true);
});
