import { and, eq, sql } from "drizzle-orm";

import type { Database } from "@/db";
import {
  articleReads,
  badges,
  certificates,
  comments,
  pointEvents,
  quizAttempts,
  userBadges,
} from "@/db/schema";

export type PointAction =
  | "article_read"
  | "quiz_complete"
  | "quiz_pass"
  | "comment_approved"
  | "certificate_issued";

export const POINT_RULES: Record<PointAction, number> = {
  article_read: 5,
  quiz_complete: 10,
  quiz_pass: 50,
  comment_approved: 5,
  certificate_issued: 20,
};

export async function awardPoints(
  db: Database,
  userId: string,
  action: PointAction,
  ref?: { type: string; id: string },
): Promise<void> {
  await db
    .insert(pointEvents)
    .values({
      userId,
      action,
      points: POINT_RULES[action],
      refType: ref?.type ?? null,
      refId: ref?.id ?? null,
    })
    .onConflictDoNothing();
}

export type UserStats = {
  points: number;
  quizzesPassed: number;
  quizzesTaken: number;
  articlesRead: number;
  commentsApproved: number;
  certificateCount: number;
};

export async function getUserStats(db: Database, userId: string): Promise<UserStats> {
  const [pointsRow] = await db
    .select({ total: sql<number>`coalesce(sum(${pointEvents.points}), 0)::int` })
    .from(pointEvents)
    .where(eq(pointEvents.userId, userId));

  const [quizRow] = await db
    .select({
      passed: sql<number>`count(*) filter (where ${quizAttempts.passed})::int`,
      taken: sql<number>`count(*)::int`,
    })
    .from(quizAttempts)
    .where(eq(quizAttempts.userId, userId));

  const [articleRow] = await db
    .select({ total: sql<number>`count(*)::int` })
    .from(articleReads)
    .where(eq(articleReads.userId, userId));

  const [commentRow] = await db
    .select({ total: sql<number>`count(*)::int` })
    .from(comments)
    .where(and(eq(comments.userId, userId), eq(comments.status, "approved")));

  const [certificateRow] = await db
    .select({ total: sql<number>`count(*)::int` })
    .from(certificates)
    .where(eq(certificates.userId, userId));

  return {
    points: pointsRow?.total ?? 0,
    quizzesPassed: quizRow?.passed ?? 0,
    quizzesTaken: quizRow?.taken ?? 0,
    articlesRead: articleRow?.total ?? 0,
    commentsApproved: commentRow?.total ?? 0,
    certificateCount: certificateRow?.total ?? 0,
  };
}

/**
 * Awards every badge whose criteria the user now satisfies. Safe to call on
 * every gamification-relevant write: duplicate awards are ignored by the
 * unique index on (user_id, badge_id).
 */
export async function syncBadges(db: Database, userId: string) {
  const [stats, catalog, existing] = await Promise.all([
    getUserStats(db, userId),
    db.select().from(badges),
    db.select({ badgeId: userBadges.badgeId }).from(userBadges).where(eq(userBadges.userId, userId)),
  ]);

  const owned = new Set(existing.map((row) => row.badgeId));
  const awarded: typeof catalog = [];

  for (const badge of catalog) {
    if (owned.has(badge.id)) continue;

    const progress =
      badge.criteria.type === "quizzes_passed"
        ? stats.quizzesPassed
        : badge.criteria.type === "articles_read"
          ? stats.articlesRead
          : badge.criteria.type === "comments"
            ? stats.commentsApproved
            : stats.points;

    if (progress < badge.criteria.gte) continue;

    const inserted = await db
      .insert(userBadges)
      .values({ userId, badgeId: badge.id })
      .onConflictDoNothing()
      .returning({ id: userBadges.id });

    if (inserted.length === 0) continue;
    awarded.push(badge);

    if (badge.points > 0) {
      await db
        .insert(pointEvents)
        .values({
          userId,
          action: "badge_awarded",
          points: badge.points,
          refType: "badge",
          refId: badge.id,
        })
        .onConflictDoNothing();
    }
  }

  return awarded;
}
