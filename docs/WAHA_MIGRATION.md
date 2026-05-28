# WAHA Migration Guide

Dokumen ini menjelaskan cara menjalankan WAHA sebagai provider WhatsApp aktif di project ini.

## 1. Environment Variables
Tambahkan konfigurasi berikut di `.env`:

```env
WHATSAPP_PROVIDER=waha
WAHA_BASE_URL=http://localhost:3000
WAHA_SESSION=default
WAHA_API_KEY=
WAHA_WEBHOOK_SECRET=
WAHA_REQUEST_TIMEOUT_MS=15000
```

Catatan:
- `WAHA_API_KEY` opsional, tapi sangat direkomendasikan.
- `WAHA_WEBHOOK_SECRET` opsional. Jika diisi, backend akan validasi webhook (HMAC/header secret).

## 2. Jalankan WAHA Lokal
Gunakan docker compose:

```bash
docker compose up -d waha
```

Service config:
- Image: `devlikeapro/waha`
- Port: `3000`
- Volume session: `./waha-data:/app/.sessions`

## 3. Buka Dashboard / Swagger WAHA
- Dashboard/Swagger lokal: `http://localhost:3000`
- Swagger publik contoh: `https://waha.devlike.pro/swagger/`

## 4. Buat dan Start Session `default`
Di Swagger:
1. `POST /api/sessions` body:
   ```json
   { "name": "default" }
   ```
2. `POST /api/sessions/default/start` jika belum auto-start.

Atau set env WAHA agar auto-start session.

## 5. Scan QR
1. Panggil `GET /api/screenshot` atau endpoint QR sesuai engine WAHA.
2. Scan QR dengan WhatsApp di perangkat.
3. Cek status session:
   - `GET /api/sessions/default`
   - atau dari app: `POST /api/settings/waha-session-check`

Status ideal: `WORKING` dan field `me.id` terisi.

## 6. Konfigurasi Webhook ke Backend
Set webhook WAHA ke backend:

```text
{APP_URL}/api/webhooks/waha
```

Contoh tunnel lokal:

```text
https://xxxx.ngrok-free.app/api/webhooks/waha
```

Event minimal yang dibutuhkan:
- `message` (atau `message.any`, backend akan filter `fromMe`)

Jika pakai HMAC webhook WAHA:
- set `hmac.key` di config webhook session WAHA
- samakan nilainya dengan `WAHA_WEBHOOK_SECRET` di backend

## 7. Test Send Message
### Dari Dashboard App
1. Buka `/dashboard/setup` langkah 7.
2. Isi nomor target.
3. Klik **Kirim Test**.

### Via API App
```bash
curl -X POST http://localhost:3000/api/messages/send \
  -H "Content-Type: application/json" \
  -b "wai_session=YOUR_SESSION_COOKIE" \
  -d '{
    "target": "6281234567890",
    "message": "Halo, test WAHA"
  }'
```

Backend akan normalisasi nomor ke format WAHA:
- private chat: `62xxxxxxxxxx@c.us`
- group chat: tetap `@g.us` jika sudah berupa group chat id

## 8. Test Receive Message (Webhook)
1. Pastikan webhook WAHA mengarah ke `/api/webhooks/waha`.
2. Kirim pesan dari nomor customer ke nomor WA session.
3. Verifikasi:
   - pesan masuk tersimpan di tabel `Message`
   - `WebhookEvent.source = "waha"`
   - pipeline AI berjalan (summary, follow-up, auto-reply sesuai aturan)

Backend behavior:
- ignore event non-message
- ignore pesan `fromMe`
- tetap simpan raw payload untuk debugging

## 9. Troubleshooting Session Disconnect
Gunakan langkah berikut:
1. Cek status session:
   - `GET /api/sessions/default`
   - `POST /api/settings/waha-session-check`
2. Jika status bukan `WORKING`, restart session:
   - `POST /api/sessions/default/restart`
3. Jika perlu, logout lalu scan QR ulang.
4. Pastikan volume `./waha-data` writable agar auth session persist.
5. Cek log container:
   ```bash
   docker logs -f waha
   ```

## 10. Security Checklist
- Jangan expose WAHA publik tanpa proteksi.
- Aktifkan `WAHA_API_KEY` dan kirim `X-Api-Key` pada request.
- Proteksi dengan reverse proxy + firewall/IP allowlist.
- Aktifkan `WAHA_WEBHOOK_SECRET` bila memungkinkan.
- Hindari log payload sensitif, API key, dan token QR.

## 11. Backward Compatibility Notes
- Field DB lama (`fonnteInboxId`, `fonnteResponse`, `fonnteToken`) masih dipertahankan.
- Event baru menggunakan source `waha`.
- Endpoint Fonnte lama ditandai deprecated dan tidak lagi menjadi jalur utama.
