# Backend — Website Edukasi Anti Narkoba

Cloudflare Worker (Hono) + Neon Postgres (Drizzle) + better-auth + OpenRouter.

- **Worker**: `apps/backend` (Hono, zod, hono-openapi, Scalar)
- **Database**: Neon Postgres via `@neondatabase/serverless` (HTTP driver)
- **Auth**: better-auth (email/password + admin plugin), cookie or bearer session
- **Chatbot**: OpenRouter `google/gemma-4-31b-it:free` dengan jawaban fallback
- **Storage**: Cloudflare R2 untuk poster/infografis
- **Dokumentasi**: `GET /api/docs` (Scalar UI), `GET /api/openapi.json`

## 1. Prasyarat

- Bun 1.4+
- Akun Neon (https://neon.tech) dan connection string **pooled**
- Akun Cloudflare + Wrangler login (`bunx wrangler login`) untuk deploy/R2
- OpenRouter API key (opsional, chatbot tetap jalan dengan fallback)

## 2. Setup lokal

```sh
cd apps/backend
bun install
```

Salin environment:

```sh
cp .dev.vars.example .dev.vars
```

Isi `.dev.vars`:

| Variabel | Wajib | Keterangan |
| --- | --- | --- |
| `DATABASE_URL` | ya | Connection string Neon (pakai `-pooler`). |
| `BETTER_AUTH_SECRET` | ya | Minimal 32 karakter acak. `openssl rand -base64 32`. |
| `BETTER_AUTH_URL` | ya | `http://localhost:8787/api/auth` saat lokal. |
| `WEB_ORIGIN` | tidak | Origin frontend yang boleh kirim cookie. Default `http://localhost:3000`. |
| `OPENROUTER_API_KEY` | tidak | Tanpa ini chatbot membalas jawaban fallback berisi kontak bantuan. |
| `OPENROUTER_MODEL` | tidak | Default `google/gemma-4-31b-it:free`. |
| `SERVER_API_URL` | tidak | URL server OpenAPI saat produksi. Default `/api`. |

Buat bucket R2 (sekali saja):

```sh
bunx wrangler r2 bucket create wuod-media
bunx wrangler r2 bucket create wuod-media-dev
```

Migrasi dan data awal:

```sh
bun run db:generate   # sudah dijalankan; menghasilkan drizzle/*.sql
bun run db:migrate    # menerapkan migrasi ke Neon
bun run db:seed       # artikel, kuis, lencana, kontak, galeri, admin
```

Jalankan Worker:

```sh
bun run dev           # http://localhost:8787
```

Cek:

- `http://localhost:8787/api` — info API
- `http://localhost:8787/api/docs` — dokumentasi interaktif
- `http://localhost:8787/api/v1/home` — data beranda

Akun admin hasil seed (ganti kata sandi setelah login pertama):

```txt
email:    admin@wuod.local
password: Admin12345!
```

Nilai bisa diubah lewat `SEED_ADMIN_EMAIL`, `SEED_ADMIN_PASSWORD`, `SEED_ADMIN_NAME`.
Jangan pakai kata sandi default saat deploy produksi.

## 3. Perintah

```sh
bun run dev          # wrangler dev
bun run deploy       # wrangler deploy
bun run check-types  # tsc --noEmit
bun run db:generate  # generate migrasi dari src/db/schema.ts
bun run db:migrate   # terapkan migrasi
bun run db:push      # sinkron langsung tanpa file migrasi (hati-hati)
bun run db:studio    # Drizzle Studio
bun run db:seed      # seed data awal (idempoten untuk konten utama)
```

## 4. Struktur

```txt
src/
  index.ts              # CORS, better-auth handler, Scalar docs, error handling
  env.ts                # Bindings + Variables (db, user, session)
  db/
    schema.ts           # seluruh tabel + re-export tabel auth
    auth-schema.ts      # tabel better-auth (user, session, account, verification)
    index.ts            # factory client Neon/Drizzle
    seed.ts             # data awal
  lib/
    auth.ts             # createAuth(env)
    guards.ts           # withDb, withSession, requireUser, requireAdmin
    http.ts             # envelope { success, data }, paginasi, IP hash, kode tiket
    points.ts           # aturan poin + sinkronisasi lencana
    calculator.ts       # perhitungan dampak finansial
    certificate.ts      # sertifikat SVG
    ai.ts               # OpenRouter + fallback
    rate-limit.ts       # fixed window per isolate
  router/
    routes.ts           # /v1 + middleware db/session
    v1/                 # fitur per domain
      home, articles, comments, quizzes, calculator, badges,
      certificates, chat, directory, reports, gallery, media, me, admin
drizzle/                # migrasi SQL
```

## 5. Peta fitur → endpoint

| # | Fitur | Endpoint utama |
| --- | --- | --- |
| 1 | Halaman beranda | `GET /api/v1/home` |
| 2 | Artikel & blog | `GET /api/v1/articles`, `GET /api/v1/articles/:slug`, `POST /api/v1/articles/:slug/read` |
| 3 | Kolom komentar | `GET/POST /api/v1/articles/:slug/comments`, `GET /api/v1/comments` |
| 4 | Kuis interaktif | `GET /api/v1/quizzes`, `GET /api/v1/quizzes/:slug`, `POST /api/v1/quizzes/:slug/attempts` |
| 5 | Kalkulator kerugian | `POST /api/v1/calculator/estimate`, `GET /api/v1/calculator/results` |
| 6 | Lencana & sertifikat | `GET /api/v1/badges`, `GET /api/v1/certificates`, `GET /api/v1/certificates/:code/download` |
| 7 | Chatbot AI | `POST /api/v1/chat/conversations`, `POST /api/v1/chat/conversations/:id/messages` |
| 8 | Direktori bantuan | `GET /api/v1/directory/contacts`, `/emergency`, `/rehab` |
| 9 | Pengaduan anonim | `POST /api/v1/reports`, `GET /api/v1/reports/:ticketCode` |
| 10 | Galeri poster | `GET /api/v1/gallery`, `GET /api/v1/gallery/:id/download` |
| 11 | Panel admin | `/api/v1/admin/*` (wajib role `admin`) |
| 12 | Akun pengguna | `/api/auth/*`, `GET/PATCH /api/v1/me` |
| 13 | Mode gelap | frontend saja, tidak butuh backend |

Endpoint admin mencakup statistik, CRUD artikel/kuis/komentar/kontak, moderasi tiket,
unggah galeri ke R2, pengaturan situs, dan pengelolaan peran pengguna.

## 6. Autentikasi

better-auth menangani `/api/auth/*` (sign-up, sign-in, sign-out, session, admin plugin).

- Frontend mengirim cookie sesi (`credentials: "include"`), atau
  `Authorization: Bearer <session-token>`.
- Role `admin` dibutuhkan untuk seluruh `/api/v1/admin/*`.
- Endpoint publik (artikel, kuis, direktori, galeri) tetap bisa diakses tanpa login.

Contoh:

```sh
curl -X POST http://localhost:8787/api/auth/sign-in/email \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"admin@wuod.local\",\"password\":\"Admin12345!\"}"
```

### Sesi anonim

Komentar, kalkulator, chat, dan pengaduan mendukung pengunjung tanpa akun.
Kirim header `x-session-key` (8–64 karakter `A-Z a-z 0-9 _ -`) agar riwayat dapat
diambil kembali. Untuk pengaduan, simpan `ticketCode` yang dikembalikan.
IP tidak disimpan mentah; hanya hash SHA-256 ber-salt.

## 7. Catatan implementasi

- **Tanpa transaksi interaktif.** Driver HTTP Neon tidak mendukung transaksi
  interaktif, jadi adapter better-auth memakai `transaction: false` dan operasi
  multi-tabel dijalankan berurutan.
- **Rate limit** memakai fixed window di memori isolate (komentar 10/10 menit,
  chat 20/10 menit, pengaduan 3/jam). Untuk batas yang ketat dan global, pindahkan
  ke Durable Object atau Cloudflare KV.
- **Sertifikat** dirender sebagai SVG agar bundle tetap kecil; browser bisa
  mencetak atau mengonversinya ke PDF.
- **Kuis** dinilai di server; kunci jawaban tidak pernah dikirim sebelum submit.
- **Poin** bersifat idempoten lewat unique index `(user_id, action, ref_type, ref_id)`.
- **Kontak bantuan** pada seed adalah data contoh. Verifikasi nomor dan alamat
  sebelum dipublikasikan.
- **Konten galeri** seed memakai placeholder `placehold.co`; ganti dengan aset asli.

## 8. Deploy

1. Set secret produksi:

   ```sh
   bunx wrangler secret put DATABASE_URL
   bunx wrangler secret put BETTER_AUTH_SECRET
   bunx wrangler secret put OPENROUTER_API_KEY
   ```

2. Sesuaikan `vars` di `wrangler.jsonc` (`WEB_ORIGIN`, `SERVER_API_URL`,
   `BETTER_AUTH_URL` lewat secret/env produksi).
3. `bun run db:migrate` dengan `DATABASE_URL` produksi.
4. `bun run deploy`.

## 9. Troubleshooting (Windows)

Jika `wrangler dev`/`deploy` gagal dengan:

```txt
Failed to write to output file: ...\.wrangler\tmp\dev-*\index.js.map
```

kemungkinan **Windows Defender Controlled Folder Access** memblokir `esbuild.exe`,
`workerd.exe`, atau `node.exe` yang menulis ke folder `Documents`. Solusi:

- izinkan `esbuild.exe`, `workerd.exe`, `node.exe`, `bun.exe` di
  Windows Security → Virus & threat protection → Manage ransomware protection →
  Allow an app through Controlled Folder Access, atau
- pindahkan repo ke luar folder `Documents` (mis. `C:\dev\wake-up-or-die`), atau
- matikan Controlled Folder Access sementara saat development.

Cek log blokir:

```powershell
Get-WinEvent -FilterHashtable @{
  LogName='Microsoft-Windows-Windows Defender/Operational'; Id=1123
} -MaxEvents 10 | Select-Object TimeCreated, Message
```
