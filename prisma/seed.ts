import bcrypt from "bcryptjs";

import { PrismaClient } from "@prisma/client";
import { DEFAULT_BUSINESS_EMAIL, DEFAULT_LOGIN_PASSWORD } from "../src/lib/constants";

const prisma = new PrismaClient();

const nusadexKnowledgeBase = [
  {
    title: "Tentang Nusadex",
    category: "other" as const,
    content:
      "Nusadex adalah Digital Technology Studio yang membantu bisnis membangun website, sistem digital, dashboard, automasi, dan integrasi AI agar operasional lebih rapi, profesional, dan siap berkembang.",
  },
  {
    title: "Positioning Nusadex",
    category: "other" as const,
    content:
      "Nusadex bukan sekadar jasa coding. Kami berperan sebagai partner strategis untuk merancang infrastruktur digital bisnis, mulai dari alur kerja, sistem, website, database, hingga AI integration.",
  },
  {
    title: "Layanan Website Bisnis",
    category: "other" as const,
    content:
      "Nusadex melayani pembuatan website company profile, landing page, website booking, katalog produk, website properti, website sekolah, website klinik/spa, dan website custom sesuai kebutuhan bisnis.",
  },
  {
    title: "Layanan Sistem Digital",
    category: "other" as const,
    content:
      "Nusadex dapat membangun sistem digital seperti admin panel, CRM, sistem booking, sistem order, dashboard laporan, manajemen customer, manajemen produk, dan sistem operasional bisnis lainnya.",
  },
  {
    title: "Layanan AI Integration",
    category: "other" as const,
    content:
      "Nusadex membantu integrasi AI untuk kebutuhan bisnis seperti chatbot, auto-reply, analisis data customer, rekomendasi produk, follow-up otomatis, dan automasi proses kerja tertentu.",
  },
  {
    title: "Alur Kerja Project",
    category: "booking" as const,
    content:
      "Alur kerja Nusadex dimulai dari diskusi kebutuhan, analisis masalah bisnis, penyusunan konsep solusi, penawaran harga, development, testing, revisi, deployment, dan support awal setelah project selesai.",
  },
  {
    title: "Konsultasi Awal",
    category: "booking" as const,
    content:
      "Untuk konsultasi awal, calon klien dapat menjelaskan jenis bisnis, masalah yang sedang dihadapi, fitur yang dibutuhkan, referensi desain jika ada, dan target penggunaan sistem atau website.",
  },
  {
    title: "Estimasi Harga",
    category: "other" as const,
    content:
      "Harga project Nusadex menyesuaikan kebutuhan, kompleksitas fitur, jumlah halaman, sistem admin, integrasi, dan tingkat custom. Untuk estimasi lebih akurat, tim perlu memahami kebutuhan bisnis terlebih dahulu.",
  },
  {
    title: "Estimasi Waktu Pengerjaan",
    category: "other" as const,
    content:
      "Estimasi pengerjaan bergantung pada skala project. Website sederhana biasanya lebih cepat, sedangkan sistem custom dengan admin panel, database, dan integrasi membutuhkan waktu lebih panjang.",
  },
  {
    title: "Metode Pembayaran",
    category: "payment" as const,
    content:
      "Pembayaran project Nusadex dapat dilakukan melalui transfer bank/e-wallet sesuai invoice. Untuk memulai project, biasanya diperlukan DP terlebih dahulu sesuai kesepakatan.",
  },
  {
    title: "Ketentuan DP Project",
    category: "payment" as const,
    content:
      "DP digunakan sebagai tanda jadi project dan untuk memulai proses analisis, desain, dan development. Besaran DP menyesuaikan nilai project dan kesepakatan dengan klien.",
  },
  {
    title: "Revisi Project",
    category: "other" as const,
    content:
      "Revisi dilakukan berdasarkan scope awal yang telah disepakati. Perubahan besar di luar scope awal dapat dihitung sebagai tambahan pekerjaan atau pengembangan tahap berikutnya.",
  },
  {
    title: "Maintenance Website/Sistem",
    category: "other" as const,
    content:
      "Nusadex dapat menyediakan layanan maintenance untuk update konten, perbaikan bug, backup, monitoring, dan pengembangan fitur lanjutan sesuai kebutuhan klien.",
  },
  {
    title: "Domain dan Hosting",
    category: "other" as const,
    content:
      "Nusadex dapat membantu pengaturan domain, hosting, VPS, deployment, SSL, email bisnis, dan konfigurasi teknis lainnya sesuai kebutuhan project.",
  },
  {
    title: "Kepemilikan Project",
    category: "other" as const,
    content:
      "Setelah project selesai dan pembayaran diselesaikan, hasil project diserahkan sesuai kesepakatan. Detail terkait source code, hosting, akses admin, dan aset digital perlu dijelaskan dalam perjanjian project.",
  },
  {
    title: "Kontak Nusadex",
    category: "other" as const,
    content:
      "Nusadex dapat dihubungi melalui WhatsApp resmi, email bisnis, dan website nusadex.com. Tim akan membantu menjadwalkan diskusi jika calon klien membutuhkan konsultasi lebih lanjut.",
  },
  {
    title: "Lokasi Nusadex",
    category: "address" as const,
    content:
      "Nusadex berbasis di Lombok, Nusa Tenggara Barat, dan dapat melayani project secara online maupun offline sesuai kebutuhan dan kesepakatan.",
  },
  {
    title: "Target Klien Nusadex",
    category: "other" as const,
    content:
      "Nusadex cocok untuk UMKM, brand lokal, bisnis jasa, spa/klinik, properti, sekolah, komunitas, instansi, dan bisnis yang ingin memiliki sistem digital sendiri.",
  },
  {
    title: "Keunggulan Nusadex",
    category: "other" as const,
    content:
      "Keunggulan Nusadex adalah pendekatan yang dimulai dari pemahaman masalah bisnis terlebih dahulu sebelum membuat sistem. Prinsip kami: Duduk dulu, mikir dulu, baru bangun solusi.",
  },
  {
    title: "Kebijakan Refund",
    category: "refund" as const,
    content:
      "Refund mengikuti kesepakatan project. Jika project sudah masuk tahap analisis, desain, atau development, biaya yang sudah digunakan untuk pekerjaan berjalan tidak dapat dikembalikan sepenuhnya.",
  },
  {
    title: "Reschedule Meeting",
    category: "reschedule" as const,
    content:
      "Jadwal meeting atau konsultasi dapat dijadwalkan ulang dengan konfirmasi terlebih dahulu, idealnya minimal beberapa jam sebelum jadwal yang sudah disepakati.",
  },
  {
    title: "Promo Website Bisnis",
    category: "promo" as const,
    content:
      "Nusadex dapat membuka promo tertentu untuk pembuatan website bisnis, landing page, atau sistem sederhana. Promo aktif akan diinformasikan oleh admin jika tersedia.",
  },
  {
    title: "FAQ Website vs Marketplace",
    category: "faq" as const,
    content:
      "Marketplace bagus untuk berjualan, tetapi website pribadi penting untuk membangun brand, database customer, kredibilitas, dan channel penjualan milik bisnis sendiri.",
  },
  {
    title: "FAQ Butuh Website atau Sistem",
    category: "faq" as const,
    content:
      "Jika bisnis hanya butuh tampil profesional dan menjelaskan layanan, website sudah cukup. Jika bisnis butuh mengelola data, booking, order, laporan, atau customer, maka dibutuhkan sistem/admin panel.",
  },
  {
    title: "FAQ AI untuk Bisnis",
    category: "faq" as const,
    content:
      "AI dapat membantu bisnis membalas chat, mengelola pertanyaan customer, membuat rekomendasi, menyusun follow-up, dan mempercepat pekerjaan berulang. Namun penerapannya harus disesuaikan dengan alur bisnis.",
  },
  {
    title: "Flow Percakapan BOT Nusadex",
    category: "other" as const,
    content:
      "Alur ideal: sapaan, tanya kebutuhan, tanya jenis bisnis, tanya kendala utama, tanya fitur, tanya budget dan timeline, rekap kebutuhan, lalu alihkan ke admin/sales untuk konsultasi lanjut.",
  },
  {
    title: "Data Lead yang Dikumpulkan BOT",
    category: "other" as const,
    content:
      "Nama calon klien, nama bisnis, bidang bisnis, kebutuhan, masalah utama, fitur yang diinginkan, budget, timeline, kontak, dan status lead (warm/hot/cold).",
  },
  {
    title: "Prinsip Jawaban BOT",
    category: "other" as const,
    content:
      "BOT Nusadex tidak langsung lempar angka harga. BOT harus menggali kebutuhan dulu agar solusi tepat, lalu arahkan ke konsultasi dan penyusunan scope project.",
  },
];

