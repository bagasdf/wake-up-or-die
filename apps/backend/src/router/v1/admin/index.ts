import { eq, sql } from "drizzle-orm";
import { describeRoute } from "hono-openapi";

import {
  articles,
  certificates,
  comments,
  helpContacts,
  mediaAssets,
  quizAttempts,
  quizzes,
  reports,
  user,
} from "@/db/schema";
import { requireAdmin } from "@/lib/guards";
import { ok } from "@/lib/http";
import { commonErrorResponses, jsonResponse } from "@/lib/openapi";
import { createHono } from "@/router/app";

import articlesAdminRouter from "./articles";
import commentsAdminRouter from "./comments";
import contactsAdminRouter from "./contacts";
import galleryAdminRouter from "./gallery";
import quizzesAdminRouter from "./quizzes";
import reportsAdminRouter from "./reports";
import settingsAdminRouter from "./settings";
import usersAdminRouter from "./users";

const router = createHono()
  .use("/*", requireAdmin)
  .get(
    "/stats",
    describeRoute({
      tags: ["Admin"],
      summary: "Ringkasan statistik untuk dasbor admin",
      responses: {
        ...commonErrorResponses,
        200: jsonResponse("Statistik konten dan pengguna"),
      },
    }),
    async (c) => {
      const db = c.get("db");

      const [userCount, articleCount, quizCount, pendingComments, newReports, mediaCount, attempts, certificateCount, contactCount] =
        await Promise.all([
          db.select({ total: sql<number>`count(*)::int` }).from(user),
          db
            .select({ total: sql<number>`count(*)::int` })
            .from(articles)
            .where(eq(articles.status, "published")),
          db
            .select({ total: sql<number>`count(*)::int` })
            .from(quizzes)
            .where(eq(quizzes.status, "published")),
          db
            .select({ total: sql<number>`count(*)::int` })
            .from(comments)
            .where(eq(comments.status, "pending")),
          db
            .select({ total: sql<number>`count(*)::int` })
            .from(reports)
            .where(eq(reports.status, "new")),
          db.select({ total: sql<number>`count(*)::int` }).from(mediaAssets),
          db.select({ total: sql<number>`count(*)::int` }).from(quizAttempts),
          db.select({ total: sql<number>`count(*)::int` }).from(certificates),
          db.select({ total: sql<number>`count(*)::int` }).from(helpContacts),
        ]);

      return ok(c, {
        users: userCount[0]?.total ?? 0,
        publishedArticles: articleCount[0]?.total ?? 0,
        publishedQuizzes: quizCount[0]?.total ?? 0,
        pendingComments: pendingComments[0]?.total ?? 0,
        newReports: newReports[0]?.total ?? 0,
        mediaAssets: mediaCount[0]?.total ?? 0,
        quizAttempts: attempts[0]?.total ?? 0,
        certificates: certificateCount[0]?.total ?? 0,
        contacts: contactCount[0]?.total ?? 0,
      });
    },
  )
  .route("/articles", articlesAdminRouter)
  .route("/quizzes", quizzesAdminRouter)
  .route("/comments", commentsAdminRouter)
  .route("/reports", reportsAdminRouter)
  .route("/gallery", galleryAdminRouter)
  .route("/contacts", contactsAdminRouter)
  .route("/settings", settingsAdminRouter)
  .route("/users", usersAdminRouter);

export default router;
