import { asc, eq } from "drizzle-orm";
import { describeRoute } from "hono-openapi";
import { z } from "zod";

import { siteSettings } from "@/db/schema";
import { fail, ok } from "@/lib/http";
import { commonErrorResponses, errorResponse, jsonResponse } from "@/lib/openapi";
import { jsonBody } from "@/lib/validate";
import { createHono } from "@/router/app";

const valueSchema = z.object({
  value: z.unknown(),
});

const KEY_PATTERN = /^[a-zA-Z0-9_.-]{2,80}$/;

const router = createHono()
  .get(
    "/",
    describeRoute({
      tags: ["Admin"],
      summary: "Semua pengaturan situs",
      responses: {
        ...commonErrorResponses,
        200: jsonResponse("Daftar pengaturan"),
      },
    }),
    async (c) => {
      const db = c.get("db");
      const rows = await db.select().from(siteSettings).orderBy(asc(siteSettings.key));

      return ok(
        c,
        rows.map((row) => ({ key: row.key, value: row.value, updatedAt: row.updatedAt })),
      );
    },
  )

  .put(
    "/:key",
    describeRoute({
      tags: ["Admin"],
      summary: "Simpan pengaturan",
      description: "Membuat pengaturan baru atau menimpa nilai yang sudah ada.",
      responses: {
        ...commonErrorResponses,
        200: jsonResponse("Pengaturan tersimpan"),
      },
    }),
    jsonBody(valueSchema),
    async (c) => {
      const db = c.get("db");
      const key = c.req.param("key");
      const body = c.req.valid("json");

      if (!KEY_PATTERN.test(key)) {
        return fail(c, 400, "Nama kunci tidak valid (2-80 karakter: huruf, angka, titik, garis).");
      }

      const [row] = await db
        .insert(siteSettings)
        .values({ key, value: body.value })
        .onConflictDoUpdate({
          target: siteSettings.key,
          set: { value: body.value, updatedAt: new Date() },
        })
        .returning();

      return ok(c, row);
    },
  )

  .delete(
    "/:key",
    describeRoute({
      tags: ["Admin"],
      summary: "Hapus pengaturan",
      responses: {
        ...commonErrorResponses,
        200: jsonResponse("Pengaturan dihapus"),
        404: errorResponse("Pengaturan tidak ditemukan"),
      },
    }),
    async (c) => {
      const db = c.get("db");
      const key = c.req.param("key");

      const deleted = await db
        .delete(siteSettings)
        .where(eq(siteSettings.key, key))
        .returning({ key: siteSettings.key });

      if (deleted.length === 0) return fail(c, 404, "Pengaturan tidak ditemukan.");
      return ok(c, { key, deleted: true });
    },
  );

export default router;
