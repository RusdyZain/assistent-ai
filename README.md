# WAI Sales Assistant (MVP)

WAI Sales Assistant adalah **WhatsApp AI Sales Assistant** untuk UMKM.
Integrasi WhatsApp utama sekarang menggunakan **WAHA (WhatsApp HTTP API)** sebagai provider aktif.

## Fitur MVP
- Login admin sederhana (single account, siap dikembangkan multi-business)
- Dashboard modul:
  - Setup
  - Inbox
  - Customers
  - Products
  - Templates
  - Knowledge Base
  - Orders
  - Follow Ups
  - Settings
- Webhook WAHA (`/api/webhooks/waha`) untuk menerima pesan masuk
- Penyimpanan payload webhook mentah untuk debugging (`WebhookEvent`)
- AI analysis (intent, lead status, summary, extracted order, suggested reply, next action)
- Auto-reply untuk chat inbound via webhook (aktif default, bisa dimatikan)
- Draft order otomatis dari sinyal order di percakapan
- Follow-up reminder manual (tidak auto-send)
- Kirim pesan WA manual lewat provider abstraction (`safeSendWhatsAppMessage`)

## Business Setup Before AI Usage
Sebelum AI dipakai untuk analisis chat dan draft balasan/order/follow-up, bisnis wajib menyelesaikan setup di `/dashboard/setup`:
- Profil bisnis
- Aturan penjualan
- Produk/layanan aktif
- Template balasan
- Knowledge base
- Aturan follow-up
- Koneksi WhatsApp (WAHA)

## WhatsApp Safety Mitigation
- Inbound-only mode: hanya balas customer yang sudah chat duluan
- Tidak ada mass broadcast / first-message campaign
- Cooldown antar pengiriman (default 3 detik)
- Batas harian per customer (default 20)
- Batas harian per bisnis (default 500)
- Deteksi customer spam (>10 pesan masuk dalam 60 detik)
- Semua pengiriman wajib lewat `safeSendWhatsAppMessage`
- Auto-reply bisa dimatikan dengan `AUTO_REPLY_ENABLED=false`

## Tech Stack
- Next.js App Router + TypeScript
- Tailwind CSS
- PostgreSQL
- Prisma ORM
- OpenAI API
- WAHA (WhatsApp HTTP API)

## Struktur Folder Utama
```bash
prisma/
  schema.prisma
  seed.ts
src/
  app/
    api/
      webhooks/waha/
      messages/send/
      setup/
      settings/
      ...
  lib/
    whatsapp/
      provider.ts
      providers/waha.ts
      utils.ts
      waha-session.ts
    safe-send.ts
    pipeline.ts
    ...
```

## Persiapan Lokal
1. Install dependency
```bash
npm install
```

2. Copy env
```bash
cp .env.example .env
```

3. Isi `.env` minimal:
- `DATABASE_URL`
- `AUTH_SECRET`
- `NEXT_PUBLIC_APP_URL`
- `WHATSAPP_PROVIDER=waha`
- `WAHA_BASE_URL`
- `WAHA_SESSION`
- `OPENAI_API_KEY` (opsional untuk AI real)

4. Generate Prisma Client
```bash
npx prisma generate
```

5. Migrasi database
```bash
npx prisma migrate dev --name init
```

6. Seed data demo
```bash
npm run db:seed
```

7. Jalankan app
```bash
npm run dev
```

## Menjalankan WAHA (Docker)
Gunakan `docker-compose.yml` yang sudah disediakan:

```bash
docker compose up -d waha
```

Service default:
- WAHA API/Swagger: `http://localhost:3000`
- Session storage: `./waha-data`

Panduan setup session lengkap ada di [docs/WAHA_MIGRATION.md](docs/WAHA_MIGRATION.md).

## Endpoint Penting
- `POST /api/webhooks/waha` (aktif)
- `POST /api/messages/send`
- `POST /api/setup/whatsapp-test`
- `POST /api/settings/waha-session-check`

Legacy/deprecated:
- `POST /api/webhooks/fonnte` (deprecated, ignore)
- `POST /api/setup/fonnte-test` (compatibility alias)
- `POST /api/settings/fonnte-token-check` (compatibility alias)

## Model Data Terkait WhatsApp
- `Message.fonnteInboxId` tetap dipertahankan untuk backward compatibility (sekarang bisa menyimpan message id WAHA)
- `MessageSendLog.fonnteResponse` tetap dipakai untuk menyimpan respons provider
- `WebhookEvent.source` sekarang menggunakan `waha` untuk event baru
- `Business.fonnteToken` masih ada sebagai field legacy (tidak lagi dibutuhkan untuk WAHA)

## Dokumen Migrasi WAHA
Lihat [docs/WAHA_MIGRATION.md](docs/WAHA_MIGRATION.md) untuk:
- Setup session `default`
- Scan QR
- Konfigurasi webhook
- Test kirim/terima pesan
- Troubleshooting session disconnect

