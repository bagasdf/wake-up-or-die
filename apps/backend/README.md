# Wake Up or Die

## Backend API

Hono API running as a Cloudflare Worker. It provides authentication, articles, quizzes, chat, media, and other app endpoints.

## Local setup

From the repository root, install dependencies and copy the environment template:

```sh
bun install
cp apps/backend/.dev.vars.example apps/backend/.dev.vars
```

Fill in required database and authentication values in `.dev.vars`. Keep this file private and never commit it.

Run the API from this directory:

```sh
cd apps/backend
bun run dev
```

The local API runs at `http://localhost:8787`.

## API documentation

- Interactive Scalar docs: `http://localhost:8787/api/docs`
- OpenAPI JSON: `http://localhost:8787/api/openapi.json`
- Example endpoint: `http://localhost:8787/api/v1/home`

## Common commands

Run these from `apps/backend`:

```sh
bun run check-types
bun run db:migrate
bun run db:seed
bun run deploy
```

Database migration and seed commands require valid `.dev.vars` settings. Configure production secrets and bindings in Cloudflare before deployment. Deploy the API before building the web Worker.
