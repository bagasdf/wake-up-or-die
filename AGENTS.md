# Project Map

- Stack: Next.js 16 App Router, React 19, TypeScript, Tailwind CSS 4, next-intl, Base UI, Bun workspaces.
- Monorepo: `apps/web` web app; `packages/i18n` shared locale dictionaries/routing; `packages/ui` shared UI package.
- Source: `apps/web/src/app/[locale]` routes/layouts; `apps/web/src/components` UI/features; `apps/web/src/i18n` navigation/request setup; `apps/web/src/lib` helpers.
- Config: `apps/web/next.config.ts`, `apps/web/src/app/globals.css`, `turbo.json`, `package.json`.
- Root scripts: `bun run dev`, `bun run build`, `bun run lint`, `bun run check-types`, `bun run format`.
- Web scripts: `bun run dev`, `bun run build`, `bun run start`, `bun run lint`, `bun run format` inside `apps/web`.
- Read targeted line ranges in large files. Do not read or repeat whole files when a focused edit or diff is sufficient.

<!-- BEGIN:turborepo-agent-rules -->

# This is NOT the Turborepo you know

Turborepo configuration, task behavior, and CLI commands can vary between installed versions and may differ from your training data. Resolve the `turbo` package from this file's directory or relevant workspace; in monorepos, it may not be visible from the repository root. For example, run `node -p "require.resolve('turbo/package.json')"` from a workspace that depends on `turbo`.

Read `docs/README.md` inside that installed package first, then read the relevant pages from its `docs/` directory before changing Turborepo configuration or commands. Heed deprecation notices. These bundled docs match the installed package version and are available without network access.

This block is written and re-added by `turbo` before repository-scoped commands when an AI agent is detected. In the Turborepo source repository, its template is defined in `crates/turborepo-cli/src/cli/agent_guidance.rs`. Removing the managed block while updates are enabled means a later qualifying invocation will add it again. Set `"agentGuidance": true` in the root `turbo.json` or `turbo.jsonc` to opt in; this does not remove an existing block. Keep the block committed with your work to avoid an uncommitted change on the next agent invocation.
<!-- END:turborepo-agent-rules -->
