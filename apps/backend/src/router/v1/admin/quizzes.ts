import { and, asc, desc, eq, inArray, sql, type SQL } from "drizzle-orm";
import { describeRoute } from "hono-openapi";
import { z } from "zod";

import { quizOptions, quizQuestions, quizzes } from "@/db/schema";
import type { Database } from "@/db";
import { created, fail, ok, paginated, pagination } from "@/lib/http";
import { commonErrorResponses, errorResponse, jsonResponse } from "@/lib/openapi";
import { slugify, uniqueSlug } from "@/lib/slug";
import { jsonBody } from "@/lib/validate";
import { createHono } from "@/router/app";

const DIFFICULTIES = ["easy", "medium", "hard"] as const;
const STATUSES = ["draft", "published", "archived"] as const;

const optionSchema = z.object({
  label: z.string().trim().min(1).max(300),
  isCorrect: z.boolean().default(false),
  position: z.number().int().min(0).max(100).optional(),
});

const questionSchema = z.object({
  prompt: z.string().trim().min(5).max(1_000),
  explanation: z.string().trim().max(2_000).nullish(),
  position: z.number().int().min(0).max(100).optional(),
  options: z
    .array(optionSchema)
    .min(2)
    .max(6)
    .refine((options) => options.some((option) => option.isCorrect), {
      message: "Setiap soal harus memiliki minimal satu jawaban benar.",
    }),
});

const quizCreateSchema = z.object({
  slug: z
    .string()
    .trim()
    .min(3)
    .max(160)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
    .optional(),
  title: z.string().trim().min(3).max(200),
  description: z.string().trim().min(10).max(1_000),
  difficulty: z.enum(DIFFICULTIES).default("easy"),
  status: z.enum(STATUSES).default("draft"),
  passScore: z.number().int().min(0).max(100).default(70),
  timeLimitSeconds: z.number().int().min(30).max(7_200).nullish(),
  questions: z.array(questionSchema).min(1).max(100),
});

const quizUpdateSchema = z.object({
  slug: z
    .string()
    .trim()
    .min(3)
    .max(160)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
    .optional(),
  title: z.string().trim().min(3).max(200).optional(),
  description: z.string().trim().min(10).max(1_000).optional(),
  difficulty: z.enum(DIFFICULTIES).optional(),
  status: z.enum(STATUSES).optional(),
  passScore: z.number().int().min(0).max(100).optional(),
  timeLimitSeconds: z.number().int().min(30).max(7_200).nullish(),
});

const questionsSchema = z.object({
  questions: z.array(questionSchema).min(1).max(100),
});

async function insertQuestions(
  db: Database,
  quizId: string,
  questions: z.infer<typeof questionSchema>[],
): Promise<void> {
  for (const [index, question] of questions.entries()) {
    const [row] = await db
      .insert(quizQuestions)
      .values({
        quizId,
        prompt: question.prompt,
        explanation: question.explanation ?? null,
        position: question.position ?? index,
      })
      .returning({ id: quizQuestions.id });

    await db.insert(quizOptions).values(
      question.options.map((option, optionIndex) => ({
        questionId: row.id,
        label: option.label,
        isCorrect: option.isCorrect,
        position: option.position ?? optionIndex,
      })),
    );
  }
}