const nusadexReplyTemplates = [
  {
    type: "greeting" as const,
    title: "Sapaan Awal",
    content:
      "Halo kak, terima kasih sudah menghubungi Nusadex. Boleh info, saat ini Kakak ingin membuat website, sistem digital, atau konsultasi dulu terkait kebutuhan bisnisnya?",
  },
  {
    type: "ask_price" as const,
    title: "Jawaban Harga",
    content:
      "Untuk harga, kami perlu lihat dulu kebutuhan dan fitur yang diinginkan ya kak. Karena setiap project bisa berbeda tergantung jumlah halaman, fitur, admin panel, integrasi, dan tingkat custom-nya.",
  },
  {
    type: "ask_stock" as const,
    title: "Tanya Masalah Bisnis",
    content:
      "Saat ini kendala utama di bisnis Kakak apa ya? Apakah di promosi, pencatatan data, booking/order, follow-up customer, laporan, atau operasional yang masih manual?",
  },
  {
    type: "ask_location" as const,
    title: "Tanya Jenis Bisnis",
    content:
      "Boleh kami tahu bisnis Kakak bergerak di bidang apa? Misalnya kuliner, spa/klinik, properti, sekolah, retail, jasa, atau bidang lainnya.",
  },
  {
    type: "ask_booking" as const,
    title: "Ajakan Konsultasi",
    content:
      "Kalau Kakak berkenan, kita bisa jadwalkan diskusi singkat agar tim Nusadex bisa memahami kebutuhan bisnisnya lebih jelas sebelum memberikan penawaran.",
  },
  {
    type: "ask_payment" as const,
    title: "Info Pembayaran",
    content:
      "Untuk memulai project, biasanya diperlukan DP sesuai kesepakatan. Detail pembayaran akan kami informasikan melalui invoice atau arahan resmi dari tim Nusadex.",
  },
  {
    type: "order_recap" as const,
    title: "Rekap Kebutuhan",
    content:
      "Saya rekap dulu ya kak: bisnis [jenis bisnis], kebutuhan [website/sistem/AI], masalah utama [masalah], target waktu [timeline], dan budget estimasi [budget]. Apakah sudah sesuai?",
  },
  {
    type: "follow_up_warm" as const,
    title: "Follow-up Warm Lead",
    content:
      "Halo kak, saya mau follow-up diskusi sebelumnya. Apakah kebutuhan website/sistem digitalnya masih ingin dilanjutkan? Kalau iya, kami bisa bantu rapikan kebutuhannya dulu.",
  },
  {
    type: "follow_up_hot" as const,
    title: "Follow-up Hot Lead",
    content:
      "Halo kak, untuk kebutuhan project yang kemarin sudah dibahas, apakah Kakak ingin kami bantu lanjutkan ke tahap estimasi harga dan scope pekerjaan?",
  },
  {
    type: "payment_reminder" as const,
    title: "Follow-up Proposal",
    content:
      "Halo kak, apakah proposal/estimasi dari Nusadex sudah sempat dicek? Kalau ada bagian yang ingin ditanyakan atau disesuaikan, kami siap bantu jelaskan.",
  },
  {
    type: "complaint_response" as const,
    title: "Respon Komplain",
    content:
      "Terima kasih sudah menginformasikan ya kak. Mohon maaf atas kendalanya. Kami akan bantu cek dan follow-up ke tim terkait agar bisa segera dicarikan solusi terbaik.",
  },
  {
    type: "closing_message" as const,
    title: "Closing Message",
    content:
      "Terima kasih kak sudah menghubungi Nusadex. Semoga kami bisa membantu bisnis Kakak menjadi lebih rapi, profesional, dan siap berkembang secara digital.",
  },
];

