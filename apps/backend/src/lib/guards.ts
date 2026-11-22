import { createMiddleware } from "hono/factory";
import { HTTPException } from "hono/http-exception";

import { eq } from "drizzle-orm";

import { createDb } from "@/db";
import { user } from "@/db/schema";
import type { AppEnv } from "@/env";
import { createAuth } from "@/lib/auth";
import type { AuthUser } from "@/lib/auth";

/** Attaches a Neon/Drizzle client for the current request. */
export const withDb = createMiddleware<AppEnv>(async (c, next) => {
  if (!c.env.DATABASE_URL) {
    throw new HTTPException(500, {
      message: "DATABASE_URL belum dikonfigurasi. Salin .dev.vars.example menjadi .dev.vars.",
    });
  }
  c.set("db", createDb(c.env.DATABASE_URL));
  await next();
});

/**
 * Resolves the better-auth session from cookies (or a bearer token) once per
 * request. Missing or invalid sessions are treated as anonymous.
 */
export const withSession = createMiddleware<AppEnv>(async (c, next) => {
  c.set("user", null);
  c.set("session", null);

  try {
    const auth = createAuth(c.env);
    const session = await auth.api.getSession({ headers: new Headers(c.req.raw.headers) });
    if (session) {
      const db = c.get("db");
      const [currentUser] = await db
        .select({ role: user.role })
        .from(user)
        .where(eq(user.id, session.user.id))
        .limit(1);

      const freshUser = {
        ...session.user,
        role: currentUser?.role ?? "user",
      };
      c.set("session", session);
      c.set("user", freshUser);
    }
  } catch {
    // A bad cookie must not break public endpoints.
  }

  await next();
});

export const requireUser = createMiddleware<AppEnv>(async (c, next) => {
  if (!c.get("user")) {
    throw new HTTPException(401, { message: "Silakan masuk terlebih dahulu." });
  }
  await next();
});

export const requireAdmin = createMiddleware<AppEnv>(async (c, next) => {
  const user = c.get("user");
  if (!user) {
    throw new HTTPException(401, { message: "Silakan masuk terlebih dahulu." });
  }
  if (user.role !== "admin") {
    throw new HTTPException(403, { message: "Halaman ini hanya untuk administrator." });
  }
  await next();
});

export function currentUser(c: {
  get: (key: "user") => AppEnv["Variables"]["user"];
}): AuthUser {
  const user = c.get("user");
  if (!user) {
    throw new HTTPException(401, { message: "Silakan masuk terlebih dahulu." });
  }
  return user;
}
