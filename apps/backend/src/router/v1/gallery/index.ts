import { and, desc, eq, ilike, or, sql, type SQL } from "drizzle-orm";
import { describeRoute } from "hono-openapi";

import { mediaAssets, type MediaType } from "@/db/schema";
import { fail, ok, paginated, pagination } from "@/lib/http";
import { commonErrorResponses, errorResponse, jsonResponse } from "@/lib/openapi";
import { createHono } from "@/router/app";

const TYPES = ["poster", "infografis", "video", "lainnya"] as const;

const router = createHono()
  .get(
    "/",
    describeRoute({
      tags: ["Gallery"],
      summary: "Galeri poster dan infografis",
      responses: {
        ...commonErrorResponses,
        200: jsonResponse("Media terpaginasi"),
      },
    }),
    async (c) => {
      const db = c.get("db");
      const page = pagination(c);

      const filters: SQL[] = [eq(mediaAssets.isPublished, true)];
      const type = c.req.query("type");
      if (type && (TYPES as readonly string[]).includes(type)) {
        filters.push(eq(mediaAssets.type, type as MediaType));
      }

      const q = c.req.query("q")?.trim();
      if (q) {
        const pattern = `%${q}%`;
        const search = or(
          ilike(mediaAssets.title, pattern),
          ilike(mediaAssets.description, pattern),
        );
        if (search) filters.push(search);
      }

      const where = and(...filters);

      const [rows, count] = await Promise.all([
        db
          .select()
          .from(mediaAssets)
          .where(where)
          .orderBy(desc(mediaAssets.createdAt))
          .limit(page.perPage)
          .offset(page.offset),
        db.select({ total: sql<number>`count(*)::int` }).from(mediaAssets).where(where),
      ]);

      return ok(c, paginated(page, count[0]?.total ?? 0, rows));
    },
  )

  .get(
    "/:id",
    describeRoute({
      tags: ["Gallery"],
      summary: "Detail media",
      responses: {
        ...commonErrorResponses,
        200: jsonResponse("Detail media"),
        404: errorResponse("Media tidak ditemukan"),
      },
    }),
    async (c) => {
      const db = c.get("db");
      const id = c.req.param("id");

      const [asset] = await db
        .select()
        .from(mediaAssets)
        .where(and(eq(mediaAssets.id, id), eq(mediaAssets.isPublished, true)))
        .limit(1);

      if (!asset) return fail(c, 404, "Media tidak ditemukan.");
      return ok(c, asset);
    },
  )

  .get(
    "/:id/download",
    describeRoute({
      tags: ["Gallery"],
      summary: "Unduh media",
      description:
        "Menambah penghitung unduhan. Berkas dari R2 dialirkan langsung; media berbasis URL eksternal dialihkan.",
      responses: {
        ...commonErrorResponses,
        200: jsonResponse("Berkas media"),
        302: jsonResponse("Mengalihkan ke URL media"),
        404: errorResponse("Media tidak ditemukan"),
      },
    }),
    async (c) => {
      const db = c.get("db");
      const id = c.req.param("id");

      const [asset] = await db
        .select()
        .from(mediaAssets)
        .where(and(eq(mediaAssets.id, id), eq(mediaAssets.isPublished, true)))
        .limit(1);

      if (!asset) return fail(c, 404, "Media tidak ditemukan.");

      c.executionCtx.waitUntil(
        db
          .update(mediaAssets)
          .set({ downloadCount: sql`${mediaAssets.downloadCount} + 1` })
          .where(eq(mediaAssets.id, asset.id)),
      );

      if (asset.fileKey && c.env.MEDIA_BUCKET) {
        const object = await c.env.MEDIA_BUCKET.get(asset.fileKey);
        if (object) {
          const filename = asset.fileKey.split("/").pop() ?? `${asset.id}`;
          return c.body(object.body, 200, {
            "Content-Type": object.httpMetadata?.contentType ?? "application/octet-stream",
            "Content-Disposition": `attachment; filename="${filename}"`,
            "Cache-Control": "public, max-age=86400",
          });
        }
      }

      if (asset.url) {
        return c.redirect(asset.url, 302);
      }

      return fail(c, 404, "Berkas media tidak tersedia.");
    },
  );

export default router;
