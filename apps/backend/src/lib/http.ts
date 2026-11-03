import type { Context } from "hono";
import type { ContentfulStatusCode } from "hono/utils/http-status";

import type { AppEnv } from "@/env";

const MAX_PER_PAGE = 50;

export type Page = { page: number; perPage: number; offset: number };

function clampInt(value: unknown, fallback: number, min: number, max: number): number {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.min(Math.max(Math.trunc(parsed), min), max);
}

export function pagination(c: Context<AppEnv>): Page {
  const page = clampInt(c.req.query("page"), 1, 1, 10_000);
  const perPage = clampInt(c.req.query("perPage") ?? c.req.query("limit"), 10, 1, MAX_PER_PAGE);
  return { page, perPage, offset: (page - 1) * perPage };
}

export function paginated<T>(page: Page, total: number, items: T[]) {
  return {
    items,
    pagination: {
      page: page.page,
      perPage: page.perPage,
      total,
      totalPages: Math.max(Math.ceil(total / page.perPage), 1),
    },
  };
}

export function ok<T>(c: Context<AppEnv>, data: T, status: ContentfulStatusCode = 200) {
  return c.json({ success: true as const, data }, status);
}

export function created<T>(c: Context<AppEnv>, data: T) {
  return ok(c, data, 201);
}

export function fail(
  c: Context<AppEnv>,
  status: ContentfulStatusCode,
  message: string,
  extra?: Record<string, unknown>,
) {
  return c.json({ success: false as const, message, ...extra }, status);
}

export function clientIp(c: Context<AppEnv>): string {
  return (
    c.req.header("cf-connecting-ip") ??
    c.req.header("x-real-ip") ??
    c.req.header("x-forwarded-for")?.split(",")[0]?.trim() ??
    "unknown"
  );
}

export async function sha256Hex(value: string): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

/** Salted client fingerprint used for anonymous submissions instead of a raw IP. */
export async function ipFingerprint(c: Context<AppEnv>): Promise<string> {
  const salt = c.env.BETTER_AUTH_SECRET || "wuod";
  return (await sha256Hex(`${salt}:${clientIp(c)}`)).slice(0, 32);
}

export function anonymousKey(c: Context<AppEnv>): string | null {
  const header = c.req.header("x-session-key");
  if (!header) return null;
  const trimmed = header.trim();
  return /^[A-Za-z0-9_-]{8,64}$/.test(trimmed) ? trimmed : null;
}

export function ticketCode(): string {
  const year = new Date().getFullYear();
  const random = crypto.randomUUID().replace(/-/g, "").slice(0, 6).toUpperCase();
  return `LAP-${year}-${random}`;
}
