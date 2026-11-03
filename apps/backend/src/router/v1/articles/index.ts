import { and, desc, eq, ilike, ne, or, sql } from "drizzle-orm";
import { describeRoute } from "hono-openapi";
import { z } from "zod";

import {
  articleReads,
  articles,
  comments,
  type ArticleCategory,
} from "@/db/schema";
import { created, fail, ipFingerprint, ok, paginated, pagination } from "@/lib/http";
import { awardPoints, getUserStats, syncBadges } from "@/lib/points";
import { rateLimit } from "@/lib/rate-limit";
import { commonErrorResponses, errorResponse, jsonResponse } from "@/lib/openapi";
import { requireUser } from "@/lib/guards";
import { jsonBody } from "@/lib/validate";
import { createHono } from "@/router/app";

const CATEGORIES = ["jenis", "dampak", "pencegahan", "hukum", "umum"] as const;

const commentBodySchema = z.object({
  authorName: z.string().trim().min(2).max(60).optional(),
  content: z.string().trim().min(3).max(2_000),
  parentId: z.string().min(1).optional(),
});

const commentColumns = {
  id: comments.id,
  articleId: comments.articleId,
  authorName: comments.authorName,
  content: comments.content,
  status: comments.status,
  parentId: comments.parentId,
  createdAt: comments.createdAt,
};

