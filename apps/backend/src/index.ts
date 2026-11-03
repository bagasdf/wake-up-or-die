import { Scalar } from "@scalar/hono-api-reference";
import { cors } from "hono/cors";
import { HTTPException } from "hono/http-exception";
import { openAPIRouteHandler } from "hono-openapi";

import { createAuth } from "@/lib/auth";
import { createHono } from "@/router/app";
import { router } from "@/router/routes";

const ALLOWED_METHODS = ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"];
const ALLOWED_HEADERS = ["Content-Type", "Authorization", "x-session-key"];

const api = createHono({ strict: false }).basePath("/api");

api.use(
  "*",
  cors({
    origin: (origin, c) => {
      const allowed = new Set(
        [
          "http://localhost:3000",
          "http://127.0.0.1:3000",
          "http://localhost:8787",
          "http://127.0.0.1:8787",
          c.env?.WEB_ORIGIN,
        ].filter((value): value is string => Boolean(value)),
      );
      if (allowed.has(origin)) return origin;
      return allowed.values().next().value ?? origin;
    },
    allowMethods: ALLOWED_METHODS,
    allowHeaders: ALLOWED_HEADERS,
    exposeHeaders: ["Content-Length", "Retry-After"],
    credentials: true,
    maxAge: 600,
  }),
);

api.on(["GET", "POST"], "/auth/*", async (c) => {
  try {
    return await createAuth(c.env).handler(c.req.raw);
  } catch (error) {
    console.error("better-auth handler failed", error);
    return c.json(
      { success: false, message: "Layanan autentikasi sedang bermasalah. Coba lagi nanti." },
      500,
    );
  }
});

export const app = api
  .route("/", router)
  .get("/", (c) =>
    c.json({
      success: true,
      data: {
        name: c.env.APP_NAME ?? "Website Edukasi Anti Narkoba",
        version: "1.0.0",
        docs: "/api/docs",
        openapi: "/api/openapi.json",
        auth: "/api/auth",
        api: "/api/v1",
      },
    }),
  )
  .get("/openapi.json", (c, next) =>
    openAPIRouteHandler(router, {
      documentation: {
        info: {
          title: "Website Edukasi Anti Narkoba API",
          version: "1.0.0",
          description:
            "API untuk artikel edukasi, kuis, kalkulator dampak, gamifikasi, chatbot konsultasi, direktori bantuan, pengaduan anonim, galeri, akun pengguna, dan panel admin.",
        },
        servers: [{ url: c.env?.SERVER_API_URL ?? "/api" }],
        tags: [
          { name: "Home", description: "Konten beranda" },
          { name: "Articles", description: "Artikel dan blog edukasi" },
          { name: "Comments", description: "Diskusi pada artikel" },
          { name: "Quizzes", description: "Kuis interaktif" },
          { name: "Calculator", description: "Kalkulator dampak finansial dan masa depan" },
          { name: "Gamification", description: "Lencana dan sertifikat digital" },
          { name: "Chatbot", description: "Konsultasi AI 24/7" },
          { name: "Directory", description: "Kontak bantuan dan rehabilitasi" },
          { name: "Reports", description: "Konsultasi dan pengaduan anonim" },
          { name: "Gallery", description: "Poster dan infografis" },
          { name: "Media", description: "Berkas media" },
          { name: "Me", description: "Profil dan riwayat pengguna" },
          { name: "Admin", description: "Manajemen konten" },
        ],
        components: {
          securitySchemes: {
            bearerAuth: { type: "http", scheme: "bearer" },
            cookieAuth: {
              type: "apiKey",
              in: "cookie",
              name: "better-auth.session_token",
            },
          },
        },
      },
    })(c, next),
  )
  .get(
    "/docs",
    Scalar({
      pageTitle: "Website Edukasi Anti Narkoba API",
      url: "/api/openapi.json",
      theme: "saturn",
    }),
  )
  .notFound((c) =>
    c.json(
      {
        success: false,
        message: "Endpoint tidak ditemukan.",
        hint: "Buka /api/docs atau /api/openapi.json untuk daftar endpoint.",
      },
      404,
    ),
  )
  .onError((err, c) => {
    if (err instanceof HTTPException) {
      return c.json({ success: false, message: err.message }, err.status);
    }

    console.error("unhandled error", err);
    return c.json(
      { success: false, message: "Terjadi kesalahan pada server. Coba lagi nanti." },
      500,
    );
  });

export type AppType = typeof app;
export type { RouterRoutes } from "./router/routes";

export { router };
export default app;
