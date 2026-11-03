import { and, desc, eq, sql } from "drizzle-orm";
import { describeRoute } from "hono-openapi";
import { z } from "zod";

import {
  badges,
  certificates,
  pointEvents,
  quizAttempts,
  quizzes,
  user,
  userBadges,
} from "@/db/schema";
import { currentUser, requireUser } from "@/lib/guards";
import { fail, ok, paginated, pagination } from "@/lib/http";
import { commonErrorResponses, errorResponse, jsonResponse } from "@/lib/openapi";
import { getUserStats } from "@/lib/points";
import { jsonBody } from "@/lib/validate";
import { createHono } from "@/router/app";

const updateProfileSchema = z.object({
  name: z.string().trim().min(2).max(80).optional(),
  image: z.string().url().max(500).nullish(),
});

function progressFor(
  criteria: { type: "quizzes_passed" | "articles_read" | "points" | "comments"; gte: number },
  stats: Awaited<ReturnType<typeof getUserStats>>,
) {
  const value =
    criteria.type === "quizzes_passed"
      ? stats.quizzesPassed
      : criteria.type === "articles_read"
        ? stats.articlesRead
        : criteria.type === "comments"
          ? stats.commentsApproved
          : stats.points;

  return {
    current: value,
    target: criteria.gte,
    percent: Math.min(Math.round((value / criteria.gte) * 100), 100),
  };
}

