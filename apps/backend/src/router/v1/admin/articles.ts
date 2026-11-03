import { and, desc, eq, ilike, or, sql, type SQL } from "drizzle-orm";
import { describeRoute } from "hono-openapi";
import { z } from "zod";

import { articles } from "@/db/schema";
import { currentUser } from "@/lib/guards";
import { created, fail, ok, paginated, pagination } from "@/lib/http";
import { commonErrorResponses, errorResponse, jsonResponse } from "@/lib/openapi";
import { slugify, uniqueSlug } from "@/lib/slug";
import { jsonBody } from "@/lib/validate";
import { createHono } from "@/router/app";

const CATEGORIES = ["jenis", "dampak", "pencegahan", "hukum", "umum"] as const;
const STATUSES = ["draft", "published", "archived"] as const;

const articleCreateSchema = z.object({
  slug: z
    .string()
    .trim()
    .min(3)
    .max(160)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Slug hanya boleh huruf kecil, angka, dan tanda hubung.")
    .optional(),
  title: z.string().trim().min(3).max(200),
  excerpt: z.string().trim().min(10).max(500),
  content: z.string().trim().min(20),
  coverImageUrl: z.string().url().max(500).nullish(),
  category: z.enum(CATEGORIES).default("umum"),
  seriesSlug: z.string().trim().max(160).nullish(),
  seriesOrder: z.number().int().min(0).max(10_000).default(0),
  status: z.enum(STATUSES).default("draft"),
  readingMinutes: z.number().int().min(1).max(120).default(5),
});

const articleUpdateSchema = z.object({
  slug: z
    .string()
    .trim()
    .min(3)
    .max(160)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
    .optional(),
  title: z.string().trim().min(3).max(200).optional(),
  excerpt: z.string().trim().min(10).max(500).optional(),
  content: z.string().trim().min(20).optional(),
  coverImageUrl: z.string().url().max(500).nullish(),
  category: z.enum(CATEGORIES).optional(),
  seriesSlug: z.string().trim().max(160).nullish(),
  seriesOrder: z.number().int().min(0).max(10_000).optional(),
  status: z.enum(STATUSES).optional(),
  readingMinutes: z.number().int().min(1).max(120).optional(),
});

