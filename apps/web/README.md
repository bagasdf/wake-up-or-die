# Web Worker

Next.js 16 app served on Cloudflare Workers through vinext.

## Local development

```sh
bun run dev
```

The web Worker runs at `http://localhost:3000`. Start the backend Worker separately from `apps/backend`.

## Build and preview

Set `API_BASE_URL` to the backend API origin. The web app proxies `/api/*` and `/api/auth/*` to this origin.

```sh
bun run build
bun run start
```

## Deploy

Deploy the backend Worker first. Then set `API_BASE_URL` to its public URL and deploy this Worker:

```sh
bun run deploy:vinext
```

Configure production secrets and `WEB_ORIGIN` on the backend Worker. Configure Google OAuth redirect URI to match the Better Auth callback URL. Keep secrets out of this app and the repository.
