import OpenAI from "openai";
import { z } from "zod";

import {
  AIAnalysisResult,
  INTENT_VALUES,
  LEAD_STATUS_VALUES,
  NEXT_ACTION_VALUES,
} from "@/types/sales";

const analysisSchema = z.object({
  intent: z.enum(INTENT_VALUES),
  leadStatus: z.enum(LEAD_STATUS_VALUES),
  summary: z.string().min(1),
  extractedOrder: z.object({
    product: z.string().nullable(),
    quantity: z.number().int().positive().nullable(),
    deadline: z.string().nullable(),
    budget: z.number().positive().nullable(),
    address: z.string().nullable(),
    notes: z.string().nullable(),
  }),
  suggestedReply: z.string(),
  nextAction: z.enum(NEXT_ACTION_VALUES),
});

type AnalyzeConversationInput = {
  conversation: {
    id: string;
    summary: string | null;
    lastIntent: string | null;
    internalNotesOnly?: boolean;
  };
  messages: Array<{
    direction: "incoming" | "outgoing";
    message: string;
    createdAt: Date;
  }>;
  products: Array<{
    name: string;
    type: "product" | "service";
    description: string | null;
    price: string | number;
    promoPrice: string | number | null;
    benefits: string | null;
    suitableFor: string | null;
    stock: number;
    stockStatus: string | null;
    availability: string | null;
    duration: string | null;
    minimumOrder: number | null;
    processingTime: string | null;
    deliveryInfo: string | null;
    category: string | null;
    keywords: string[];
    faq: unknown;
    tags: string[];
    isActive: boolean;
  }>;
  businessProfile: {
    businessName: string;
    businessCategory: string | null;
    businessDescription: string | null;
    businessLocation: string | null;
    serviceArea: string | null;
    operatingHours: string | null;
    whatsappNumber: string | null;
    replyLanguage: string;
    brandTone: string;
  };
  salesRules: {
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
  };
  replyTemplates: Array<{
    type: string;
    title: string;
    content: string;
    isActive: boolean;
  }>;
  knowledgeBase: Array<{
    title: string;
    category: string;
    content: string;
    isActive: boolean;
  }>;
  followUpRules: {
    warmLeadFollowUpHours: number;
    hotLeadFollowUpHours: number;
    closingPriorityFollowUpHours: number;
    waitingPaymentFollowUpHours: number;
    maxFollowUpCount: number;
    markLostAfterDays: number;
  };
};

const FALLBACK_RESULT: AIAnalysisResult = {
  intent: "unknown",
  leadStatus: "cold",
  summary: "Pelanggan baru chat dan butuh ditindaklanjuti.",
  extractedOrder: {
    product: null,
    quantity: null,
    deadline: null,
    budget: null,
    address: null,
    notes: null,
  },
  suggestedReply:
    "Halo kak, makasih udah chat. Lagi cari produk apa ya biar aku bantu cek cepat?",
  nextAction: "ask_more_info",
};