const router = createHono()
  .get(
    "/",
    describeRoute({
      tags: ["Articles"],
      summary: "Daftar artikel edukasi",
      description:
        "Mendukung filter kategori, seri, pencarian kata kunci, dan paginasi. Hanya artikel berstatus published yang ditampilkan.",
      responses: {
        ...commonErrorResponses,
        200: jsonResponse("Daftar artikel terpaginasi"),
      },
    }),
    async (c) => {
      const db = c.get("db");
      const page = pagination(c);
      const category = c.req.query("category");
      const series = c.req.query("series");
      const q = c.req.query("q")?.trim();

      const filters = [eq(articles.status, "published")];
      if (category && (CATEGORIES as readonly string[]).includes(category)) {
        filters.push(eq(articles.category, category as ArticleCategory));
      }
      if (series) filters.push(eq(articles.seriesSlug, series));
      if (q) {
        const pattern = `%${q}%`;
        const search = or(
          ilike(articles.title, pattern),
          ilike(articles.excerpt, pattern),
          ilike(articles.content, pattern),
        );
        if (search) filters.push(search);
      }

      const where = and(...filters);

      const [rows, count] = await Promise.all([
        db
          .select({
            id: articles.id,
            slug: articles.slug,
            title: articles.title,
            excerpt: articles.excerpt,
            coverImageUrl: articles.coverImageUrl,
            category: articles.category,
            seriesSlug: articles.seriesSlug,
            seriesOrder: articles.seriesOrder,
            readingMinutes: articles.readingMinutes,
            viewCount: articles.viewCount,
            publishedAt: articles.publishedAt,
          })
          .from(articles)
          .where(where)
          .orderBy(desc(articles.publishedAt))
          .limit(page.perPage)
          .offset(page.offset),
        db.select({ total: sql<number>`count(*)::int` }).from(articles).where(where),
      ]);

      return ok(c, paginated(page, count[0]?.total ?? 0, rows));
    },
  )

  .get(
    "/:slug",
    describeRoute({
      tags: ["Articles"],
      summary: "Detail artikel berdasarkan slug",
      description: "Menambah penghitung tampilan dan menyertakan artikel terkait.",
      responses: {
        ...commonErrorResponses,
        200: jsonResponse("Detail artikel"),
        404: errorResponse("Artikel tidak ditemukan"),
      },
    }),
    async (c) => {
      const db = c.get("db");
      const slug = c.req.param("slug");
      const user = c.get("user");

      const [article] = await db
        .select()
        .from(articles)
        .where(and(eq(articles.slug, slug), eq(articles.status, "published")))
        .limit(1);

      if (!article) return fail(c, 404, "Artikel tidak ditemukan.");

      const [related, commentCount, readRows] = await Promise.all([
        db
          .select({
            id: articles.id,
            slug: articles.slug,
            title: articles.title,
            excerpt: articles.excerpt,
            coverImageUrl: articles.coverImageUrl,
            readingMinutes: articles.readingMinutes,
          })
          .from(articles)
          .where(
            and(
              eq(articles.status, "published"),
              eq(articles.category, article.category),
              ne(articles.id, article.id),
            ),
          )
          .orderBy(desc(articles.publishedAt))
          .limit(3),
        db
          .select({ total: sql<number>`count(*)::int` })
          .from(comments)
          .where(and(eq(comments.articleId, article.id), eq(comments.status, "approved"))),
        user
          ? db
              .select({ id: articleReads.id })
              .from(articleReads)
              .where(and(eq(articleReads.articleId, article.id), eq(articleReads.userId, user.id)))
              .limit(1)
          : Promise.resolve([]),
      ]);

      c.executionCtx.waitUntil(
        db
          .update(articles)
          .set({ viewCount: sql`${articles.viewCount} + 1` })
          .where(eq(articles.id, article.id)),
      );

      return ok(c, {
        ...article,
        commentCount: commentCount[0]?.total ?? 0,
        hasRead: readRows.length > 0,
        related,
      });
    },
  )

  .get(
    "/:slug/comments",
    describeRoute({
      tags: ["Comments"],
      summary: "Komentar yang disetujui pada sebuah artikel",
      responses: {
        ...commonErrorResponses,
        200: jsonResponse("Daftar komentar terpaginasi"),
      },
    }),
    async (c) => {
      const db = c.get("db");
      const page = pagination(c);
      const slug = c.req.param("slug");

      const [article] = await db
        .select({ id: articles.id })
        .from(articles)
        .where(and(eq(articles.slug, slug), eq(articles.status, "published")))
        .limit(1);

      if (!article) return fail(c, 404, "Artikel tidak ditemukan.");

      const where = and(eq(comments.articleId, article.id), eq(comments.status, "approved"));

      const [rows, count] = await Promise.all([
        db
          .select(commentColumns)
          .from(comments)
          .where(where)
          .orderBy(desc(comments.createdAt))
          .limit(page.perPage)
          .offset(page.offset),
        db.select({ total: sql<number>`count(*)::int` }).from(comments).where(where),
      ]);

      return ok(c, paginated(page, count[0]?.total ?? 0, rows));
    },
  )

  .post(
    "/:slug/comments",
    describeRoute({
      tags: ["Comments"],
      summary: "Kirim komentar pada artikel",
      description:
        "Komentar pengguna yang login langsung tampil dan mendapat poin. Komentar anonim berstatus pending sampai dimoderasi.",
      responses: {
        ...commonErrorResponses,
        201: jsonResponse("Komentar dibuat"),
        404: errorResponse("Artikel tidak ditemukan"),
      },
    }),
    jsonBody(commentBodySchema),
    async (c) => {
      const db = c.get("db");
      const slug = c.req.param("slug");
      const body = c.req.valid("json");
      const user = c.get("user");

      const fingerprint = await ipFingerprint(c);
      const limit = rateLimit(`comment:${fingerprint}`, 10, 10 * 60 * 1_000);
      if (!limit.ok) {
        c.header("Retry-After", String(limit.retryAfterSeconds));
        return fail(c, 429, "Terlalu banyak komentar. Coba lagi beberapa saat.");
      }

      const [article] = await db
        .select({ id: articles.id })
        .from(articles)
        .where(and(eq(articles.slug, slug), eq(articles.status, "published")))
        .limit(1);

      if (!article) return fail(c, 404, "Artikel tidak ditemukan.");

      if (body.parentId) {
        const [parent] = await db
          .select({ id: comments.id })
          .from(comments)
          .where(and(eq(comments.id, body.parentId), eq(comments.articleId, article.id)))
          .limit(1);
        if (!parent) return fail(c, 400, "Komentar induk tidak ditemukan pada artikel ini.");
      }

      const status = user ? "approved" : "pending";
      const [comment] = await db
        .insert(comments)
        .values({
          articleId: article.id,
          userId: user?.id ?? null,
          authorName: body.authorName?.trim() || user?.name || "Anonim",
          content: body.content,
          status,
          parentId: body.parentId ?? null,
        })
        .returning(commentColumns);

      if (user && status === "approved") {
        await awardPoints(db, user.id, "comment_approved", { type: "comment", id: comment.id });
        await syncBadges(db, user.id);
      }

      return created(c, {
        ...comment,
        moderation: status === "pending" ? "pending" : "approved",
        message:
          status === "pending"
            ? "Komentar dikirim dan menunggu moderasi."
            : "Komentar berhasil dipublikasikan.",
      });
    },
  )

  .post(
    "/:slug/read",
    describeRoute({
      tags: ["Articles"],
      summary: "Tandai artikel selesai dibaca",
      description:
        "Menyimpan riwayat baca dan memberikan poin satu kali per artikel untuk pengguna yang login.",
      responses: {
        ...commonErrorResponses,
        200: jsonResponse("Status baca dan poin terbaru"),
      },
    }),
    requireUser,
    async (c) => {
      const db = c.get("db");
      const slug = c.req.param("slug");
      const user = c.get("user");
      if (!user) return fail(c, 401, "Silakan masuk terlebih dahulu.");

      const [article] = await db
        .select({ id: articles.id, title: articles.title, seriesSlug: articles.seriesSlug })
        .from(articles)
        .where(and(eq(articles.slug, slug), eq(articles.status, "published")))
        .limit(1);

      if (!article) return fail(c, 404, "Artikel tidak ditemukan.");

      const inserted = await db
        .insert(articleReads)
        .values({ articleId: article.id, userId: user.id })
        .onConflictDoNothing()
        .returning({ id: articleReads.id });

      const isNew = inserted.length > 0;
      if (isNew) {
        await awardPoints(db, user.id, "article_read", { type: "article", id: article.id });
      }

      const [badges, stats] = await Promise.all([syncBadges(db, user.id), getUserStats(db, user.id)]);

      return ok(c, {
        articleId: article.id,
        alreadyRead: !isNew,
        pointsAwarded: isNew ? 5 : 0,
        badges,
        stats,
      });
    },
  );

export default router;
