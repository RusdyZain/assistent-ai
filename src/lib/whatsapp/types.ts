export type WhatsAppProviderName = "waha";

export interface SendTextInput {
  target: string;
  text: string;
  session?: string;
}

export interface SendTextResult {
  ok: boolean;
  status: number;
  payload: unknown;
  provider: WhatsAppProviderName;
  session: string;
  chatId: string;
  messageId: string | null;
  error?: string;
}

export interface NormalizedIncomingMessage {
  provider: "waha";
  session: string;
  messageId: string;
  from: string;
  to: string | null;
  phone: string;
  chatId: string;
  text: string;
  timestamp: number;
  isGroup: boolean;
  fromMe: boolean;
  rawPayload: unknown;
}

export interface WhatsAppProvider {
  sendText(input: SendTextInput): Promise<SendTextResult>;
  normalizeIncomingWebhook(payload: unknown): Promise<NormalizedIncomingMessage | null>;
  getProviderName(): WhatsAppProviderName;
}