const router = createHono()
  .get(
    "/",
    describeRoute({
      tags: ["Admin"],
      summary: "Daftar seluruh kuis",
      responses: {
        ...commonErrorResponses,
        200: jsonResponse("Kuis terpaginasi"),
      },
    }),
    async (c) => {
      const db = c.get("db");
      const page = pagination(c);

      const filters: SQL[] = [];
      const status = c.req.query("status");
      if (status && (STATUSES as readonly string[]).includes(status)) {
        filters.push(eq(quizzes.status, status as (typeof STATUSES)[number]));
      }

      const where = filters.length > 0 ? and(...filters) : undefined;

      const [rows, count] = await Promise.all([
        db
          .select()
          .from(quizzes)
          .where(where)
          .orderBy(desc(quizzes.updatedAt))
          .limit(page.perPage)
          .offset(page.offset),
        db.select({ total: sql<number>`count(*)::int` }).from(quizzes).where(where),
      ]);

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
        paginated(
          page,
          count[0]?.total ?? 0,
          rows.map((row) => ({ ...row, questionCount: countMap.get(row.id) ?? 0 })),
        ),
      );
    },
  )

  .post(
    "/",
    describeRoute({
      tags: ["Admin"],
      summary: "Buat kuis beserta soal",
      responses: {
        ...commonErrorResponses,
        201: jsonResponse("Kuis dibuat"),
        409: errorResponse("Slug sudah dipakai"),
      },
    }),
    jsonBody(quizCreateSchema),
    async (c) => {
      const db = c.get("db");
      const body = c.req.valid("json");

      let slug = body.slug ?? slugify(body.title);
      const [clash] = await db
        .select({ id: quizzes.id })
        .from(quizzes)
        .where(eq(quizzes.slug, slug))
        .limit(1);

      if (clash) {
        if (body.slug) return fail(c, 409, "Slug sudah digunakan kuis lain.");
        slug = uniqueSlug(body.title);
      }

      const [quiz] = await db
        .insert(quizzes)
        .values({
          slug,
          title: body.title,
          description: body.description,
          difficulty: body.difficulty,
          status: body.status,
          passScore: body.passScore,
          timeLimitSeconds: body.timeLimitSeconds ?? null,
        })
        .returning();

      await insertQuestions(db, quiz.id, body.questions);

      return created(c, { ...quiz, questionCount: body.questions.length });
    },
  )

  .get(
    "/:id",
    describeRoute({
      tags: ["Admin"],
      summary: "Detail kuis beserta kunci jawaban",
      responses: {
        ...commonErrorResponses,
        200: jsonResponse("Kuis lengkap"),
        404: errorResponse("Kuis tidak ditemukan"),
      },
    }),
    async (c) => {
      const db = c.get("db");
      const id = c.req.param("id");

      const [quiz] = await db.select().from(quizzes).where(eq(quizzes.id, id)).limit(1);
      if (!quiz) return fail(c, 404, "Kuis tidak ditemukan.");

      const questions = await db
        .select()
        .from(quizQuestions)
        .where(eq(quizQuestions.quizId, quiz.id))
        .orderBy(asc(quizQuestions.position));

      const options = questions.length
        ? await db
            .select()
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

  .patch(
    "/:id",
    describeRoute({
      tags: ["Admin"],
      summary: "Perbarui metadata kuis",
      description: "Untuk mengganti soal, gunakan PUT /admin/quizzes/:id/questions.",
      responses: {
        ...commonErrorResponses,
        200: jsonResponse("Kuis terbaru"),
        404: errorResponse("Kuis tidak ditemukan"),
        409: errorResponse("Slug sudah dipakai"),
      },
    }),
    jsonBody(quizUpdateSchema),
    async (c) => {
      const db = c.get("db");
      const id = c.req.param("id");
      const body = c.req.valid("json");

      const [existing] = await db.select().from(quizzes).where(eq(quizzes.id, id)).limit(1);
      if (!existing) return fail(c, 404, "Kuis tidak ditemukan.");

      const updates: Partial<typeof quizzes.$inferInsert> = {};
      if (body.slug !== undefined) updates.slug = body.slug;
      if (body.title !== undefined) updates.title = body.title;
      if (body.description !== undefined) updates.description = body.description;
      if (body.difficulty !== undefined) updates.difficulty = body.difficulty;
      if (body.status !== undefined) updates.status = body.status;
      if (body.passScore !== undefined) updates.passScore = body.passScore;
      if (body.timeLimitSeconds !== undefined) updates.timeLimitSeconds = body.timeLimitSeconds;

      if (Object.keys(updates).length === 0) {
        return fail(c, 400, "Tidak ada perubahan yang dikirim.");
      }

      if (updates.slug && updates.slug !== existing.slug) {
        const [clash] = await db
          .select({ id: quizzes.id })
          .from(quizzes)
          .where(eq(quizzes.slug, updates.slug))
          .limit(1);
        if (clash && clash.id !== id) return fail(c, 409, "Slug sudah digunakan kuis lain.");
      }

      const [row] = await db.update(quizzes).set(updates).where(eq(quizzes.id, id)).returning();
      return ok(c, row);
    },
  )

  .put(
    "/:id/questions",
    describeRoute({
      tags: ["Admin"],
      summary: "Ganti seluruh soal kuis",
      responses: {
        ...commonErrorResponses,
        200: jsonResponse("Soal kuis diganti"),
        404: errorResponse("Kuis tidak ditemukan"),
      },
    }),
    jsonBody(questionsSchema),
    async (c) => {
      const db = c.get("db");
      const id = c.req.param("id");
      const body = c.req.valid("json");

      const [quiz] = await db.select({ id: quizzes.id }).from(quizzes).where(eq(quizzes.id, id)).limit(1);
      if (!quiz) return fail(c, 404, "Kuis tidak ditemukan.");

      await db.delete(quizQuestions).where(eq(quizQuestions.quizId, quiz.id));
      await insertQuestions(db, quiz.id, body.questions);

      return ok(c, { quizId: quiz.id, questionCount: body.questions.length });
    },
  )

  .delete(
    "/:id",
    describeRoute({
      tags: ["Admin"],
      summary: "Hapus kuis",
      responses: {
        ...commonErrorResponses,
        200: jsonResponse("Kuis dihapus"),
        404: errorResponse("Kuis tidak ditemukan"),
      },
    }),
    async (c) => {
      const db = c.get("db");
      const id = c.req.param("id");

      const deleted = await db
        .delete(quizzes)
        .where(eq(quizzes.id, id))
        .returning({ id: quizzes.id });

      if (deleted.length === 0) return fail(c, 404, "Kuis tidak ditemukan.");
      return ok(c, { id, deleted: true });
    },
  );

export default router;
