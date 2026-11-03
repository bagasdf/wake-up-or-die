import type { Database } from "@/db";
import type { AuthSession, AuthUser } from "@/lib/auth";

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

export type Bindings = {
  DATABASE_URL: string;
  BETTER_AUTH_SECRET: string;
  BETTER_AUTH_URL?: string;
  SERVER_API_URL?: string;
  WEB_ORIGIN?: string;
  APP_NAME?: string;
  OPENROUTER_API_KEY?: string;
  OPENROUTER_MODEL?: string;
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
