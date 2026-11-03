import { and, desc, eq, sql, type SQL } from "drizzle-orm";
import { describeRoute } from "hono-openapi";
import { z } from "zod";

import { articles, comments } from "@/db/schema";
import { currentUser } from "@/lib/guards";
import { fail, ok, paginated, pagination } from "@/lib/http";
import { commonErrorResponses, errorResponse, jsonResponse } from "@/lib/openapi";
import { awardPoints, syncBadges } from "@/lib/points";
import { jsonBody } from "@/lib/validate";
import { createHono } from "@/router/app";

const STATUSES = ["pending", "approved", "rejected"] as const;

const moderationSchema = z.object({
  status: z.enum(STATUSES),
});

const router = createHono()
  .get(
    "/",
    describeRoute({
      tags: ["Admin"],
      summary: "Daftar komentar untuk moderasi",
      responses: {
        ...commonErrorResponses,
        200: jsonResponse("Komentar terpaginasi"),
      },
    }),
    async (c) => {
      const db = c.get("db");
      const page = pagination(c);

      const filters: SQL[] = [];
      const status = c.req.query("status");
      if (status && (STATUSES as readonly string[]).includes(status)) {
        filters.push(eq(comments.status, status as (typeof STATUSES)[number]));
      }

      const where = filters.length > 0 ? and(...filters) : undefined;

      const [rows, count] = await Promise.all([
        db
          .select({
            id: comments.id,
            authorName: comments.authorName,
            content: comments.content,
            status: comments.status,
            parentId: comments.parentId,
            createdAt: comments.createdAt,
            moderatedAt: comments.moderatedAt,
            userId: comments.userId,
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

  .patch(
    "/:id",
    describeRoute({
      tags: ["Admin"],
      summary: "Setujui atau tolak komentar",
      description: "Komentar yang disetujui milik pengguna login otomatis memberi poin.",
      responses: {
        ...commonErrorResponses,
        200: jsonResponse("Komentar terbaru"),
        404: errorResponse("Komentar tidak ditemukan"),
      },
    }),
    jsonBody(moderationSchema),
    async (c) => {
      const db = c.get("db");
      const me = currentUser(c);
      const id = c.req.param("id");
      const body = c.req.valid("json");

      const [existing] = await db.select().from(comments).where(eq(comments.id, id)).limit(1);
      if (!existing) return fail(c, 404, "Komentar tidak ditemukan.");

      const [row] = await db
        .update(comments)
        .set({
          status: body.status,
          moderatedBy: me.id,
          moderatedAt: new Date(),
        })
        .where(eq(comments.id, id))
        .returning();

      if (
        body.status === "approved" &&
        existing.status !== "approved" &&
        existing.userId
      ) {
        await awardPoints(db, existing.userId, "comment_approved", {
          type: "comment",
          id: existing.id,
        });
        await syncBadges(db, existing.userId);
      }

      return ok(c, row);
    },
  )

  .delete(
    "/:id",
    describeRoute({
      tags: ["Admin"],
      summary: "Hapus komentar",
      responses: {
        ...commonErrorResponses,
        200: jsonResponse("Komentar dihapus"),
        404: errorResponse("Komentar tidak ditemukan"),
      },
    }),
    async (c) => {
      const db = c.get("db");
      const id = c.req.param("id");

      const deleted = await db
        .delete(comments)
        .where(eq(comments.id, id))
        .returning({ id: comments.id });

      if (deleted.length === 0) return fail(c, 404, "Komentar tidak ditemukan.");
      return ok(c, { id, deleted: true });
    },
  );

export default router;
