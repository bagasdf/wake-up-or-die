# Wake Up or Die

**SMKN 6 KOTA TANGERANG SELATAN**<br>
**PJBL KELOMPOK 6 X RPL 2**

Educational project about drug prevention, awareness, and access to help. The repository contains the web app, API, and shared Indonesian and English translations.

## Monorepo structure

| Workspace | Purpose | README |
| --- | --- | --- |
| `apps/backend` | Hono API on Cloudflare Workers | [Backend README](apps/backend/README.md) |
| `apps/web` | Next.js app served with vinext on Cloudflare Workers | [Web README](apps/web/README.md) |
| `packages/i18n` | Shared locales, messages, and routing | [i18n README](packages/i18n/README.md) |

## Requirements

- Bun 1.4.3
- Node.js 24 or newer

## Run locally

```sh
bun install
bun dev
```

The web app runs at `http://localhost:3000`; the API runs at `http://localhost:8787`. Configure backend values in `apps/backend/.dev.vars` before using API features that need secrets or a database.

## Workspace commands

```sh
bun run build
bun run check-types
bun run lint
bun run format
```

## Project members

- BAGAS DWI FERDIAN (NISN: 0105855918)
- GHALIN NAUFAL AKRAM (NISN: 0112350456)
- MUHAMMAD IKHSAN RHADIKA (NISN: 0113132749)
- RADITHYA PUTRA PRATAMA (NISN: 0103436943)
- RAFA GALIH ADIWONGSO (NISN: 0113634099)
- STEVINO SUKRISNO (NISN: 0108124809)
