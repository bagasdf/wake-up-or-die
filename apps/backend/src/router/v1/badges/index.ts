import { and, asc, eq, sql } from "drizzle-orm";
import { describeRoute } from "hono-openapi";

import { badges, userBadges } from "@/db/schema";
import { ok } from "@/lib/http";
import { commonErrorResponses, jsonResponse } from "@/lib/openapi";
import { createHono } from "@/router/app";

const router = createHono().get(
  "/",
  describeRoute({
    tags: ["Gamification"],
    summary: "Katalog lencana",
    description:
      "Menampilkan seluruh lencana, kriteria, jumlah peraih, dan status kepemilikan pengguna yang sedang login.",
    responses: {
      ...commonErrorResponses,
      200: jsonResponse("Katalog lencana beserta status pengguna"),
    },
  }),
  async (c) => {
    const db = c.get("db");
    const user = c.get("user");

    const [catalog, holders, owned] = await Promise.all([
      db.select().from(badges).orderBy(asc(badges.points)),
      db
        .select({ badgeId: userBadges.badgeId, total: sql<number>`count(*)::int` })
        .from(userBadges)
        .groupBy(userBadges.badgeId),
      user
        ? db
            .select({ badgeId: userBadges.badgeId, awardedAt: userBadges.awardedAt })
            .from(userBadges)
            .where(eq(userBadges.userId, user.id))
        : Promise.resolve([]),
    ]);

    const holderMap = new Map(holders.map((row) => [row.badgeId, row.total]));
    const ownedMap = new Map(owned.map((row) => [row.badgeId, row.awardedAt]));

    return ok(
      c,
      catalog.map((badge) => ({
        ...badge,
        earnedBy: holderMap.get(badge.id) ?? 0,
        earned: ownedMap.has(badge.id),
        awardedAt: ownedMap.get(badge.id) ?? null,
      })),
    );
  },
);

export default router;
