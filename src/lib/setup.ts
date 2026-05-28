import type { ReplyTemplateType } from "@prisma/client";

export const SETUP_STEPS = [
  { step: 1, label: "Profil Bisnis" },
  { step: 2, label: "Aturan Penjualan" },
  { step: 3, label: "Produk / Layanan" },
  { step: 4, label: "Template Balasan" },
  { step: 5, label: "Knowledge Base" },
  { step: 6, label: "Aturan Follow-up" },
  { step: 7, label: "Koneksi WhatsApp (WAHA)" },
] as const;

export const BUSINESS_CATEGORY_OPTIONS = [
  "Spa & Wellness",
  "Beauty Clinic",
  "Furniture Store",
  "Fashion Brand",
  "Hampers Business",
  "Property Leads",
  "Travel Booking",
  "Education/Course",
  "Other",
] as const;

export const BRAND_TONE_OPTIONS = [
  "friendly",
  "professional",
  "casual",
  "formal",
  "premium",
] as const;

export const REPLY_TEMPLATE_TYPES = [
  "greeting",
  "ask_price",
  "ask_stock",
  "ask_location",
  "ask_booking",
  "ask_payment",
  "order_recap",
  "follow_up_warm",
  "follow_up_hot",
  "payment_reminder",
  "complaint_response",
  "closing_message",
] as const satisfies readonly ReplyTemplateType[];

export const REPLY_TEMPLATE_TYPE_LABEL: Record<ReplyTemplateType, string> = {
  greeting: "Greeting",
  ask_price: "Ask Price",
  ask_stock: "Ask Stock",
  ask_location: "Ask Location",
  ask_booking: "Ask Booking",
  ask_payment: "Ask Payment",
  order_recap: "Order Recap",
  follow_up_warm: "Follow-up Warm",
  follow_up_hot: "Follow-up Hot",
  payment_reminder: "Payment Reminder",
  complaint_response: "Complaint Response",
  closing_message: "Closing Message",
};

export const KNOWLEDGE_CATEGORIES = [
  "address",
  "payment",
  "booking",
  "shipping",
  "refund",
  "reschedule",
  "promo",
  "faq",
  "other",
] as const;

export const KNOWLEDGE_CATEGORY_LABEL: Record<(typeof KNOWLEDGE_CATEGORIES)[number], string> = {
  address: "Alamat",
  payment: "Pembayaran",
  booking: "Booking",
  shipping: "Pengiriman",
  refund: "Refund",
  reschedule: "Reschedule",
  promo: "Promo",
  faq: "FAQ",
  other: "Lainnya",
};

type SetupCompletionInput = {
  business: {
    name: string;
    businessCategory: string | null;
    businessDescription: string | null;
    businessLocation: string | null;
    serviceArea: string | null;
    operatingHours: string | null;
    whatsappNumber: string | null;
    replyLanguage: string;
    brandTone: string;
    acceptsCOD: boolean;
    acceptsTransfer: boolean;
    acceptsQRIS: boolean;
    requiresDownPayment: boolean;
    downPaymentAmount: number | null;
    downPaymentPercentage: number | null;
    allowNegotiation: boolean;
    minimumOrder: number | null;
    refundPolicy: string | null;
    reschedulePolicy: string | null;
    shippingPolicy: string | null;
    paymentInstructions: string | null;
    orderProcess: string | null;
    warmLeadFollowUpHours: number;
    hotLeadFollowUpHours: number;
    closingPriorityFollowUpHours: number;
    waitingPaymentFollowUpHours: number;
    maxFollowUpCount: number;
    markLostAfterDays: number;
  };
  productCount: number;
  activeTemplateTypes: ReplyTemplateType[];
  knowledgeCount: number;
};

function hasText(value: string | null | undefined) {
  return Boolean(value && value.trim().length > 0);
}

export function evaluateSetupCompletion(input: SetupCompletionInput) {
  const businessProfileComplete = [
    hasText(input.business.name),
    hasText(input.business.businessCategory),
    hasText(input.business.businessDescription),
    hasText(input.business.businessLocation),
    hasText(input.business.serviceArea),
    hasText(input.business.operatingHours),
    hasText(input.business.whatsappNumber),
    hasText(input.business.replyLanguage),
    hasText(input.business.brandTone),
  ].every(Boolean);

  const salesRulesComplete = [
    input.business.acceptsCOD || input.business.acceptsTransfer || input.business.acceptsQRIS,
    !input.business.requiresDownPayment ||
      input.business.downPaymentAmount !== null ||
      input.business.downPaymentPercentage !== null,
    hasText(input.business.refundPolicy),
    hasText(input.business.reschedulePolicy),
    hasText(input.business.shippingPolicy),
    hasText(input.business.paymentInstructions),
    hasText(input.business.orderProcess),
  ].every(Boolean);

  const followUpRulesComplete = [
    input.business.warmLeadFollowUpHours > 0,
    input.business.hotLeadFollowUpHours > 0,
    input.business.closingPriorityFollowUpHours > 0,
    input.business.waitingPaymentFollowUpHours > 0,
    input.business.maxFollowUpCount >= 0,
    input.business.markLostAfterDays > 0,
  ].every(Boolean);

  const templateTypes = new Set(input.activeTemplateTypes);
  const templatesComplete = REPLY_TEMPLATE_TYPES.every((type) => templateTypes.has(type));

  const steps = [
    businessProfileComplete,
    salesRulesComplete,
    input.productCount > 0,
    templatesComplete,
    input.knowledgeCount > 0,
    followUpRulesComplete,
    hasText(input.business.whatsappNumber),
  ];

  const setupCompleted = steps.every(Boolean);
  const firstIncomplete = steps.findIndex((done) => !done);
  const setupStep = firstIncomplete === -1 ? SETUP_STEPS.length : firstIncomplete + 1;

  return {
    setupCompleted,
    setupStep,
    steps,
  };
}