const router = createHono()
  .get(
    "/",
    describeRoute({
      tags: ["Me"],
      summary: "Profil, statistik, dan ringkasan gamifikasi",
      responses: {
        ...commonErrorResponses,
        200: jsonResponse("Profil pengguna"),
      },
    }),
    requireUser,
    async (c) => {
      const db = c.get("db");
      const me = currentUser(c);

      const [stats, earned, recentAttempts, recentCertificates] = await Promise.all([
        getUserStats(db, me.id),
        db
          .select({
            id: badges.id,
            code: badges.code,
            name: badges.name,
            description: badges.description,
            icon: badges.icon,
            points: badges.points,
            awardedAt: userBadges.awardedAt,
          })
          .from(userBadges)
          .innerJoin(badges, eq(userBadges.badgeId, badges.id))
          .where(eq(userBadges.userId, me.id)),
        db
          .select({
            id: quizAttempts.id,
            quizSlug: quizzes.slug,
            quizTitle: quizzes.title,
            score: quizAttempts.score,
            passed: quizAttempts.passed,
            completedAt: quizAttempts.completedAt,
          })
          .from(quizAttempts)
          .innerJoin(quizzes, eq(quizAttempts.quizId, quizzes.id))
          .where(eq(quizAttempts.userId, me.id))
          .orderBy(desc(quizAttempts.completedAt))
          .limit(5),
        db
          .select()
          .from(certificates)
          .where(eq(certificates.userId, me.id))
          .orderBy(desc(certificates.issuedAt))
          .limit(5),
      ]);

      return ok(c, {
        user: {
          id: me.id,
          name: me.name,
          email: me.email,
          image: me.image,
          role: me.role ?? "user",
          createdAt: me.createdAt,
        },
        stats,
        badges: earned,
        recentAttempts,
        recentCertificates,
      });
    },
  )

  .patch(
    "/",
    describeRoute({
      tags: ["Me"],
      summary: "Perbarui profil",
      responses: {
        ...commonErrorResponses,
        200: jsonResponse("Profil terbaru"),
      },
    }),
    requireUser,
    jsonBody(updateProfileSchema),
    async (c) => {
      const db = c.get("db");
      const me = currentUser(c);
      const body = c.req.valid("json");

      const updates: { name?: string; image?: string | null } = {};
      if (body.name !== undefined) updates.name = body.name;
      if (body.image !== undefined) updates.image = body.image;

      if (Object.keys(updates).length === 0) {
        return fail(c, 400, "Tidak ada perubahan yang dikirim.");
      }

      const [updated] = await db
        .update(user)
        .set(updates)
        .where(eq(user.id, me.id))
        .returning({
          id: user.id,
          name: user.name,
          email: user.email,
          image: user.image,
          role: user.role,
        });

      return ok(c, updated);
    },
  )

  .get(
    "/quiz-attempts",
    describeRoute({
      tags: ["Me"],
      summary: "Riwayat percobaan kuis",
      responses: {
        ...commonErrorResponses,
        200: jsonResponse("Riwayat percobaan terpaginasi"),
      },
    }),
    requireUser,
    async (c) => {
      const db = c.get("db");
      const me = currentUser(c);
      const page = pagination(c);

      const where = eq(quizAttempts.userId, me.id);

      const [rows, count] = await Promise.all([
        db
          .select({
            id: quizAttempts.id,
            quizSlug: quizzes.slug,
            quizTitle: quizzes.title,
            score: quizAttempts.score,
            correctCount: quizAttempts.correctCount,
            totalQuestions: quizAttempts.totalQuestions,
            passed: quizAttempts.passed,
            completedAt: quizAttempts.completedAt,
          })
          .from(quizAttempts)
          .innerJoin(quizzes, eq(quizAttempts.quizId, quizzes.id))
          .where(where)
          .orderBy(desc(quizAttempts.completedAt))
          .limit(page.perPage)
          .offset(page.offset),
        db.select({ total: sql<number>`count(*)::int` }).from(quizAttempts).where(where),
      ]);

      return ok(c, paginated(page, count[0]?.total ?? 0, rows));
    },
  )

  .get(
    "/certificates",
    describeRoute({
      tags: ["Me"],
      summary: "Sertifikat milik saya",
      responses: {
        ...commonErrorResponses,
        200: jsonResponse("Daftar sertifikat"),
      },
    }),
    requireUser,
    async (c) => {
      const db = c.get("db");
      const me = currentUser(c);

      const rows = await db
        .select()
        .from(certificates)
        .where(eq(certificates.userId, me.id))
        .orderBy(desc(certificates.issuedAt));

      return ok(c, rows);
    },
  )

  .get(
    "/points",
    describeRoute({
      tags: ["Me"],
      summary: "Total poin dan riwayat perolehan",
      responses: {
        ...commonErrorResponses,
        200: jsonResponse("Poin dan riwayat"),
      },
    }),
    requireUser,
    async (c) => {
      const db = c.get("db");
      const me = currentUser(c);
      const page = pagination(c);

      const where = eq(pointEvents.userId, me.id);

      const [rows, count, total] = await Promise.all([
        db
          .select()
          .from(pointEvents)
          .where(where)
          .orderBy(desc(pointEvents.createdAt))
          .limit(page.perPage)
          .offset(page.offset),
        db.select({ total: sql<number>`count(*)::int` }).from(pointEvents).where(where),
        db
          .select({ points: sql<number>`coalesce(sum(${pointEvents.points}), 0)::int` })
          .from(pointEvents)
          .where(where),
      ]);

      return ok(c, {
        points: total[0]?.points ?? 0,
        ...paginated(page, count[0]?.total ?? 0, rows),
      });
    },
  )

  .get(
    "/badges",
    describeRoute({
      tags: ["Me"],
      summary: "Lencana yang dimiliki dan progres menuju lencana berikutnya",
      responses: {
        ...commonErrorResponses,
        200: jsonResponse("Daftar lencana dengan progres"),
      },
    }),
    requireUser,
    async (c) => {
      const db = c.get("db");
      const me = currentUser(c);

      const [stats, catalog, owned] = await Promise.all([
        getUserStats(db, me.id),
        db.select().from(badges),
        db
          .select({ badgeId: userBadges.badgeId, awardedAt: userBadges.awardedAt })
          .from(userBadges)
          .where(eq(userBadges.userId, me.id)),
      ]);

      const ownedMap = new Map(owned.map((row) => [row.badgeId, row.awardedAt]));

      return ok(
        c,
        catalog.map((badge) => ({
          ...badge,
          earned: ownedMap.has(badge.id),
          awardedAt: ownedMap.get(badge.id) ?? null,
          progress: progressFor(badge.criteria, stats),
        })),
      );
    },
  );

export default router;