const router = createHono()
  .get(
    "/",
    describeRoute({
      tags: ["Admin"],
      summary: "Daftar seluruh artikel (termasuk draft)",
      responses: {
        ...commonErrorResponses,
        200: jsonResponse("Artikel terpaginasi"),
      },
    }),
    async (c) => {
      const db = c.get("db");
      const page = pagination(c);

      const filters: SQL[] = [];
      const status = c.req.query("status");
      if (status && (STATUSES as readonly string[]).includes(status)) {
        filters.push(eq(articles.status, status as (typeof STATUSES)[number]));
      }

      const q = c.req.query("q")?.trim();
      if (q) {
        const pattern = `%${q}%`;
        const search = or(ilike(articles.title, pattern), ilike(articles.slug, pattern));
        if (search) filters.push(search);
      }

      const where = filters.length > 0 ? and(...filters) : undefined;

      const [rows, count] = await Promise.all([
        db
          .select()
          .from(articles)
          .where(where)
          .orderBy(desc(articles.updatedAt))
          .limit(page.perPage)
          .offset(page.offset),
        db.select({ total: sql<number>`count(*)::int` }).from(articles).where(where),
      ]);

      return ok(c, paginated(page, count[0]?.total ?? 0, rows));
    },
  )

  .post(
    "/",
    describeRoute({
      tags: ["Admin"],
      summary: "Buat artikel",
      responses: {
        ...commonErrorResponses,
        201: jsonResponse("Artikel dibuat"),
        409: errorResponse("Slug sudah dipakai"),
      },
    }),
    jsonBody(articleCreateSchema),
    async (c) => {
      const db = c.get("db");
      const me = currentUser(c);
      const body = c.req.valid("json");

      let slug = body.slug ?? slugify(body.title);
      const [clash] = await db
        .select({ id: articles.id })
        .from(articles)
        .where(eq(articles.slug, slug))
        .limit(1);

      if (clash) {
        if (body.slug) return fail(c, 409, "Slug sudah digunakan artikel lain.");
        slug = uniqueSlug(body.title);
      }

      const [row] = await db
        .insert(articles)
        .values({
          slug,
          title: body.title,
          excerpt: body.excerpt,
          content: body.content,
          coverImageUrl: body.coverImageUrl ?? null,
          category: body.category,
          seriesSlug: body.seriesSlug ?? null,
          seriesOrder: body.seriesOrder,
          status: body.status,
          readingMinutes: body.readingMinutes,
          authorId: me.id,
          publishedAt: body.status === "published" ? new Date() : null,
        })
        .returning();

      return created(c, row);
    },
  )

  .get(
    "/:id",
    describeRoute({
      tags: ["Admin"],
      summary: "Detail artikel untuk editor",
      responses: {
        ...commonErrorResponses,
        200: jsonResponse("Artikel"),
        404: errorResponse("Artikel tidak ditemukan"),
      },
    }),
    async (c) => {
      const db = c.get("db");
      const id = c.req.param("id");

      const [row] = await db.select().from(articles).where(eq(articles.id, id)).limit(1);
      if (!row) return fail(c, 404, "Artikel tidak ditemukan.");
      return ok(c, row);
    },
  )

  .patch(
    "/:id",
    describeRoute({
      tags: ["Admin"],
      summary: "Perbarui artikel",
      responses: {
        ...commonErrorResponses,
        200: jsonResponse("Artikel terbaru"),
        404: errorResponse("Artikel tidak ditemukan"),
        409: errorResponse("Slug sudah dipakai"),
      },
    }),
    jsonBody(articleUpdateSchema),
    async (c) => {
      const db = c.get("db");
      const id = c.req.param("id");
      const body = c.req.valid("json");

      const [existing] = await db.select().from(articles).where(eq(articles.id, id)).limit(1);
      if (!existing) return fail(c, 404, "Artikel tidak ditemukan.");

      const updates: Partial<typeof articles.$inferInsert> = {};
      if (body.slug !== undefined) updates.slug = body.slug;
      if (body.title !== undefined) updates.title = body.title;
      if (body.excerpt !== undefined) updates.excerpt = body.excerpt;
      if (body.content !== undefined) updates.content = body.content;
      if (body.coverImageUrl !== undefined) updates.coverImageUrl = body.coverImageUrl;
      if (body.category !== undefined) updates.category = body.category;
      if (body.seriesSlug !== undefined) updates.seriesSlug = body.seriesSlug;
      if (body.seriesOrder !== undefined) updates.seriesOrder = body.seriesOrder;
      if (body.readingMinutes !== undefined) updates.readingMinutes = body.readingMinutes;
      if (body.status !== undefined) {
        updates.status = body.status;
        if (body.status === "published" && !existing.publishedAt) {
          updates.publishedAt = new Date();
        }
      }

      if (Object.keys(updates).length === 0) {
        return fail(c, 400, "Tidak ada perubahan yang dikirim.");
      }

      if (updates.slug && updates.slug !== existing.slug) {
        const [clash] = await db
          .select({ id: articles.id })
          .from(articles)
          .where(eq(articles.slug, updates.slug))
          .limit(1);
        if (clash && clash.id !== id) return fail(c, 409, "Slug sudah digunakan artikel lain.");
      }

      const [row] = await db.update(articles).set(updates).where(eq(articles.id, id)).returning();
      return ok(c, row);
    },
  )

  .delete(
    "/:id",
    describeRoute({
      tags: ["Admin"],
      summary: "Hapus artikel",
      responses: {
        ...commonErrorResponses,
        200: jsonResponse("Artikel dihapus"),
        404: errorResponse("Artikel tidak ditemukan"),
      },
    }),
    async (c) => {
      const db = c.get("db");
      const id = c.req.param("id");

      const deleted = await db
        .delete(articles)
        .where(eq(articles.id, id))
        .returning({ id: articles.id });

      if (deleted.length === 0) return fail(c, 404, "Artikel tidak ditemukan.");
      return ok(c, { id, deleted: true });
    },
  );

export default router;
