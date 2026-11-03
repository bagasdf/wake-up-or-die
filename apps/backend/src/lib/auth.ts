import { betterAuth } from "better-auth";
import { admin } from "better-auth/plugins";
import { drizzleAdapter } from "@better-auth/drizzle-adapter";

import { createDb } from "@/db";
import * as schema from "@/db/schema";
import type { Bindings } from "@/env";

const SEVEN_DAYS = 60 * 60 * 24 * 7;
const ONE_DAY = 60 * 60 * 24;

function resolveOrigins(env: Bindings): string[] {
  const origins = new Set<string>([
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "http://localhost:8787",
    "http://127.0.0.1:8787",
  ]);
  if (env.WEB_ORIGIN) origins.add(env.WEB_ORIGIN);
  if (env.BETTER_AUTH_URL) {
    try {
      origins.add(new URL(env.BETTER_AUTH_URL).origin);
    } catch {
      // Ignore malformed URLs so a typo cannot crash every request.
    }
  }
  return [...origins];
}

export function createAuth(env: Bindings) {
  return betterAuth({
    appName: env.APP_NAME ?? "Website Edukasi Anti Narkoba",
    baseURL: env.BETTER_AUTH_URL,
    secret: env.BETTER_AUTH_SECRET,
    trustedOrigins: resolveOrigins(env),
    database: drizzleAdapter(createDb(env.DATABASE_URL), {
      provider: "pg",
      schema,
      // Neon's HTTP driver has no interactive transactions.
      transaction: false,
    }),
    emailAndPassword: {
      enabled: true,
      minPasswordLength: 8,
      maxPasswordLength: 128,
      autoSignIn: true,
    },
    session: {
      expiresIn: SEVEN_DAYS,
      updateAge: ONE_DAY,
      cookieCache: { enabled: true, maxAge: 5 * 60 },
    },
    plugins: [
      admin({
        defaultRole: "user",
        adminRoles: ["admin"],
      }),
    ],
    advanced: {
      database: { generateId: "uuid" },
      defaultCookieAttributes: { sameSite: "lax", httpOnly: true },
    },
  });
}

export type AuthInstance = ReturnType<typeof createAuth>;
export type AuthSession = AuthInstance["$Infer"]["Session"];
export type AuthUser = AuthSession["user"];
