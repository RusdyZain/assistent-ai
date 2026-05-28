import assert from "node:assert/strict";
import test from "node:test";

import { shouldIgnoreIncomingMessage } from "@/lib/whatsapp/incoming";
import type { NormalizedIncomingMessage } from "@/lib/whatsapp/types";

function buildMessage(overrides: Partial<NormalizedIncomingMessage> = {}): NormalizedIncomingMessage {
  return {
    provider: "waha",
    session: "default",
    messageId: "msg-1",
    from: "62811111111@c.us",
    to: "62822222222@c.us",
    phone: "62811111111",
    chatId: "62811111111@c.us",
    text: "halo",
    timestamp: Date.now(),
    isGroup: false,
    fromMe: false,
    rawPayload: {},
    ...overrides,
  };
}

test("shouldIgnoreIncomingMessage ignores null/invalid input", () => {
  assert.equal(shouldIgnoreIncomingMessage(null), true);
});

test("shouldIgnoreIncomingMessage ignores fromMe messages", () => {
  assert.equal(shouldIgnoreIncomingMessage(buildMessage({ fromMe: true })), true);
});

test("shouldIgnoreIncomingMessage accepts inbound customer messages", () => {
  assert.equal(shouldIgnoreIncomingMessage(buildMessage()), false);
});