async function main() {
  console.log("Seeding database...");

  await prisma.message.deleteMany();
  await prisma.messageSendLog.deleteMany();
  await prisma.followUp.deleteMany();
  await prisma.order.deleteMany();
  await prisma.conversation.deleteMany();
  await prisma.replyTemplate.deleteMany();
  await prisma.knowledgeBaseItem.deleteMany();
  await prisma.product.deleteMany();
  await prisma.customer.deleteMany();
  await prisma.webhookEvent.deleteMany();
  await prisma.business.deleteMany();

  const seedEmail = process.env.SEED_ADMIN_EMAIL ?? DEFAULT_BUSINESS_EMAIL;
  const seedPassword = process.env.SEED_ADMIN_PASSWORD ?? DEFAULT_LOGIN_PASSWORD;
  const passwordHash = await bcrypt.hash(seedPassword, 10);

  const business = await prisma.business.create({
    data: {
      name: "Nusadex",
      ownerName: "Ryan Fajri",
      phone: "6281133334444",
      email: seedEmail,
      passwordHash,
      fonnteToken: process.env.SEED_FONNTE_TOKEN ?? null,
      businessCategory: "Digital Technology Studio",
      businessDescription:
        "Partner strategis untuk membangun website, sistem digital, dashboard, automasi, dan integrasi AI untuk pertumbuhan bisnis.",
      businessLocation: "Lombok, Nusa Tenggara Barat",
      serviceArea: "Layanan online seluruh Indonesia, offline sesuai kesepakatan",
      operatingHours: "Senin-Sabtu 09:00-18:00 WITA",
      whatsappNumber: "6281133334444",
      replyLanguage: "Indonesia",
      brandTone: "professional",
      acceptsCOD: false,
      acceptsTransfer: true,
      acceptsQRIS: true,
      requiresDownPayment: true,
      downPaymentAmount: 1000000,
      downPaymentPercentage: 30,
      allowNegotiation: true,
      minimumOrder: 3000000,
      refundPolicy:
        "Refund mengikuti kesepakatan project. Jika project sudah masuk tahap analisis, desain, atau development, biaya yang sudah digunakan untuk pekerjaan berjalan tidak dapat dikembalikan sepenuhnya.",
      reschedulePolicy:
        "Meeting dapat dijadwalkan ulang dengan konfirmasi terlebih dahulu, idealnya minimal beberapa jam sebelum jadwal yang sudah disepakati.",
      shippingPolicy:
        "Tidak ada pengiriman fisik. Seluruh layanan berupa konsultasi, development, deployment, dan support digital.",
      paymentInstructions:
        "Pembayaran melalui transfer bank atau e-wallet sesuai invoice resmi dari tim Nusadex.",
      orderProcess:
        "Diskusi kebutuhan -> analisis masalah -> susun scope solusi -> kirim estimasi -> development -> testing -> revisi -> deployment.",
      warmLeadFollowUpHours: 24,
      hotLeadFollowUpHours: 4,
      closingPriorityFollowUpHours: 2,
      waitingPaymentFollowUpHours: 12,
      maxFollowUpCount: 3,
      markLostAfterDays: 7,
      setupCompleted: true,
      setupStep: 7,
    },
  });

  const services = await prisma.$transaction([
    prisma.product.create({
      data: {
        businessId: business.id,
        name: "Website Company Profile",
        type: "service",
        description:
          "Website profesional untuk memperkuat brand, menampilkan layanan, dan meningkatkan kredibilitas bisnis.",
        price: 7500000,
        promoPrice: 6500000,
        benefits: "Meningkatkan trust, mempermudah calon klien mengenal bisnis, siap SEO dasar.",
        suitableFor: "UMKM, brand lokal, klinik/spa, properti, sekolah, bisnis jasa.",
        stock: 999,
        stockStatus: "available",
        availability: "Open project slot bulanan",
        duration: "2-4 minggu",
        minimumOrder: 1,
        processingTime: "Kickoff maksimal 3 hari kerja setelah DP",
        deliveryInfo: "Fully online, meeting by WhatsApp/Google Meet.",
        category: "Website",
        keywords: ["website", "company profile", "branding"],
        faq: {
          termasuk: "UI modern, CMS dasar, mobile responsive",
          catatan: "Copywriting dan foto produk dapat dibantu sebagai add-on",
        },
        imageUrl: "https://images.unsplash.com/photo-1460925895917-afdab827c52f",
        tags: ["best-seller", "website"],
        isActive: true,
      },
    }),
    prisma.product.create({
      data: {
        businessId: business.id,
        name: "Landing Page Conversion",
        type: "service",
        description:
          "Landing page fokus konversi untuk campaign ads, lead collection, dan validasi penawaran.",
        price: 4500000,
        promoPrice: 3900000,
        benefits: "Menaikkan rasio inquiry, struktur CTA jelas, cocok untuk iklan berbayar.",
        suitableFor: "Bisnis jasa, kelas online, properti, launching produk.",
        stock: 999,
        stockStatus: "available",
        availability: "Open project slot bulanan",
        duration: "1-2 minggu",
        minimumOrder: 1,
        processingTime: "Kickoff maksimal 3 hari kerja setelah DP",
        deliveryInfo: "Fully online.",
        category: "Website",
        keywords: ["landing page", "conversion", "lead generation"],
        faq: "Disarankan siapkan objective campaign dan target market sebelum kickoff.",
        imageUrl: "https://images.unsplash.com/photo-1552664730-d307ca884978",
        tags: ["fast-delivery", "campaign"],
        isActive: true,
      },
    }),
    prisma.product.create({
      data: {
        businessId: business.id,
        name: "Sistem CRM & Admin Panel",
        type: "service",
        description:
          "Sistem digital custom untuk operasional: customer management, pipeline, booking/order, dan laporan.",
        price: 18500000,
        promoPrice: null,
        benefits: "Operasional lebih rapi, data terpusat, proses follow-up lebih terukur.",
        suitableFor: "Bisnis yang prosesnya masih manual dan butuh dashboard internal.",
        stock: 999,
        stockStatus: "available",
        availability: "Open project slot triwulan",
        duration: "4-8 minggu",
        minimumOrder: 1,
        processingTime: "Analisis awal 3-5 hari kerja",
        deliveryInfo: "Development bertahap dengan milestone.",
        category: "System",
        keywords: ["crm", "admin panel", "dashboard"],
        faq: "Scope final ditentukan setelah discovery dan mapping alur kerja.",
        imageUrl: "https://images.unsplash.com/photo-1553877522-43269d4ea984",
        tags: ["custom-system", "core-service"],
        isActive: true,
      },
    }),
    prisma.product.create({
      data: {
        businessId: business.id,
        name: "AI Chatbot & Follow-up Otomatis",
        type: "service",
        description:
          "Integrasi AI untuk auto-reply, lead qualification, rekomendasi respons, dan follow-up otomatis.",
        price: 12000000,
        promoPrice: null,
        benefits: "Response time lebih cepat, lead lebih terklasifikasi, closing assistant lebih konsisten.",
        suitableFor: "Bisnis dengan volume chat tinggi di WhatsApp.",
        stock: 999,
        stockStatus: "available",
        availability: "Open project slot bulanan",
        duration: "3-6 minggu",
        minimumOrder: 1,
        processingTime: "Analisis flow chat 2-4 hari kerja",
        deliveryInfo: "Integrasi sesuai channel dan SOP bisnis.",
        category: "AI Integration",
        keywords: ["ai chatbot", "automation", "follow-up"],
        faq: "Performa AI dipengaruhi kualitas data knowledge base dan SOP bisnis.",
        imageUrl: "https://images.unsplash.com/photo-1677442136019-21780ecad995",
        tags: ["ai", "automation"],
        isActive: true,
      },
    }),
    prisma.product.create({
      data: {
        businessId: business.id,
        name: "Paket Growth Stack (Website + CRM + AI)",
        type: "service",
        description:
          "Paket komprehensif untuk bisnis yang ingin migrasi dari proses manual ke ekosistem digital end-to-end.",
        price: 32500000,
        promoPrice: 29000000,
        benefits: "Satu arsitektur terpadu dari branding, operasional, hingga automasi follow-up.",
        suitableFor: "Bisnis yang ingin scale-up dan butuh fondasi digital jangka panjang.",
        stock: 999,
        stockStatus: "available",
        availability: "By consultation",
        duration: "8-12 minggu",
        minimumOrder: 1,
        processingTime: "Discovery + roadmap 5-7 hari kerja",
        deliveryInfo: "Project milestone per fase.",
        category: "Package",
        keywords: ["growth stack", "website", "crm", "ai"],
        faq: "Cocok untuk bisnis yang sudah punya validasi market dan siap scale.",
        imageUrl: "https://images.unsplash.com/photo-1551434678-e076c223a692",
        tags: ["bundle", "high-ticket", "transformation"],
        isActive: true,
      },
    }),
  ]);

  await prisma.replyTemplate.createMany({
    data: nusadexReplyTemplates.map((template) => ({
      businessId: business.id,
      ...template,
      isActive: true,
    })),
  });

  await prisma.knowledgeBaseItem.createMany({
    data: nusadexKnowledgeBase.map((item) => ({
      businessId: business.id,
      ...item,
      isActive: true,
    })),
  });

  const [customerA, customerB, customerC, customerD, customerE] = await prisma.$transaction([
    prisma.customer.create({
      data: {
        businessId: business.id,
        name: "Rifki",
        phone: "6281211110001",
        leadStatus: "hot",
        tags: ["website + crm"],
        lastMessageAt: new Date(),
      },
    }),
    prisma.customer.create({
      data: {
        businessId: business.id,
        name: "Maya",
        phone: "6281211110002",
        leadStatus: "warm",
        tags: ["new lead", "need proposal"],
        lastMessageAt: new Date(Date.now() - 1000 * 60 * 15),
      },
    }),
    prisma.customer.create({
      data: {
        businessId: business.id,
        name: "Budi",
        phone: "6281211110003",
        leadStatus: "cold",
        tags: ["price sensitive", "marketplace only"],
        spamSuspected: true,
        spamReason: "Mengirim pesan berulang sangat cepat.",
        lastMessageAt: new Date(Date.now() - 1000 * 60 * 60 * 24),
      },
    }),
    prisma.customer.create({
      data: {
        businessId: business.id,
        name: "Nina",
        phone: "6281211110004",
        leadStatus: "complaint",
        tags: ["complaint", "timeline issue"],
        lastMessageAt: new Date(Date.now() - 1000 * 60 * 30),
      },
    }),
    prisma.customer.create({
      data: {
        businessId: business.id,
        name: "Arif",
        phone: "6281211110005",
        leadStatus: "deal",
        tags: ["corporate", "high value"],
        lastMessageAt: new Date(Date.now() - 1000 * 60 * 60 * 5),
      },
    }),
  ]);

  const conversations = await Promise.all([
    prisma.conversation.create({
      data: {
        businessId: business.id,
        customerId: customerA.id,
        status: "open",
        summary: "Calon klien ingin website booking + admin panel untuk bisnis spa.",
        lastIntent: "order_inquiry",
        lastMessageAt: new Date(),
      },
    }),
    prisma.conversation.create({
      data: {
        businessId: business.id,
        customerId: customerB.id,
        status: "open",
        summary: "Calon klien meminta estimasi landing page untuk campaign ads bulan depan.",
        lastIntent: "price_question",
        lastMessageAt: new Date(Date.now() - 1000 * 60 * 10),
      },
    }),
    prisma.conversation.create({
      data: {
        businessId: business.id,
        customerId: customerC.id,
        status: "open",
        summary: "Calon klien fokus tanya harga tanpa memberi detail kebutuhan bisnis.",
        lastIntent: "price_question",
        lastMessageAt: new Date(Date.now() - 1000 * 60 * 60 * 6),
      },
    }),
    prisma.conversation.create({
      data: {
        businessId: business.id,
        customerId: customerD.id,
        status: "open",
        summary: "Klien komplain progres presentasi proposal terlambat dari jadwal meeting.",
        lastIntent: "complaint",
        lastMessageAt: new Date(Date.now() - 1000 * 60 * 30),
      },
    }),
    prisma.conversation.create({
      data: {
        businessId: business.id,
        customerId: customerE.id,
        status: "open",
        summary: "Klien corporate meminta paket transformasi digital end-to-end.",
        lastIntent: "general_question",
        lastMessageAt: new Date(Date.now() - 1000 * 60 * 60 * 4),
      },
    }),
  ]);

  await prisma.message.createMany({
    data: [
      {
        businessId: business.id,
        customerId: customerA.id,
        conversationId: conversations[0].id,
        direction: "incoming",
        message: "Halo kak, saya butuh website booking + admin panel untuk Serenity Spa. Bisa dibantu?",
        aiProcessed: true,
        fonnteInboxId: "inbox-rifki-1",
      },
      {
        businessId: business.id,
        customerId: customerA.id,
        conversationId: conversations[0].id,
        direction: "outgoing",
        message: "Siap kak, boleh share kendala utama sekarang dan fitur yang paling dibutuhkan dulu?",
        aiProcessed: true,
      },
      {
        businessId: business.id,
        customerId: customerB.id,
        conversationId: conversations[1].id,
        direction: "incoming",
        message: "Mau bikin landing page buat campaign properti, estimasinya mulai dari berapa?",
        aiProcessed: true,
        fonnteInboxId: "inbox-maya-1",
      },
      {
        businessId: business.id,
        customerId: customerC.id,
        conversationId: conversations[2].id,
        direction: "incoming",
        message: "Harga paling murah berapa? saya banding-bandingin dulu.",
        aiProcessed: true,
        fonnteInboxId: "inbox-budi-1",
      },
      {
        businessId: business.id,
        customerId: customerD.id,
        conversationId: conversations[3].id,
        direction: "incoming",
        message: "Mohon maaf, kemarin janji kirim proposal jam 3 tapi belum masuk ya.",
        aiProcessed: true,
        fonnteInboxId: "inbox-nina-1",
      },
      {
        businessId: business.id,
        customerId: customerE.id,
        conversationId: conversations[4].id,
        direction: "incoming",
        message: "Kami butuh website corporate + CRM + chatbot AI untuk tim sales. Bisa bantu proposal?",
        aiProcessed: true,
        fonnteInboxId: "inbox-arif-1",
      },
      {
        businessId: business.id,
        customerId: customerE.id,
        conversationId: conversations[4].id,
        direction: "outgoing",
        message:
          "Siap Pak Arif, kami bantu susun opsi scope dan estimasi. Boleh info target timeline implementasinya?",
        aiProcessed: true,
      },
    ],
  });

  await prisma.customer.updateMany({
    where: {
      businessId: business.id,
    },
    data: {
      outgoingCountDate: new Date(),
    },
  });

  await prisma.customer.update({
    where: { id: customerA.id },
    data: {
      outgoingCountToday: 1,
      lastOutgoingAt: new Date(Date.now() - 1000 * 60 * 25),
    },
  });

  await prisma.customer.update({
    where: { id: customerE.id },
    data: {
      outgoingCountToday: 1,
      lastOutgoingAt: new Date(Date.now() - 1000 * 60 * 15),
    },
  });

  await prisma.order.createMany({
    data: [
      {
        businessId: business.id,
        customerId: customerA.id,
        conversationId: conversations[0].id,
        status: "draft",
        items: [
          {
            product: services[0].name,
            quantity: 1,
            estimatedPrice: 6500000,
          },
        ],
        totalEstimate: 6500000,
        notes: "Calon klien ingin website booking dan request go-live bulan depan.",
      },
      {
        businessId: business.id,
        customerId: customerE.id,
        conversationId: conversations[4].id,
        status: "confirmed",
        items: [
          {
            product: services[0].name,
            quantity: 1,
          },
          {
            product: services[2].name,
            quantity: 1,
          },
          {
            product: services[3].name,
            quantity: 1,
          },
        ],
        totalEstimate: 36500000,
        notes: "Corporate transformation package untuk implementasi Q3.",
      },
      {
        businessId: business.id,
        customerId: customerB.id,
        conversationId: conversations[1].id,
        status: "waiting_payment",
        items: [
          {
            product: services[1].name,
            quantity: 1,
          },
        ],
        totalEstimate: 3900000,
        notes: "Menunggu transfer DP untuk kickoff landing page campaign.",
      },
    ],
  });

  await prisma.followUp.createMany({
    data: [
      {
        businessId: business.id,
        customerId: customerB.id,
        conversationId: conversations[1].id,
        message: "Follow-up kebutuhan campaign ads dan finalisasi CTA landing page.",
        scheduledAt: new Date(Date.now() + 1000 * 60 * 60 * 20),
        status: "pending",
      },
      {
        businessId: business.id,
        customerId: customerC.id,
        conversationId: conversations[2].id,
        message: "Follow-up untuk menggali masalah bisnis sebelum kirim estimasi.",
        scheduledAt: new Date(Date.now() + 1000 * 60 * 60 * 30),
        status: "pending",
      },
      {
        businessId: business.id,
        customerId: customerD.id,
        conversationId: conversations[3].id,
        message: "Kirim update klarifikasi keterlambatan dan jadwal revisi proposal.",
        scheduledAt: new Date(Date.now() + 1000 * 60 * 60 * 2),
        status: "pending",
      },
      {
        businessId: business.id,
        customerId: customerE.id,
        conversationId: conversations[4].id,
        message: "Tanyakan approval final scope paket growth stack.",
        scheduledAt: new Date(Date.now() + 1000 * 60 * 60 * 36),
        status: "pending",
      },
    ],
  });

  await prisma.messageSendLog.createMany({
    data: [
      {
        businessId: business.id,
        customerId: customerA.id,
        conversationId: conversations[0].id,
        message: "Halo kak, kami siap lanjutkan discovery untuk website + sistemnya.",
        status: "sent",
      },
      {
        businessId: business.id,
        customerId: customerC.id,
        conversationId: conversations[2].id,
        message: "Follow up kebutuhan detail sebelum estimasi harga.",
        status: "blocked",
        blockedReason: "This customer may be spamming. Reply manually.",
      },
    ],
  });

  await prisma.webhookEvent.create({
    data: {
      businessId: business.id,
      payload: {
        sender: customerA.phone,
        name: customerA.name,
        message: "Contoh payload webhook dari Fonnte",
        inboxid: "seed-nusadex-inbox-001",
      },
    },
  });

  console.log("Seed selesai.");
  console.log(`Login demo: ${business.email} / ${seedPassword}`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
