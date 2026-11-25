# Wake Up or Die

## Web app

Next.js 16 app served on Cloudflare Workers through vinext. The web Worker calls the separate backend Worker for API and chat requests.

## Local development

Set `API_BASE_URL` to the local backend URL:

```sh
API_BASE_URL=http://localhost:8787
```

Start both apps from the repository root with `bun dev`, or run the web app alone:

```sh
cd apps/web
bun run dev
```

The web app runs at `http://localhost:3000`.

## Build and deploy

```sh
bun run build
bun run deploy:vinext
```

Deploy the backend first. Set `API_BASE_URL` to the deployed API URL in the Cloudflare Workers build environment before building the web Worker. This is a build-time variable; do not add it under Worker `vars` in `cloudflare.config.ts`.
