import type { NormalizedIncomingMessage } from "@/lib/whatsapp/types";

export function shouldIgnoreIncomingMessage(message: NormalizedIncomingMessage | null) {
  if (!message) return true;
  if (message.fromMe) return true;
  if (!message.text.trim()) return true;
  return false;
}
