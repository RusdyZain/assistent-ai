import bcrypt from "bcryptjs";

import { PrismaClient } from "@prisma/client";
import { DEFAULT_BUSINESS_EMAIL, DEFAULT_LOGIN_PASSWORD } from "../src/lib/constants";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding database...");

  await prisma.message.deleteMany();
  await prisma.followUp.deleteMany();
  await prisma.order.deleteMany();
  await prisma.conversation.deleteMany();
  await prisma.product.deleteMany();
  await prisma.customer.deleteMany();
  await prisma.webhookEvent.deleteMany();
  await prisma.business.deleteMany();

  const passwordHash = await bcrypt.hash(process.env.SEED_ADMIN_PASSWORD ?? DEFAULT_LOGIN_PASSWORD, 10);

  const business = await prisma.business.create({
    data: {
      name: "Toko Maju Jaya",
      ownerName: "Rina Hartati",
      phone: "6281234567890",
      email: process.env.SEED_ADMIN_EMAIL ?? DEFAULT_BUSINESS_EMAIL,
      passwordHash,
      fonnteToken: process.env.SEED_FONNTE_TOKEN ?? null,
    },
  });

  const products = await prisma.$transaction([
    prisma.product.create({
      data: {
        businessId: business.id,
        name: "Paket Kopi Arabika 250gr",
        description: "Kopi arabika roasting medium.",
        price: 85000,
        stock: 120,
        category: "Kopi",
        keywords: ["kopi", "arabika", "biji"],
        imageUrl: "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085",
        isActive: true,
      },
    }),
    prisma.product.create({
      data: {
        businessId: business.id,
        name: "Kopi Robusta Blend 500gr",
        description: "Blend robusta untuk espresso.",
        price: 125000,
        stock: 80,
        category: "Kopi",
        keywords: ["robusta", "blend", "espresso"],
        imageUrl: "https://images.unsplash.com/photo-1511537190424-bbbab87ac5eb",
        isActive: true,
      },
    }),
    prisma.product.create({
      data: {
        businessId: business.id,
        name: "French Press 600ml",
        description: "Alat seduh kopi manual.",
        price: 220000,
        stock: 35,
        category: "Alat Seduh",
        keywords: ["french press", "alat seduh"],
        imageUrl: "https://images.unsplash.com/photo-1485808191679-5f86510681a2",
        isActive: true,
      },
    }),
    prisma.product.create({
      data: {
        businessId: business.id,
        name: "Drip Bag House Blend",
        description: "1 box isi 10 drip bag.",
        price: 68000,
        stock: 150,
        category: "Kopi",
        keywords: ["drip bag", "kopi praktis"],
        imageUrl: "https://images.unsplash.com/photo-1494314671902-399b18174975",
        isActive: true,
      },
    }),
    prisma.product.create({
      data: {
        businessId: business.id,
        name: "Susu Oat Barista 1L",
        description: "Alternatif susu untuk latte.",
        price: 47000,
        stock: 60,
        category: "Bahan",
        keywords: ["oat milk", "latte"],
        imageUrl: "https://images.unsplash.com/photo-1607478900766-efe13248b125",
        isActive: true,
      },
    }),
    prisma.product.create({
      data: {
        businessId: business.id,
        name: "Syrup Vanilla 750ml",
        description: "Sirup premium untuk minuman.",
        price: 89000,
        stock: 42,
        category: "Bahan",
        keywords: ["sirup", "vanilla"],
        imageUrl: "https://images.unsplash.com/photo-1587300003388-59208cc962cb",
        isActive: true,
      },
    }),
    prisma.product.create({
      data: {
        businessId: business.id,
        name: "Paper Cup 16oz (50 pcs)",
        description: "Paper cup premium anti bocor.",
        price: 39000,
        stock: 95,
        category: "Kemasan",
        keywords: ["cup", "kemasan", "takeaway"],
        imageUrl: "https://images.unsplash.com/photo-1527738724873-7b7f5376f4d2",
        isActive: true,
      },
    }),
    prisma.product.create({
      data: {
        businessId: business.id,
        name: "Cold Brew Concentrate 1L",
        description: "Konsentrat kopi dingin siap saji.",
        price: 115000,
        stock: 25,
        category: "Ready to Drink",
        keywords: ["cold brew", "konsentrat"],
        imageUrl: "https://images.unsplash.com/photo-1485808191679-5f86510681a2",
        isActive: true,
      },
    }),
    prisma.product.create({
      data: {
        businessId: business.id,
        name: "Cookies Coklat 250gr",
        description: "Snack pendamping kopi.",
        price: 42000,
        stock: 70,
        category: "Snack",
        keywords: ["cookies", "snack"],
        imageUrl: "https://images.unsplash.com/photo-1499636136210-6f4ee915583e",
        isActive: true,
      },
    }),
    prisma.product.create({
      data: {
        businessId: business.id,
        name: "Voucher Gift Coffee Rp100k",
        description: "Voucher digital hadiah.",
        price: 100000,
        stock: 999,
        category: "Voucher",
        keywords: ["voucher", "gift"],
        imageUrl: "https://images.unsplash.com/photo-1512427691650-8c8b0d57a2b4",
        isActive: true,
      },
    }),
  ]);

  const [customerA, customerB, customerC, customerD, customerE] = await prisma.$transaction([
    prisma.customer.create({
      data: {
        businessId: business.id,
        name: "Andi Saputra",
        phone: "6281220001111",
        leadStatus: "hot",
        tags: ["reseller", "repeat"],
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
        summary: "Customer menanyakan paket kopi arabika 20 pack untuk event kantor minggu depan.",
        lastIntent: "order_inquiry",
        lastMessageAt: new Date(),
      },
    }),
    prisma.conversation.create({
      data: {
        businessId: business.id,
        customerId: customerB.id,
        status: "open",
        summary: "Customer menanyakan harga drip bag dan ongkir ke Surabaya.",
        lastIntent: "shipping_question",
        lastMessageAt: new Date(Date.now() - 1000 * 60 * 10),
      },
    }),
    prisma.conversation.create({
      data: {
        businessId: business.id,
        customerId: customerC.id,
        status: "open",
        summary: "Customer membandingkan harga robusta blend dan minta diskon.",
        lastIntent: "price_question",
        lastMessageAt: new Date(Date.now() - 1000 * 60 * 60 * 6),
      },
    }),
    prisma.conversation.create({
      data: {
        businessId: business.id,
        customerId: customerD.id,
        status: "open",
        summary: "Customer komplain kemasan paper cup bocor saat pengiriman.",
        lastIntent: "complaint",
        lastMessageAt: new Date(Date.now() - 1000 * 60 * 30),
      },
    }),
    prisma.conversation.create({
      data: {
        businessId: business.id,
        customerId: customerE.id,
        status: "open",
        summary: "Customer corporate meminta penawaran bundling kopi dan alat seduh.",
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
        message: "Halo kak, ada kopi arabika 250gr ready 20 pack?",
        aiProcessed: true,
        fonnteInboxId: "inbox-andi-1",
      },
      {
        businessId: business.id,
        customerId: customerA.id,
        conversationId: conversations[0].id,
        direction: "outgoing",
        message:
          "Halo Kak Andi, tersedia. Untuk 20 pack bisa kami siapkan. Mau dikirim kapan ya supaya kami cek jadwal kurir?",
        aiProcessed: true,
      },
      {
        businessId: business.id,
        customerId: customerB.id,
        conversationId: conversations[1].id,
        direction: "incoming",
        message: "Harga drip bag berapa? Bisa kirim Surabaya?",
        aiProcessed: true,
        fonnteInboxId: "inbox-siti-1",
      },
      {
        businessId: business.id,
        customerId: customerC.id,
        conversationId: conversations[2].id,
        direction: "incoming",
        message: "Robusta blend 500gr bisa kurang harganya kalau ambil 10?",
        aiProcessed: true,
        fonnteInboxId: "inbox-budi-1",
      },
      {
        businessId: business.id,
        customerId: customerD.id,
        conversationId: conversations[3].id,
        direction: "incoming",
        message: "Paper cup yang kemarin banyak bocor, tolong solusi ya.",
        aiProcessed: true,
        fonnteInboxId: "inbox-maya-1",
      },
      {
        businessId: business.id,
        customerId: customerE.id,
        conversationId: conversations[4].id,
        direction: "incoming",
        message: "Kami butuh proposal paket kopi + french press untuk 30 orang.",
        aiProcessed: true,
        fonnteInboxId: "inbox-tono-1",
      },
      {
        businessId: business.id,
        customerId: customerE.id,
        conversationId: conversations[4].id,
        direction: "outgoing",
        message:
          "Siap Pak Tono, kami siapkan draft penawaran. Mohon info deadline finalisasi agar kami sesuaikan jadwal pengiriman.",
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
            product: products[0].name,
            quantity: 20,
            estimatedPrice: 85000,
          },
        ],
        totalEstimate: 1700000,
        notes: "Event kantor minggu depan, cek opsi pengiriman cepat.",
      },
      {
        businessId: business.id,
        customerId: customerE.id,
        conversationId: conversations[4].id,
        status: "confirmed",
        items: [
          {
            product: products[0].name,
            quantity: 30,
          },
          {
            product: products[2].name,
            quantity: 10,
          },
        ],
        totalEstimate: 4750000,
        notes: "Corporate package Q2",
      },
      {
        businessId: business.id,
        customerId: customerB.id,
        conversationId: conversations[1].id,
        status: "waiting_payment",
        items: [
          {
            product: products[3].name,
            quantity: 15,
          },
        ],
        totalEstimate: 1020000,
        notes: "Menunggu transfer DP",
      },
    ],
  });

  await prisma.followUp.createMany({
    data: [
      {
        businessId: business.id,
        customerId: customerB.id,
        conversationId: conversations[1].id,
        message: "Follow up ongkir Surabaya dan konfirmasi jumlah drip bag.",
        scheduledAt: new Date(Date.now() + 1000 * 60 * 60 * 20),
        status: "pending",
      },
      {
        businessId: business.id,
        customerId: customerC.id,
        conversationId: conversations[2].id,
        message: "Cek kembali minat customer setelah diberi opsi paket bundling.",
        scheduledAt: new Date(Date.now() + 1000 * 60 * 60 * 30),
        status: "pending",
      },
      {
        businessId: business.id,
        customerId: customerD.id,
        conversationId: conversations[3].id,
        message: "Kirim update penanganan komplain dan opsi penggantian barang.",
        scheduledAt: new Date(Date.now() + 1000 * 60 * 60 * 2),
        status: "pending",
      },
      {
        businessId: business.id,
        customerId: customerE.id,
        conversationId: conversations[4].id,
        message: "Tanyakan approval final proposal corporate package.",
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
        message: "Halo Kak Andi, stok tersedia untuk 20 pack.",
        status: "sent",
      },
      {
        businessId: business.id,
        customerId: customerC.id,
        conversationId: conversations[2].id,
        message: "Follow up harga robusta blend.",
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
