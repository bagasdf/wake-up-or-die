import { createEnv } from "@t3-oss/env-core";
import { z } from "zod";

import type { Database } from "@/db";
import type { AuthSession, AuthUser } from "@/lib/auth";

const runtimeEnvSchema = z.object({
  DATABASE_URL: z.string().min(1),
  BETTER_AUTH_SECRET: z.string().min(32),
  BETTER_AUTH_URL: z.string().url().optional(),
  GOOGLE_CLIENT_ID: z.string().optional(),
  GOOGLE_CLIENT_SECRET: z.string().optional(),
  SERVER_API_URL: z.string().min(1).optional(),
  WEB_ORIGIN: z.string().url().optional(),
  APP_NAME: z.string().optional(),
  OPENAI_COMPATIBLE_API_KEY: z.string().optional(),
  OPENAI_COMPATIBLE_MODEL: z.string().optional(),
  OPENAI_COMPATIBLE_BASE_URL: z.string().url().optional(),
  CHAT_API_ORIGIN: z.string().url().optional(),
  OPENROUTER_API_KEY: z.string().optional(),
  OPENROUTER_MODEL: z.string().optional(),
});

const serverSchema = runtimeEnvSchema.shape;

export type RuntimeBindings = z.infer<typeof runtimeEnvSchema>;

export function createRuntimeEnv(runtimeEnv: RuntimeBindings) {
  return createEnv({
    server: serverSchema,
    runtimeEnv,
    emptyStringAsUndefined: true,
  });
}

/**
 * Structural subset of the Workers `R2Bucket` binding.
 * Declared locally so the worker type-checks without `@cloudflare/workers-types`.
 */
export type R2BucketLike = {
  put(
    key: string,
    value: ArrayBuffer | ArrayBufferView | ReadableStream | Blob | string,
    options?: { httpMetadata?: { contentType?: string; cacheControl?: string } },
  ): Promise<unknown>;
  get(key: string): Promise<{
    body: ReadableStream;
    httpMetadata?: { contentType?: string };
    size: number;
  } | null>;
  delete(key: string | string[]): Promise<void>;
};

export type Bindings = RuntimeBindings & {
  MEDIA_BUCKET?: R2BucketLike;
};

export type AppEnv = {
  Bindings: Bindings;
  Variables: {
    db: Database;
    user: AuthUser | null;
    session: AuthSession | null;
  };
};

export const DEFAULT_APP_NAME = "Website Edukasi Anti Narkoba";
export const DEFAULT_WEB_ORIGIN = "http://localhost:3000";
