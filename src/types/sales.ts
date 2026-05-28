import type { SendTextResult } from "@/lib/whatsapp/types";

export const INTENT_VALUES = [
  "order_inquiry",
  "price_question",
  "stock_question",
  "shipping_question",
  "complaint",
  "payment_confirmation",
  "general_question",
  "unknown",
] as const;

export const NEXT_ACTION_VALUES = [
  "reply_now",
  "ask_more_info",
  "follow_up_later",
  "create_order",
  "handle_complaint",
] as const;

export const LEAD_STATUS_VALUES = [
  "hot",
  "warm",
  "cold",
  "complaint",
  "deal",
  "lost",
] as const;

export type IntentType = (typeof INTENT_VALUES)[number];
export type NextActionType = (typeof NEXT_ACTION_VALUES)[number];
export type LeadStatusType = (typeof LEAD_STATUS_VALUES)[number];

export interface ExtractedOrder {
  product: string | null;
  quantity: number | null;
  deadline: string | null;
  budget: number | null;
  address: string | null;
  notes: string | null;
}

export interface AIAnalysisResult {
  intent: IntentType;
  leadStatus: LeadStatusType;
  summary: string;
  extractedOrder: ExtractedOrder;
  suggestedReply: string;
  nextAction: NextActionType;
}

export interface DraftOrderItem {
  product: string;
  quantity: number;
  estimatedPrice?: number | null;
}

export const SEND_GUARD_CODES = [
  "NO_INBOUND_HISTORY",
  "CUSTOMER_DAILY_LIMIT",
  "BUSINESS_DAILY_LIMIT",
  "SPAM_SUSPECTED",
  "COOLDOWN_ACTIVE",
] as const;

export type SendGuardCode = (typeof SEND_GUARD_CODES)[number];

export interface CanSendResult {
  allowed: boolean;
  reason?: string;
  code?: SendGuardCode;
  cooldownSecondsRemaining?: number;
  customerOutgoingToday?: number;
  businessOutgoingToday?: number;
}

export interface SafeSendParams {
  businessId: string;
  customerId: string;
  conversationId?: string;
  target: string;
  message: string;
  inboxId?: string;
}

export interface SafeSendResult {
  ok: boolean;
  blocked?: boolean;
  code?: SendGuardCode;
  reason?: string;
  sendResult?: SendTextResult;
  cooldownAppliedSeconds?: number;
  customerOutgoingToday?: number;
  businessOutgoingToday?: number;
}
