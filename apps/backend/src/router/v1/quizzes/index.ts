import { and, asc, desc, eq, inArray, sql } from "drizzle-orm";
import { describeRoute } from "hono-openapi";
import { z } from "zod";

import {
  certificates,
  quizAttempts,
  quizOptions,
  quizQuestions,
  quizzes,
} from "@/db/schema";
import { newCertificateCode } from "@/lib/certificate";
import { anonymousKey, created, fail, ipFingerprint, ok } from "@/lib/http";
import { commonErrorResponses, errorResponse, jsonResponse } from "@/lib/openapi";
import { awardPoints, getUserStats, syncBadges } from "@/lib/points";
import { rateLimit } from "@/lib/rate-limit";
import { jsonBody } from "@/lib/validate";
import { createHono } from "@/router/app";

const attemptBodySchema = z.object({
  answers: z
    .array(
      z.object({
        questionId: z.string().min(1),
        optionId: z.string().min(1),
      }),
    )
    .min(1)
    .max(100),
});

const router = createHono()
  .get(
    "/",
    describeRoute({
      tags: ["Quizzes"],
      summary: "Daftar kuis edukasi",
      responses: {
        ...commonErrorResponses,
        200: jsonResponse("Daftar kuis beserta jumlah soal"),
      },
    }),
    async (c) => {
      const db = c.get("db");
      const difficulty = c.req.query("difficulty");

      const filters = [eq(quizzes.status, "published")];
      if (difficulty === "easy" || difficulty === "medium" || difficulty === "hard") {
        filters.push(eq(quizzes.difficulty, difficulty));
      }

      const rows = await db
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
        .where(and(...filters))
        .orderBy(asc(quizzes.title));

      const counts = rows.length
        ? await db
            .select({ quizId: quizQuestions.quizId, total: sql<number>`count(*)::int` })
            .from(quizQuestions)
            .where(
              inArray(
                quizQuestions.quizId,
                rows.map((row) => row.id),
              ),
            )
            .groupBy(quizQuestions.quizId)
        : [];

      const countMap = new Map(counts.map((row) => [row.quizId, row.total]));

      return ok(
        c,
        rows.map((row) => ({ ...row, questionCount: countMap.get(row.id) ?? 0 })),
      );
    },
  )

  .get(
    "/:slug",
    describeRoute({
      tags: ["Quizzes"],
      summary: "Detail kuis beserta soal dan pilihan jawaban",
      description: "Kunci jawaban tidak disertakan; penilaian dilakukan di server.",
      responses: {
        ...commonErrorResponses,
        200: jsonResponse("Detail kuis"),
        404: errorResponse("Kuis tidak ditemukan"),
      },
    }),
    async (c) => {
      const db = c.get("db");
      const slug = c.req.param("slug");

      const [quiz] = await db
        .select()
        .from(quizzes)
        .where(and(eq(quizzes.slug, slug), eq(quizzes.status, "published")))
        .limit(1);

      if (!quiz) return fail(c, 404, "Kuis tidak ditemukan.");

      const questions = await db
        .select({
          id: quizQuestions.id,
          prompt: quizQuestions.prompt,
          position: quizQuestions.position,
        })
        .from(quizQuestions)
        .where(eq(quizQuestions.quizId, quiz.id))
        .orderBy(asc(quizQuestions.position));

      const options = questions.length
        ? await db
            .select({
              id: quizOptions.id,
              questionId: quizOptions.questionId,
              label: quizOptions.label,
              position: quizOptions.position,
            })
            .from(quizOptions)
            .where(
              inArray(
                quizOptions.questionId,
                questions.map((question) => question.id),
              ),
            )
            .orderBy(asc(quizOptions.position))
        : [];

      const optionsByQuestion = new Map<string, typeof options>();
      for (const option of options) {
        const bucket = optionsByQuestion.get(option.questionId) ?? [];
        bucket.push(option);
        optionsByQuestion.set(option.questionId, bucket);
      }

      return ok(c, {
        ...quiz,
        questions: questions.map((question) => ({
          ...question,
          options: optionsByQuestion.get(question.id) ?? [],
        })),
      });
    },
  )

  .post(
    "/:slug/attempts",
    describeRoute({
      tags: ["Quizzes"],
      summary: "Kirim jawaban kuis dan dapatkan skor",
      description:
        "Menilai jawaban di server, menyimpan riwayat percobaan, memberi poin, dan menerbitkan sertifikat bila lulus.",
      responses: {
        ...commonErrorResponses,
        201: jsonResponse("Hasil kuis beserta pembahasan dan sertifikat"),
        400: errorResponse("Soal kuis belum tersedia atau jawaban tidak lengkap"),
        404: errorResponse("Kuis tidak ditemukan"),
      },
    }),
    jsonBody(attemptBodySchema),
    async (c) => {
      const db = c.get("db");
      const slug = c.req.param("slug");
      const user = c.get("user");
      const body = c.req.valid("json");

      const fingerprint = await ipFingerprint(c);
      const limit = rateLimit(`quiz:${fingerprint}`, 60, 10 * 60 * 1_000);
      if (!limit.ok) {
        c.header("Retry-After", String(limit.retryAfterSeconds));
        return fail(c, 429, "Terlalu banyak percobaan kuis. Tunggu sebentar lalu coba lagi.");
      }

      const [quiz] = await db
        .select()
        .from(quizzes)
        .where(and(eq(quizzes.slug, slug), eq(quizzes.status, "published")))
        .limit(1);

      if (!quiz) return fail(c, 404, "Kuis tidak ditemukan.");

      const questions = await db
        .select()
        .from(quizQuestions)
        .where(eq(quizQuestions.quizId, quiz.id))
        .orderBy(asc(quizQuestions.position));

      if (questions.length === 0) {
        return fail(c, 400, "Kuis ini belum memiliki soal.");
      }

      const options = await db
        .select()
        .from(quizOptions)
        .where(
          inArray(
            quizOptions.questionId,
            questions.map((question) => question.id),
          ),
        );

      const optionById = new Map(options.map((option) => [option.id, option]));
      const answerByQuestion = new Map(body.answers.map((answer) => [answer.questionId, answer.optionId]));

      const review = questions.map((question) => {
        const selectedOptionId = answerByQuestion.get(question.id) ?? null;
        const selected = selectedOptionId ? optionById.get(selectedOptionId) : undefined;
        const correctOption = options.find(
          (option) => option.questionId === question.id && option.isCorrect,
        );

        return {
          questionId: question.id,
          prompt: question.prompt,
          explanation: question.explanation,
          selectedOptionId,
          selectedLabel: selected?.label ?? null,
          correctOptionId: correctOption?.id ?? null,
          correctLabel: correctOption?.label ?? null,
          correct: Boolean(selected && correctOption && selected.id === correctOption.id),
        };
      });

      const correctCount = review.filter((item) => item.correct).length;
      const totalQuestions = questions.length;
      const score = Math.round((correctCount / totalQuestions) * 100);
      const passed = score >= quiz.passScore;
      const sessionKey = user ? null : anonymousKey(c);

      const [attempt] = await db
        .insert(quizAttempts)
        .values({
          quizId: quiz.id,
          userId: user?.id ?? null,
          sessionKey,
          score,
          correctCount,
          totalQuestions,
          passed,
          answers: review.map((item) => ({
            questionId: item.questionId,
            optionId: item.selectedOptionId ?? "",
            correct: item.correct,
          })),
        })
        .returning();

      let certificate = null;
      let stats = null;

      if (user) {
        await awardPoints(db, user.id, "quiz_complete", { type: "quiz", id: quiz.id });
        if (passed) {
          await awardPoints(db, user.id, "quiz_pass", { type: "quiz", id: quiz.id });

          const code = newCertificateCode();
          const inserted = await db
            .insert(certificates)
            .values({
              code,
              userId: user.id,
              type: "quiz",
              refId: quiz.id,
              title: quiz.title,
              recipientName: user.name,
              metadata: { score, correctCount, totalQuestions },
            })
            .onConflictDoNothing()
            .returning();

          certificate =
            inserted[0] ??
            (
              await db
                .select()
                .from(certificates)
                .where(
                  and(
                    eq(certificates.userId, user.id),
                    eq(certificates.type, "quiz"),
                    eq(certificates.refId, quiz.id),
                  ),
                )
                .limit(1)
            )[0] ??
            null;

          if (inserted[0]) {
            await awardPoints(db, user.id, "certificate_issued", {
              type: "certificate",
              id: inserted[0].id,
            });
          }
        }

        const badges = await syncBadges(db, user.id);
        stats = { ...(await getUserStats(db, user.id)), badges };
      }

      return created(c, {
        attemptId: attempt.id,
        quizId: quiz.id,
        score,
        correctCount,
        totalQuestions,
        passed,
        passScore: quiz.passScore,
        review,
        certificate,
        stats,
      });
    },
  )

  .get(
    "/:slug/leaderboard",
    describeRoute({
      tags: ["Quizzes"],
      summary: "Papan skor kuis",
      responses: {
        ...commonErrorResponses,
        200: jsonResponse("Sepuluh skor terbaik"),
      },
    }),
    async (c) => {
      const db = c.get("db");
      const slug = c.req.param("slug");

      const [quiz] = await db
        .select({ id: quizzes.id })
        .from(quizzes)
        .where(and(eq(quizzes.slug, slug), eq(quizzes.status, "published")))
        .limit(1);

      if (!quiz) return fail(c, 404, "Kuis tidak ditemukan.");

      const rows = await db
        .select({
          score: quizAttempts.score,
          correctCount: quizAttempts.correctCount,
          totalQuestions: quizAttempts.totalQuestions,
          completedAt: quizAttempts.completedAt,
        })
        .from(quizAttempts)
        .where(and(eq(quizAttempts.quizId, quiz.id), eq(quizAttempts.passed, true)))
        .orderBy(desc(quizAttempts.score), desc(quizAttempts.completedAt))
        .limit(10);

      return ok(c, rows);
    },
  );

export default router;
