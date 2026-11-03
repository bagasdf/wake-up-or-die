import { and, desc, eq, sql, type SQL } from "drizzle-orm";
import { describeRoute } from "hono-openapi";
import { z } from "zod";

import { mediaAssets, type MediaType } from "@/db/schema";
import { currentUser } from "@/lib/guards";
import { created, fail, ok, paginated, pagination } from "@/lib/http";
import { commonErrorResponses, errorResponse, jsonResponse } from "@/lib/openapi";
import { jsonBody } from "@/lib/validate";
import { createHono } from "@/router/app";

const TYPES = ["poster", "infografis", "video", "lainnya"] as const;

const jsonCreateSchema = z.object({
  title: z.string().trim().min(3).max(200),
  description: z.string().trim().max(1_000).nullish(),
  type: z.enum(TYPES).default("poster"),
  url: z.string().url().max(1_000),
  thumbnailUrl: z.string().url().max(1_000).nullish(),
  tags: z.array(z.string().trim().min(1).max(40)).max(20).default([]),
  isPublished: z.boolean().default(true),
});

const updateSchema = z.object({
  title: z.string().trim().min(3).max(200).optional(),
  description: z.string().trim().max(1_000).nullish(),
  type: z.enum(TYPES).optional(),
  url: z.string().url().max(1_000).nullish(),
  thumbnailUrl: z.string().url().max(1_000).nullish(),
  tags: z.array(z.string().trim().min(1).max(40)).max(20).optional(),
  isPublished: z.boolean().optional(),
});

function safeFileName(name: string): string {
  return name.replace(/[^a-zA-Z0-9._-]/g, "_").slice(-80) || "upload";
}

