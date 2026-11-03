import { and, desc, eq, or, sql } from "drizzle-orm";
import { describeRoute } from "hono-openapi";

import {
  articles,
  badges,
  helpContacts,
  mediaAssets,
  quizzes,
  siteSettings,
} from "@/db/schema";
import { DEFAULT_APP_NAME } from "@/env";
import { ok } from "@/lib/http";
import { commonErrorResponses, jsonResponse } from "@/lib/openapi";
import { createHono } from "@/router/app";

const router = createHono().get(
  "/",
  describeRoute({
    tags: ["Home"],
    summary: "Data ringkas untuk halaman beranda",
    description:
      "Menggabungkan banner, statistik konten, artikel unggulan, kuis, lencana, kontak darurat, dan galeri dalam satu permintaan.",
    responses: {
      ...commonErrorResponses,
      200: jsonResponse(
        "Konten beranda: hero, statistik, artikel, kuis, lencana, kontak, dan galeri",
      ),
    },
  }),
  async (c) => {
    const db = c.get("db");

    const [
      featured,
      latest,
      quizList,
      badgeList,
      contacts,
      gallery,
      settings,
      articleCount,
      quizCount,
      badgeCount,
    ] = await Promise.all([
      db
        .select({
          id: articles.id,
          slug: articles.slug,
          title: articles.title,
          excerpt: articles.excerpt,
          coverImageUrl: articles.coverImageUrl,
          category: articles.category,
          readingMinutes: articles.readingMinutes,
          publishedAt: articles.publishedAt,
        })
        .from(articles)
        .where(eq(articles.status, "published"))
        .orderBy(desc(articles.publishedAt))
        .limit(3),
      db
        .select({
          id: articles.id,
          slug: articles.slug,
          title: articles.title,
          excerpt: articles.excerpt,
          coverImageUrl: articles.coverImageUrl,
          category: articles.category,
          readingMinutes: articles.readingMinutes,
          publishedAt: articles.publishedAt,
        })
        .from(articles)
        .where(eq(articles.status, "published"))
        .orderBy(desc(articles.publishedAt))
        .limit(6),
      db
        .select({
          id: quizzes.id,
          slug: quizzes.slug,
          title: quizzes.title,
          description: quizzes.description,
          difficulty: quizzes.difficulty,
          passScore: quizzes.passScore,
          timeLimitSeconds: quizzes.timeLimitSeconds,
        })
        .from(quizzes)
        .where(eq(quizzes.status, "published"))
        .limit(3),
      db.select().from(badges).limit(6),
      db
        .select()
        .from(helpContacts)
        .where(
          and(
            eq(helpContacts.isVerified, true),
            or(eq(helpContacts.is24h, true), eq(helpContacts.category, "darurat")),
          ),
        )
        .orderBy(helpContacts.position)
        .limit(4),
      db
        .select({
          id: mediaAssets.id,
          title: mediaAssets.title,
          type: mediaAssets.type,
          thumbnailUrl: mediaAssets.thumbnailUrl,
          url: mediaAssets.url,
        })
        .from(mediaAssets)
        .where(eq(mediaAssets.isPublished, true))
        .orderBy(desc(mediaAssets.createdAt))
        .limit(4),
      db.select().from(siteSettings),
      db
        .select({ total: sql<number>`count(*)::int` })
        .from(articles)
        .where(eq(articles.status, "published")),
      db
        .select({ total: sql<number>`count(*)::int` })
        .from(quizzes)
        .where(eq(quizzes.status, "published")),
      db.select({ total: sql<number>`count(*)::int` }).from(badges),
      ]);

    const settingsMap = Object.fromEntries(settings.map((row) => [row.key, row.value]));

    return ok(c, {
      hero: {
        appName: c.env.APP_NAME ?? DEFAULT_APP_NAME,
        headline:
          (settingsMap.heroHeadline as string | undefined) ??
          "Kenali bahayanya, lindungi masa depanmu.",
        subheadline:
          (settingsMap.heroSubheadline as string | undefined) ??
          "Edukasi anti narkoba yang jujur, mudah dipahami, dan tanpa menghakimi.",
        cta: { label: "Mulai belajar", href: "/artikel" },
      },
      stats: {
        articles: articleCount[0]?.total ?? 0,
        quizzes: quizCount[0]?.total ?? 0,
        badges: badgeCount[0]?.total ?? 0,
      },
      featuredArticles: featured,
      latestArticles: latest,
      quizzes: quizList,
      badges: badgeList,
      emergencyContacts: contacts,
      gallery,
      settings: settingsMap,
    });
  },
);

export default router;
