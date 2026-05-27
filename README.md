# WAI Sales Assistant (MVP)

WAI Sales Assistant adalah **WhatsApp AI Sales Assistant** untuk UMKM.
Aplikasi ini mengubah chat WhatsApp menjadi:
- Sales inbox
- Lightweight CRM
- Ringkasan percakapan berbasis AI
- Lead scoring
- Draft balasan
- Draft order
- Reminder follow-up

Integrasi WhatsApp menggunakan **Fonnte API**.

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
- Webhook Fonnte (`/api/webhooks/fonnte`) untuk menerima pesan masuk
- Penyimpanan payload webhook mentah untuk debugging
- AI analysis (intent, lead status, summary, extracted order, suggested reply, next action)
- Auto-reply untuk chat inbound via webhook (aktif default, bisa dimatikan)
- Draft order otomatis dari sinyal order di percakapan
- Follow-up reminder manual (tidak auto-send)
- Kirim pesan WA manual lewat Fonnte (`/api/messages/send`) dengan safe layer

## Business Setup Before AI Usage
Sebelum AI dipakai untuk menganalisis chat dan menyusun draft balasan/order/follow-up, bisnis wajib menyelesaikan setup di `/dashboard/setup`:
- Profil bisnis (kategori, deskripsi, area layanan, jam operasional, tone brand)
- Aturan penjualan (metode pembayaran, DP, kebijakan refund/reschedule/shipping, instruksi pembayaran, alur order)
- Katalog produk/layanan aktif
- Template balasan
- Knowledge base (alamat, pembayaran, booking, promo, FAQ, dll.)
- Aturan follow-up
- Koneksi Fonnte

Tanpa setup yang lengkap, AI berisiko memberikan saran yang tidak akurat. Setup lengkap membantu AI:
- Tidak mengarang harga/promo/kebijakan
- Menjawab sesuai katalog produk/layanan aktual
- Menyesuaikan gaya bahasa dengan brand tone
- Menyusun draft order dan follow-up plan yang lebih presisi

## WhatsApp Safety Mitigation
Sistem ini **tidak menjamin nomor WhatsApp pasti aman dari banned**, namun mengurangi perilaku berisiko tinggi:
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
- shadcn/ui-style components
- PostgreSQL
- Prisma ORM
- OpenAI API
- Fonnte API

## Struktur Folder Utama
```bash
prisma/
  schema.prisma
  seed.ts
src/
  app/
    (auth)/login/
    dashboard/
    api/
      webhooks/fonnte/
      messages/send/
      ai/analyze/
      setup/
      conversations/
      products/
      templates/
      knowledge-base/
      customers/
      orders/
      follow-ups/
      settings/
      auth/
  components/
    dashboard/
    ui/
  lib/
    prisma.ts
    fonnte.ts
    ai.ts
    pipeline.ts
    auth.ts
    business.ts
    message-guard.ts
    safe-send.ts
  types/
    sales.ts
```

## Persiapan Lokal
1. Install dependency
```bash
npm install
```

2. Salin env
```bash
cp .env.example .env
```

3. Isi `.env` minimal:
- `DATABASE_URL`
- `AUTH_SECRET`
- `NEXT_PUBLIC_APP_URL`
- `OPENAI_API_KEY` (opsional untuk AI real; tanpa ini fallback tetap berjalan)

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

## Login Demo Seed
- Email: `owner@waisales.test`
- Password: `admin123`

Bisa diubah via env seed:
- `SEED_ADMIN_EMAIL`
- `SEED_ADMIN_PASSWORD`

## Environment Variables
Contoh lengkap ada di `.env.example`:
- `NEXT_PUBLIC_APP_URL`
- `AUTH_SECRET`
- `DATABASE_URL`
- `OPENAI_API_KEY`
- `OPENAI_MODEL`
- `AUTO_REPLY_ENABLED` (opsional, default aktif)
- `SEED_ADMIN_EMAIL`
- `SEED_ADMIN_PASSWORD`
- `SEED_FONNTE_TOKEN`

## Konfigurasi Fonnte
1. Simpan token Fonnte di halaman **Settings**.
2. Atur webhook Fonnte ke:
```text
{APP_URL}/api/webhooks/fonnte
```
Contoh lokal dengan tunnel:
```text
https://xxxx.ngrok-free.app/api/webhooks/fonnte
```

