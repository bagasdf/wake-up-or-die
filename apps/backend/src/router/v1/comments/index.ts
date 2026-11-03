import { and, desc, eq, sql } from "drizzle-orm";
import { describeRoute } from "hono-openapi";

import { articles, comments } from "@/db/schema";
import { currentUser, requireUser } from "@/lib/guards";
import { fail, ok, paginated, pagination } from "@/lib/http";
import { commonErrorResponses, errorResponse, jsonResponse } from "@/lib/openapi";
import { createHono } from "@/router/app";

const router = createHono()
  .get(
    "/",
    describeRoute({
      tags: ["Comments"],
      summary: "Komentar terbaru yang sudah disetujui",
      description: "Umpan komentar lintas artikel untuk ditampilkan pada beranda atau sidebar.",
      responses: {
        ...commonErrorResponses,
        200: jsonResponse("Daftar komentar terbaru"),
      },
    }),
    async (c) => {
      const db = c.get("db");
      const page = pagination(c);
      const where = eq(comments.status, "approved");

      const [rows, count] = await Promise.all([
        db
          .select({
            id: comments.id,
            authorName: comments.authorName,
            content: comments.content,
            createdAt: comments.createdAt,
            articleSlug: articles.slug,
            articleTitle: articles.title,
          })
          .from(comments)
          .innerJoin(articles, eq(comments.articleId, articles.id))
          .where(where)
          .orderBy(desc(comments.createdAt))
          .limit(page.perPage)
          .offset(page.offset),
        db.select({ total: sql<number>`count(*)::int` }).from(comments).where(where),
      ]);

      return ok(c, paginated(page, count[0]?.total ?? 0, rows));
    },
  )

  .delete(
    "/:id",
    describeRoute({
      tags: ["Comments"],
      summary: "Hapus komentar milik sendiri",
      responses: {
        ...commonErrorResponses,
        200: jsonResponse("Komentar dihapus"),
        404: errorResponse("Komentar tidak ditemukan"),
      },
    }),
    requireUser,
    async (c) => {
      const db = c.get("db");
      const user = currentUser(c);
      const id = c.req.param("id");

      const [comment] = await db
        .select({ id: comments.id, userId: comments.userId })
        .from(comments)
        .where(eq(comments.id, id))
        .limit(1);

      if (!comment) return fail(c, 404, "Komentar tidak ditemukan.");
      if (comment.userId !== user.id && user.role !== "admin") {
        return fail(c, 403, "Anda hanya bisa menghapus komentar sendiri.");
      }

      await db.delete(comments).where(eq(comments.id, id));
      return ok(c, { id, deleted: true });
    },
  );

export default router;