const router = createHono()
  .get(
    "/",
    describeRoute({
      tags: ["Admin"],
      summary: "Daftar seluruh media (termasuk tidak terbit)",
      responses: {
        ...commonErrorResponses,
        200: jsonResponse("Media terpaginasi"),
      },
    }),
    async (c) => {
      const db = c.get("db");
      const page = pagination(c);

      const filters: SQL[] = [];
      const type = c.req.query("type");
      if (type && (TYPES as readonly string[]).includes(type)) {
        filters.push(eq(mediaAssets.type, type as MediaType));
      }
      const where = filters.length > 0 ? and(...filters) : undefined;

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

  .post(
    "/",
    describeRoute({
      tags: ["Admin"],
      summary: "Tambah media (unggah berkas atau URL)",
      description:
        "Kirim multipart/form-data dengan field `file` plus `title`, `type`, `tags` untuk mengunggah ke R2. Atau kirim JSON berisi `url` untuk media eksternal.",
      responses: {
        ...commonErrorResponses,
        201: jsonResponse("Media dibuat"),
        400: errorResponse("Data media tidak valid"),
        503: errorResponse("R2 belum dikonfigurasi"),
      },
    }),
    async (c) => {
      const db = c.get("db");
      const me = currentUser(c);
      const contentType = c.req.header("content-type") ?? "";

      if (contentType.includes("multipart/form-data")) {
        if (!c.env.MEDIA_BUCKET) {
          return fail(c, 503, "MEDIA_BUCKET belum dikonfigurasi. Jalankan wrangler r2 bucket create.");
        }

        const form = await c.req.parseBody();
        const title = typeof form.title === "string" ? form.title.trim() : "";
        if (title.length < 3) return fail(c, 400, "Judul media minimal 3 karakter.");

        const file = form.file;
        if (!(file instanceof File)) {
          return fail(c, 400, "Berkas wajib diunggah pada field 'file'.");
        }
        if (file.size > 10 * 1024 * 1024) {
          return fail(c, 400, "Ukuran berkas maksimal 10 MB.");
        }

        const rawType = typeof form.type === "string" ? form.type : "poster";
        const type = (TYPES as readonly string[]).includes(rawType)
          ? (rawType as MediaType)
          : "poster";
        const rawTags = typeof form.tags === "string" ? form.tags : "";
        const tags = rawTags
          .split(",")
          .map((tag) => tag.trim())
          .filter(Boolean)
          .slice(0, 20);

        const key = `gallery/${crypto.randomUUID()}-${safeFileName(file.name)}`;
        await c.env.MEDIA_BUCKET.put(key, await file.arrayBuffer(), {
          httpMetadata: {
            contentType: file.type || "application/octet-stream",
            cacheControl: "public, max-age=31536000, immutable",
          },
        });

        const [row] = await db
          .insert(mediaAssets)
          .values({
            title,
            description: typeof form.description === "string" ? form.description : null,
            type,
            fileKey: key,
            url: `/api/v1/media/${key}`,
            tags,
            createdBy: me.id,
          })
          .returning();

        return created(c, row);
      }

      const parsed = jsonCreateSchema.safeParse(await c.req.json().catch(() => null));
      if (!parsed.success) {
        return fail(c, 400, "Data media tidak valid.", {
          errors: parsed.error.issues.map((issue) => issue.message),
        });
      }
      const body = parsed.data;

      const [row] = await db
        .insert(mediaAssets)
        .values({
          title: body.title,
          description: body.description ?? null,
          type: body.type,
          url: body.url,
          thumbnailUrl: body.thumbnailUrl ?? null,
          tags: body.tags,
          isPublished: body.isPublished,
          createdBy: me.id,
        })
        .returning();

      return created(c, row);
    },
  )

  .patch(
    "/:id",
    describeRoute({
      tags: ["Admin"],
      summary: "Perbarui metadata media",
      responses: {
        ...commonErrorResponses,
        200: jsonResponse("Media terbaru"),
        404: errorResponse("Media tidak ditemukan"),
      },
    }),
    jsonBody(updateSchema),
    async (c) => {
      const db = c.get("db");
      const id = c.req.param("id");
      const body = c.req.valid("json");

      const [existing] = await db
        .select({ id: mediaAssets.id })
        .from(mediaAssets)
        .where(eq(mediaAssets.id, id))
        .limit(1);
      if (!existing) return fail(c, 404, "Media tidak ditemukan.");

      const updates: Partial<typeof mediaAssets.$inferInsert> = {};
      if (body.title !== undefined) updates.title = body.title;
      if (body.description !== undefined) updates.description = body.description;
      if (body.type !== undefined) updates.type = body.type;
      if (body.url !== undefined) updates.url = body.url;
      if (body.thumbnailUrl !== undefined) updates.thumbnailUrl = body.thumbnailUrl;
      if (body.tags !== undefined) updates.tags = body.tags;
      if (body.isPublished !== undefined) updates.isPublished = body.isPublished;

      if (Object.keys(updates).length === 0) {
        return fail(c, 400, "Tidak ada perubahan yang dikirim.");
      }

      const [row] = await db
        .update(mediaAssets)
        .set(updates)
        .where(eq(mediaAssets.id, id))
        .returning();
      return ok(c, row);
    },
  )

  .delete(
    "/:id",
    describeRoute({
      tags: ["Admin"],
      summary: "Hapus media",
      responses: {
        ...commonErrorResponses,
        200: jsonResponse("Media dihapus"),
        404: errorResponse("Media tidak ditemukan"),
      },
    }),
    async (c) => {
      const db = c.get("db");
      const id = c.req.param("id");

      const [asset] = await db
        .select({ id: mediaAssets.id, fileKey: mediaAssets.fileKey })
        .from(mediaAssets)
        .where(eq(mediaAssets.id, id))
        .limit(1);

      if (!asset) return fail(c, 404, "Media tidak ditemukan.");

      if (asset.fileKey && c.env.MEDIA_BUCKET) {
        await c.env.MEDIA_BUCKET.delete(asset.fileKey).catch(() => undefined);
      }

      await db.delete(mediaAssets).where(eq(mediaAssets.id, id));
      return ok(c, { id, deleted: true });
    },
  );

export default router;