### Catatan Teknis Fonnte (diimplementasikan)
- Endpoint kirim: `https://api.fonnte.com/send`
- Method: `POST`
- Header `Authorization` adalah **raw token**, tanpa `Bearer`
- Body: `application/x-www-form-urlencoded`
- Jika payload webhook punya `inboxid`, akan disimpan ke `fonnteInboxId`

## Cara Test Kirim WhatsApp
1. Pastikan token Fonnte valid di Settings.
2. Buka Inbox, pilih percakapan yang sudah punya pesan masuk.
3. Review draft balasan AI.
4. Klik **Send Reply**.
5. Sistem akan mengecek inbound-only, cooldown, limit, dan spam guard sebelum kirim.

## Cara Test Auto Reply
1. Pastikan webhook Fonnte mengarah ke `/api/webhooks/fonnte`.
2. Pastikan token Fonnte tersedia (di Settings atau env `SEED_FONNTE_TOKEN`).
3. Kirim pesan dari nomor customer ke nomor WhatsApp bisnis.
4. Sistem akan simpan pesan masuk, menjalankan AI di background, lalu mencoba kirim auto-reply.
5. Jika ingin mode manual penuh, set `AUTO_REPLY_ENABLED=false` lalu restart server.

Atau via API langsung:
```bash
curl -X POST http://localhost:3000/api/messages/send \
  -H "Content-Type: application/json" \
  -b "wai_session=YOUR_SESSION_COOKIE" \
  -d '{
    "target": "6281234567890",
    "message": "Halo, ini test dari WAI Sales Assistant"
  }'
```

## Test Cases Safety
Berikut skenario yang harus lulus:
1. Cannot send to a number with no incoming chat history
2. Can reply to a customer who chatted first
3. Cannot exceed 20 outgoing messages per customer per day (default)
4. Cannot exceed 500 outgoing messages per business per day (default)
5. Customer marked `spam_suspected` after >10 incoming messages in 60 seconds
6. Send button disabled when blocked
7. Cooldown prevents rapid burst replies

## Model Data Prisma
Model utama:
- `Business`
- `Customer`
- `Conversation`
- `Message`
- `Product`
- `Order`
- `FollowUp`

Model tambahan safety/debug:
- `WebhookEvent` untuk payload mentah webhook
- `MessageSendLog` untuk log status kirim (`pending/sent/failed/blocked`)

## API Endpoint MVP
- `POST /api/webhooks/fonnte`
- `POST /api/messages/send`
- `POST /api/ai/analyze`
- `GET /api/conversations`
- `GET /api/conversations/[id]`
- `GET/POST /api/products`
- `PATCH/DELETE /api/products/[id]`
- `GET/POST /api/templates`
- `PATCH/DELETE /api/templates/[id]`
- `GET/POST /api/knowledge-base`
- `PATCH/DELETE /api/knowledge-base/[id]`
- `GET/PATCH /api/setup`
- `POST /api/setup/complete`
- `POST /api/setup/fonnte-test`
- `GET /api/customers`
- `GET/PATCH /api/customers/[id]`
- `GET/POST /api/orders`
- `PATCH /api/orders/[id]`
- `GET/POST /api/follow-ups`
- `PATCH /api/follow-ups/[id]`
- `GET/PATCH /api/settings`
- `POST /api/auth/login`
- `POST /api/auth/logout`

## Limitasi MVP
- Multi-user RBAC belum ada
- Multi-tenant penuh belum aktif (saat ini 1 account login)
- Tidak ada worker queue terdistribusi (Redis/BullMQ) pada MVP
- Belum ada attachment/media processing WA
- Belum ada analytics funnel lanjutan
- Follow-up tetap manual send

## Roadmap Lanjutan
1. Multi business + multi user + role permissions
2. Queue-based async processing (Redis/BullMQ)
3. SLA inbox, assignment per agent, internal notes
4. Integrasi pembayaran & invoice
5. Product recommendation engine lebih kuat dengan RAG/catalog sync
6. Observability: logs, retries, dead-letter webhook handling

## Warning Penting
**Fonnte adalah unofficial WhatsApp API.**
Gunakan nomor sekunder, hindari spam/broadcast tanpa consent, dan patuhi kebijakan komunikasi pelanggan.