function createPrompt(input: AnalyzeConversationInput) {
  const latestMessages = input.messages.slice(-20).map((item) => ({
    role: item.direction,
    message: item.message,
    time: item.createdAt.toISOString(),
  }));

  const productContext = input.products.slice(0, 50).map((item) => ({
    name: item.name,
    type: item.type,
    description: item.description,
    price: Number(item.price),
    promoPrice: item.promoPrice ? Number(item.promoPrice) : null,
    benefits: item.benefits,
    suitableFor: item.suitableFor,
    stock: item.stock,
    stockStatus: item.stockStatus,
    availability: item.availability,
    duration: item.duration,
    minimumOrder: item.minimumOrder,
    processingTime: item.processingTime,
    deliveryInfo: item.deliveryInfo,
    category: item.category,
    keywords: item.keywords,
    faq: item.faq,
    tags: item.tags,
    active: item.isActive,
  }));

  const templateContext = input.replyTemplates
    .filter((item) => item.isActive)
    .slice(0, 20)
    .map((item) => ({
      type: item.type,
      title: item.title,
      content: item.content,
    }));

  const knowledgeContext = input.knowledgeBase
    .filter((item) => item.isActive)
    .slice(0, 50)
    .map((item) => ({
      title: item.title,
      category: item.category,
      content: item.content,
    }));

  return {
    instruction: `Anda adalah AI asisten sales WhatsApp untuk bisnis Indonesia. Analisis percakapan WhatsApp dan hasilkan JSON valid saja tanpa markdown.
Aturan:
1) Jangan mengaku manusia.
2) Gunakan brandTone bisnis sebagai gaya komunikasi utama, lalu sesuaikan dengan konteks customer.
3) Prioritaskan gaya bahasa percakapan Indonesia sehari-hari (contoh: "kak", "boleh", "siap", "oke").
4) Hindari bahasa terlalu formal/korporat seperti "terkait", "dengan hormat", "kami catat", "mohon informasinya", kecuali customer memang sangat formal.
5) Balasan ideal 1-2 kalimat pendek, langsung ke inti, dan maksimal 1 pertanyaan lanjutan.
6) Jika customer menulis singkat, jawab singkat juga; jika customer santai, ikut santai tetap sopan.
7) DILARANG mengarang harga, promo, kebijakan, jam operasional, lokasi, atau aturan pembayaran. Jika data tidak ada, minta admin verifikasi.
8) Jika informasi kurang, tanyakan hanya 1 pertanyaan terpenting.
9) Tidak boleh auto kirim, hanya draft balasan.
10) Jika ragu, sarankan admin verifikasi.
11) Jangan pernah merekomendasikan pengiriman pesan berulang/agresif ke customer yang sama.
12) Jika internalNotesOnly=true, buat catatan internal singkat dan kosongkan suggestedReply.
13) Gunakan knowledge base sebagai sumber kebenaran untuk alamat, pembayaran, booking, pengiriman, refund, reschedule, promo, dan FAQ.
14) Gunakan reply template yang cocok berdasarkan konteks pertanyaan customer bila tersedia.
15) Saat membuat extractedOrder, gunakan hanya produk/layanan aktif dari katalog.
16) Tulis balasan utama dalam bahasa sesuai replyLanguage bisnis.
`,
    payload: {
      conversation: input.conversation,
      messages: latestMessages,
      businessProfile: input.businessProfile,
      salesRules: input.salesRules,
      products: productContext,
      replyTemplates: templateContext,
      knowledgeBase: knowledgeContext,
      followUpRules: input.followUpRules,
      outputFormat: {
        intent:
          "order_inquiry | price_question | stock_question | shipping_question | complaint | payment_confirmation | general_question | unknown",
        leadStatus: "hot | warm | cold | complaint | deal | lost",
        summary: "ringkasan singkat kebutuhan pelanggan dalam bahasa Indonesia",
        extractedOrder: {
          product: "string | null",
          quantity: "number | null",
          deadline: "string | null",
          budget: "number | null",
          address: "string | null",
          notes: "string | null",
        },
        suggestedReply: "draf balasan natural bahasa Indonesia",
        nextAction:
          "reply_now | ask_more_info | follow_up_later | create_order | handle_complaint",
      },
    },
  };
}

export async function analyzeConversation(
  input: AnalyzeConversationInput,
): Promise<AIAnalysisResult> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return FALLBACK_RESULT;
  }

  const model = process.env.OPENAI_MODEL ?? "gpt-4.1-mini";
  const client = new OpenAI({ apiKey });
  const prompt = createPrompt(input);

  try {
    const response = await client.chat.completions.create({
      model,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content: prompt.instruction,
        },
        {
          role: "user",
          content: JSON.stringify(prompt.payload),
        },
      ],
      temperature: 0.2,
    });

    const content = response.choices[0]?.message?.content;
    if (!content) return FALLBACK_RESULT;

    const parsed = analysisSchema.safeParse(JSON.parse(content));
    if (!parsed.success) {
      return {
        ...FALLBACK_RESULT,
        suggestedReply: input.conversation.internalNotesOnly ? "" : FALLBACK_RESULT.suggestedReply,
      };
    }

    if (input.conversation.internalNotesOnly) {
      return {
        ...parsed.data,
        suggestedReply: "",
        nextAction: "ask_more_info",
      };
    }

    return parsed.data;
  } catch {
    return {
      ...FALLBACK_RESULT,
      suggestedReply: input.conversation.internalNotesOnly ? "" : FALLBACK_RESULT.suggestedReply,
    };
  }
}
