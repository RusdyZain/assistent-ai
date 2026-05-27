import bcrypt from "bcryptjs";

import { PrismaClient } from "@prisma/client";
import { DEFAULT_BUSINESS_EMAIL, DEFAULT_LOGIN_PASSWORD } from "../src/lib/constants";

const prisma = new PrismaClient();

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

  const passwordHash = await bcrypt.hash(process.env.SEED_ADMIN_PASSWORD ?? DEFAULT_LOGIN_PASSWORD, 10);

  const business = await prisma.business.create({
    data: {
      name: "Serenity Spa & Wellness",
      ownerName: "Nadia Putri",
      phone: "6281288887777",
      email: process.env.SEED_ADMIN_EMAIL ?? DEFAULT_BUSINESS_EMAIL,
      passwordHash,
      fonnteToken: process.env.SEED_FONNTE_TOKEN ?? null,
      businessCategory: "Spa & Wellness",
      businessDescription:
        "Spa premium untuk relaksasi dan perawatan kulit dengan therapist bersertifikasi.",
      businessLocation: "Jl. Melati No. 28, Makassar",
      serviceArea: "Makassar kota, Panakkukang, Rappocini",
      operatingHours: "Senin-Minggu 10:00-21:00",
      whatsappNumber: "6281288887777",
      replyLanguage: "Indonesia",
      brandTone: "friendly",
      acceptsCOD: false,
      acceptsTransfer: true,
      acceptsQRIS: true,
      requiresDownPayment: true,
      downPaymentAmount: 100000,
      downPaymentPercentage: 30,
      allowNegotiation: false,
      minimumOrder: 250000,
      refundPolicy:
        "Pembatalan H-1 dapat refund 50%. Hari-H tidak dapat refund kecuali ada kondisi darurat yang disetujui admin.",
      reschedulePolicy:
        "Reschedule gratis maksimal 1x jika dilakukan minimal 6 jam sebelum jadwal treatment.",
      shippingPolicy:
        "Tidak ada pengiriman fisik. Semua layanan dilakukan di outlet atau home service area tertentu.",
      paymentInstructions:
        "Pembayaran via transfer BCA 123456789 a.n. Serenity Spa atau QRIS resmi kasir.",
      orderProcess:
        "Konsultasi kebutuhan -> pilih layanan -> konfirmasi jadwal -> bayar DP/full -> datang sesuai jam booking.",
      warmLeadFollowUpHours: 24,
      hotLeadFollowUpHours: 2,
      closingPriorityFollowUpHours: 1,
      waitingPaymentFollowUpHours: 6,
      maxFollowUpCount: 2,
      markLostAfterDays: 3,
      setupCompleted: true,
      setupStep: 7,
    },
  });

  const services = await prisma.$transaction([
    prisma.product.create({
      data: {
        businessId: business.id,
        name: "Aromatherapy Relaxation Massage",
        type: "service",
        description: "Pijat relaksasi seluruh tubuh dengan essential oil premium.",
        price: 350000,
        promoPrice: 299000,
        benefits: "Mengurangi pegal, membantu tidur lebih nyenyak, meredakan stres.",
        suitableFor: "Pekerja kantoran, ibu rumah tangga, customer dengan keluhan pegal.",
        stock: 999,
        stockStatus: "available",
        availability: "Setiap hari, by appointment",
        duration: "90 menit",
        minimumOrder: 1,
        processingTime: "Konfirmasi jadwal maksimal 30 menit",
        deliveryInfo: "Tersedia in-spa dan home service area Makassar tertentu.",
        category: "Massage",
        keywords: ["massage", "aromatherapy", "relaksasi"],
        faq: {
          cocokUntuk: "Semua dewasa di atas 18 tahun",
          catatan: "Harap informasikan riwayat alergi minyak esensial",
        },
        imageUrl: "https://images.unsplash.com/photo-1544161515-4ab6ce6db874",
        tags: ["best-seller", "relaxing"],
        isActive: true,
      },
    }),
    prisma.product.create({
      data: {
        businessId: business.id,
        name: "Hot Stone Therapy",
        type: "service",
        description: "Terapi batu hangat untuk melancarkan sirkulasi dan relaksasi otot dalam.",
        price: 500000,
        promoPrice: null,
        benefits: "Membantu mengurangi ketegangan otot dan meningkatkan kualitas tidur.",
        suitableFor: "Customer dengan keluhan otot kaku dan aktivitas fisik tinggi.",
        stock: 999,
        stockStatus: "available",
        availability: "Senin-Sabtu",
        duration: "120 menit",
        minimumOrder: 1,
        processingTime: "Konfirmasi jadwal maksimal 30 menit",
        deliveryInfo: "In-spa only.",
        category: "Therapy",
        keywords: ["hot stone", "therapy", "stress release"],
        faq: "Tidak direkomendasikan untuk ibu hamil trimester awal.",
        imageUrl: "https://images.unsplash.com/photo-1519823551278-64ac92734fb1",
        tags: ["premium", "therapy"],
        isActive: true,
      },
    }),
    prisma.product.create({
      data: {
        businessId: business.id,
        name: "Facial Brightening Premium",
        type: "service",
        description: "Perawatan wajah untuk kulit kusam agar tampak lebih cerah dan lembap.",
        price: 425000,
        promoPrice: 379000,
        benefits: "Membersihkan pori, menutrisi kulit, meningkatkan glow alami.",
        suitableFor: "Kulit normal hingga kombinasi.",
        stock: 999,
        stockStatus: "available",
        availability: "Setiap hari",
        duration: "75 menit",
        minimumOrder: 1,
        processingTime: "Konfirmasi jadwal maksimal 30 menit",
        deliveryInfo: "In-spa only.",
        category: "Facial",
        keywords: ["facial", "brightening", "skincare"],
        faq: "Disarankan tidak memakai makeup 8 jam setelah treatment.",
        imageUrl: "https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9",
        tags: ["facial", "favorite"],
        isActive: true,
      },
    }),
    prisma.product.create({
      data: {
        businessId: business.id,
        name: "Body Scrub + Milk Bath",
        type: "service",
        description: "Eksfoliasi kulit tubuh dilanjutkan milk bath untuk kulit lebih halus.",
        price: 275000,
        promoPrice: null,
        benefits: "Mengangkat sel kulit mati, membuat kulit lebih lembut.",
        suitableFor: "Customer yang ingin perawatan badan rutin.",
        stock: 999,
        stockStatus: "available",
        availability: "Setiap hari",
        duration: "60 menit",
        minimumOrder: 1,
        processingTime: "Konfirmasi jadwal maksimal 30 menit",
        deliveryInfo: "In-spa only.",
        category: "Body Treatment",
        keywords: ["body scrub", "milk bath"],
        faq: "Hindari treatment jika ada luka terbuka pada kulit.",
        imageUrl: "https://images.unsplash.com/photo-1556228578-8c89e6adf883",
        tags: ["body-care"],
        isActive: true,
      },
    }),
    prisma.product.create({
      data: {
        businessId: business.id,
        name: "Couple Spa Package",
        type: "service",
        description: "Paket berdua untuk relaksasi lengkap termasuk foot bath dan massage.",
        price: 850000,
        promoPrice: 790000,
        benefits: "Pengalaman spa romantis dengan private room.",
        suitableFor: "Pasangan suami-istri, anniversary, gift.",
        stock: 999,
        stockStatus: "available",
        availability: "Setiap hari, booking minimal H-1",
        duration: "120 menit",
        minimumOrder: 2,
        processingTime: "Konfirmasi jadwal maksimal 30 menit",
        deliveryInfo: "In-spa only, private room terbatas.",
        category: "Package",
        keywords: ["couple spa", "package", "anniversary"],
        faq: "Wajib DP untuk lock slot private room.",
        imageUrl: "https://images.unsplash.com/photo-1515377905703-c4788e51af15",
        tags: ["package", "couple", "high-ticket"],
        isActive: true,
      },
    }),
  ]);

  await prisma.replyTemplate.createMany({
    data: [
      {
        businessId: business.id,
        type: "greeting",
        title: "Sapaan Awal",
        content: "Halo kak, makasih sudah hubungi Serenity Spa. Boleh info lagi cari treatment apa ya?",
      },
      {
        businessId: business.id,
        type: "ask_price",
        title: "Jawaban Harga",
        content: "Untuk treatment itu harganya [harga]. Kalau mau aku bantu cek promo aktif hari ini juga bisa ya kak.",
      },
      {
        businessId: business.id,
        type: "ask_stock",
        title: "Ketersediaan Slot",
        content: "Untuk slot treatment masih tersedia kak. Mau booking untuk jam berapa?",
      },
      {
        businessId: business.id,
        type: "ask_location",
        title: "Info Lokasi",
        content: "Outlet kami di [alamat]. Kalau kakak mau, aku kirim pin maps juga.",
      },
      {
        businessId: business.id,
        type: "ask_booking",
        title: "Ajakan Booking",
        content: "Kalau kakak cocok, kita amankan slotnya dulu ya. Boleh info tanggal dan jam yang diinginkan.",
      },
      {
        businessId: business.id,
        type: "ask_payment",
        title: "Info Pembayaran",
        content:
          "Pembayaran bisa via transfer/QRIS. Untuk lock booking, saat ini perlu DP sesuai ketentuan ya kak.",
      },
      {
        businessId: business.id,
        type: "order_recap",
        title: "Rekap Order",
        content:
          "Recap dulu ya kak: treatment [layanan], jadwal [jadwal], total [total], pembayaran [metode]. Sudah sesuai?",
      },
      {
        businessId: business.id,
        type: "follow_up_warm",
        title: "Follow-up Warm Lead",
        content: "Halo kak, mau aku bantu lanjutkan booking treatment yang kemarin sempat ditanya?",
      },
      {
        businessId: business.id,
        type: "follow_up_hot",
        title: "Follow-up Hot Lead",
        content: "Hi kak, slot favorit tinggal sedikit. Mau aku tahan dulu sesuai jam yang kakak mau?",
      },
      {
        businessId: business.id,
        type: "payment_reminder",
        title: "Reminder Pembayaran",
        content: "Halo kak, friendly reminder untuk pembayaran bookingnya ya. Kalau sudah transfer boleh kirim bukti di sini.",
      },
      {
        businessId: business.id,
        type: "complaint_response",
        title: "Respon Komplain",
        content:
          "Terima kasih sudah info ya kak, maaf atas ketidaknyamanannya. Kami bantu follow up cepat untuk solusi terbaik.",
      },
      {
        businessId: business.id,
        type: "closing_message",
        title: "Closing Message",
        content: "Terima kasih kak sudah booking di Serenity Spa. Ditunggu kedatangannya, semoga harinya menyenangkan.",
      },
    ],
  });

  await prisma.knowledgeBaseItem.createMany({
    data: [
      {
        businessId: business.id,
        title: "Alamat Outlet",
        category: "address",
        content: "Serenity Spa & Wellness, Jl. Melati No. 28 Makassar. Parkir mobil tersedia.",
      },
      {
        businessId: business.id,
        title: "Metode Pembayaran",
        category: "payment",
        content: "Transfer BCA 123456789 a.n. Serenity Spa, atau QRIS di kasir.",
      },
      {
        businessId: business.id,
        title: "Ketentuan Booking",
        category: "booking",
        content: "Booking dianjurkan minimal H-1. Slot private room wajib DP.",
      },
      {
        businessId: business.id,
        title: "Kebijakan Refund",
        category: "refund",
        content: "Pembatalan H-1 refund 50%. Hari-H tidak dapat refund tanpa persetujuan manajemen.",
      },
      {
        businessId: business.id,
        title: "Kebijakan Reschedule",
        category: "reschedule",
        content: "Reschedule gratis 1x jika diajukan minimal 6 jam sebelum jadwal.",
      },
      {
        businessId: business.id,
        title: "Promo Mingguan",
        category: "promo",
        content: "Promo weekday Senin-Kamis: diskon 10% untuk Aromatherapy Massage.",
      },
      {
        businessId: business.id,
        title: "FAQ Ibu Hamil",
        category: "faq",
        content: "Untuk ibu hamil, treatment wajib konsultasi admin dulu agar disesuaikan therapist.",
      },
    ],
  });

  const [customerA, customerB, customerC, customerD, customerE] = await prisma.$transaction([
    prisma.customer.create({
      data: {
        businessId: business.id,
        name: "Andi Saputra",
        phone: "6281220001111",
        leadStatus: "hot",
        tags: ["repeat"],
        lastMessageAt: new Date(),
      },
    }),
    prisma.customer.create({
      data: {
        businessId: business.id,
        name: "Siti Rahma",
        phone: "6281230002222",
        leadStatus: "warm",
        tags: ["new lead"],
        lastMessageAt: new Date(Date.now() - 1000 * 60 * 15),
      },
    }),
    prisma.customer.create({
      data: {
        businessId: business.id,
        name: "Budi Haryanto",
        phone: "6281240003333",
        leadStatus: "cold",
        tags: ["price sensitive"],
        spamSuspected: true,
        spamReason: "Lebih dari 10 pesan masuk dalam 60 detik.",
        lastMessageAt: new Date(Date.now() - 1000 * 60 * 60 * 24),
      },
    }),
    prisma.customer.create({
      data: {
        businessId: business.id,
        name: "Maya Wulan",
        phone: "6281250004444",
        leadStatus: "complaint",
        tags: ["complaint"],
        lastMessageAt: new Date(Date.now() - 1000 * 60 * 30),
      },
    }),
    prisma.customer.create({
      data: {
        businessId: business.id,
        name: "Tono Prasetyo",
        phone: "6281260005555",
        leadStatus: "deal",
        tags: ["corporate"],
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
        summary: "Customer ingin booking Aromatherapy Massage untuk besok malam.",
        lastIntent: "order_inquiry",
        lastMessageAt: new Date(),
      },
    }),
    prisma.conversation.create({
      data: {
        businessId: business.id,
        customerId: customerB.id,
        status: "open",
        summary: "Customer menanyakan harga facial dan promo weekday.",
        lastIntent: "price_question",
        lastMessageAt: new Date(Date.now() - 1000 * 60 * 10),
      },
    }),
    prisma.conversation.create({
      data: {
        businessId: business.id,
        customerId: customerC.id,
        status: "open",
        summary: "Customer minta diskon tambahan untuk Couple Spa Package.",
        lastIntent: "price_question",
        lastMessageAt: new Date(Date.now() - 1000 * 60 * 60 * 6),
      },
    }),
    prisma.conversation.create({
      data: {
        businessId: business.id,
        customerId: customerD.id,
        status: "open",
        summary: "Customer komplain jadwal treatment bergeser 30 menit.",
        lastIntent: "complaint",
        lastMessageAt: new Date(Date.now() - 1000 * 60 * 30),
      },
    }),
    prisma.conversation.create({
      data: {
        businessId: business.id,
        customerId: customerE.id,
        status: "open",
        summary: "Customer corporate meminta paket wellness untuk tim kantor.",
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
        message: "Halo kak, aromatherapy massage untuk besok jam 7 malam masih ada?",
        aiProcessed: true,
        fonnteInboxId: "inbox-andi-1",
      },
      {
        businessId: business.id,
        customerId: customerA.id,
        conversationId: conversations[0].id,
        direction: "outgoing",
        message: "Halo kak, slot jam 7 malam masih ada. Mau aku bantu lock slotnya?",
        aiProcessed: true,
      },
      {
        businessId: business.id,
        customerId: customerB.id,
        conversationId: conversations[1].id,
        direction: "incoming",
        message: "Facial brightening berapa ya? ada promo weekday?",
        aiProcessed: true,
        fonnteInboxId: "inbox-siti-1",
      },
      {
        businessId: business.id,
        customerId: customerC.id,
        conversationId: conversations[2].id,
        direction: "incoming",
        message: "Couple package bisa kurang lagi nggak harganya kalau weekend?",
        aiProcessed: true,
        fonnteInboxId: "inbox-budi-1",
      },
      {
        businessId: business.id,
        customerId: customerD.id,
        conversationId: conversations[3].id,
        direction: "incoming",
        message: "Jadwal treatment saya molor tadi, mohon penjelasannya ya.",
        aiProcessed: true,
        fonnteInboxId: "inbox-maya-1",
      },
      {
        businessId: business.id,
        customerId: customerE.id,
        conversationId: conversations[4].id,
        direction: "incoming",
        message: "Kami butuh paket wellness untuk 25 karyawan, bisa bantu proposal?",
        aiProcessed: true,
        fonnteInboxId: "inbox-tono-1",
      },
      {
        businessId: business.id,
        customerId: customerE.id,
        conversationId: conversations[4].id,
        direction: "outgoing",
        message:
          "Siap Pak Tono, kami siapkan opsi paket corporate. Boleh info target tanggal kegiatan?",
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
            estimatedPrice: 299000,
          },
        ],
        totalEstimate: 299000,
        notes: "Customer minta slot besok jam 19:00.",
      },
      {
        businessId: business.id,
        customerId: customerE.id,
        conversationId: conversations[4].id,
        status: "confirmed",
        items: [
          {
            product: services[0].name,
            quantity: 10,
          },
          {
            product: services[2].name,
            quantity: 15,
          },
        ],
        totalEstimate: 8500000,
        notes: "Corporate wellness package Q2.",
      },
      {
        businessId: business.id,
        customerId: customerB.id,
        conversationId: conversations[1].id,
        status: "waiting_payment",
        items: [
          {
            product: services[2].name,
            quantity: 1,
          },
        ],
        totalEstimate: 379000,
        notes: "Menunggu transfer DP booking facial.",
      },
    ],
  });

  await prisma.followUp.createMany({
    data: [
      {
        businessId: business.id,
        customerId: customerB.id,
        conversationId: conversations[1].id,
        message: "Follow-up promo weekday facial dan konfirmasi tanggal booking.",
        scheduledAt: new Date(Date.now() + 1000 * 60 * 60 * 20),
        status: "pending",
      },
      {
        businessId: business.id,
        customerId: customerC.id,
        conversationId: conversations[2].id,
        message: "Follow-up minat couple package setelah opsi promo dijelaskan.",
        scheduledAt: new Date(Date.now() + 1000 * 60 * 60 * 30),
        status: "pending",
      },
      {
        businessId: business.id,
        customerId: customerD.id,
        conversationId: conversations[3].id,
        message: "Kirim update penanganan komplain dan opsi kompensasi.",
        scheduledAt: new Date(Date.now() + 1000 * 60 * 60 * 2),
        status: "pending",
      },
      {
        businessId: business.id,
        customerId: customerE.id,
        conversationId: conversations[4].id,
        message: "Tanyakan approval final paket corporate wellness.",
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
        message: "Halo kak, slot treatment masih tersedia.",
        status: "sent",
      },
      {
        businessId: business.id,
        customerId: customerC.id,
        conversationId: conversations[2].id,
        message: "Follow up negosiasi couple package.",
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
        inboxid: "seed-inbox-001",
      },
    },
  });

  console.log("Seed selesai.");
  console.log(`Login demo: ${business.email} / ${process.env.SEED_ADMIN_PASSWORD ?? DEFAULT_LOGIN_PASSWORD}`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
