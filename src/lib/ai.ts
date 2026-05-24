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
    description: string | null;
    price: string | number;
    stock: number;
    category: string | null;
    keywords: string[];
    isActive: boolean;
  }>;
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
    price: Number(item.price),
    stock: item.stock,
    category: item.category,
    keywords: item.keywords,
    active: item.isActive,
  }));

  return {
    instruction: `Anda adalah AI asisten sales WhatsApp untuk bisnis Indonesia. Analisis percakapan WhatsApp dan hasilkan JSON valid saja tanpa markdown.
Aturan:
1) Jangan mengaku manusia.
2) Balasan WA harus friendly, hangat, santai-profesional, dan tidak kaku.
3) Prioritaskan gaya bahasa percakapan Indonesia sehari-hari (contoh: "kak", "boleh", "siap", "oke").
4) Hindari bahasa terlalu formal/korporat seperti "terkait", "dengan hormat", "kami catat", "mohon informasinya", kecuali customer memang sangat formal.
5) Balasan ideal 1-2 kalimat pendek, langsung ke inti, dan maksimal 1 pertanyaan lanjutan.
6) Jika customer menulis singkat, jawab singkat juga; jika customer santai, ikut santai tetap sopan.
7) Jangan janji stok/harga/diskon/pengiriman jika data produk tidak mendukung.
8) Jika informasi kurang, tanyakan hanya 1 pertanyaan terpenting.
9) Tidak boleh auto kirim, hanya draft balasan.
10) Jika ragu, sarankan admin verifikasi.
11) Jangan pernah merekomendasikan pengiriman pesan berulang/agresif ke customer yang sama.
12) Jika internalNotesOnly=true, buat catatan internal singkat dan kosongkan suggestedReply.
`,
    payload: {
      conversation: input.conversation,
      messages: latestMessages,
      products: productContext,
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
