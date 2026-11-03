import { desc, eq, sql } from "drizzle-orm";
import { describeRoute } from "hono-openapi";
import { z } from "zod";

import { calculatorResults } from "@/db/schema";
import { anonymousKey, created, fail, ok, paginated, pagination } from "@/lib/http";
import { estimateImpact } from "@/lib/calculator";
import { commonErrorResponses, errorResponse, jsonResponse } from "@/lib/openapi";
import { jsonBody } from "@/lib/validate";
import { createHono } from "@/router/app";

const estimateSchema = z.object({
  monthlySpend: z.number().min(0).max(1_000_000_000),
  durationYears: z.number().min(0.1).max(50),
  monthlyIncome: z.number().min(0).max(1_000_000_000).optional(),
  age: z.number().int().min(10).max(90).optional(),
});

const router = createHono()
  .post(
    "/estimate",
    describeRoute({
      tags: ["Calculator"],
      summary: "Hitung estimasi kerugian finansial dan dampak masa depan",
      description:
        "Menghitung total pengeluaran, potensi keuntungan investasi yang hilang, dampak karier, biaya kesehatan, dan biaya hukum. Hasil disimpan untuk riwayat.",
      responses: {
        ...commonErrorResponses,
        201: jsonResponse("Input, rincian kerugian, dan rekomendasi"),
      },
    }),
    jsonBody(estimateSchema),
    async (c) => {
      const db = c.get("db");
      const input = c.req.valid("json");
      const user = c.get("user");

      const result = estimateImpact(input);

      const [saved] = await db
        .insert(calculatorResults)
        .values({
          userId: user?.id ?? null,
          sessionKey: user ? null : anonymousKey(c),
          input,
          result: { ...result },
        })
        .returning({ id: calculatorResults.id, createdAt: calculatorResults.createdAt });

      return created(c, { id: saved.id, createdAt: saved.createdAt, input, result });
    },
  )

  .get(
    "/results",
    describeRoute({
      tags: ["Calculator"],
      summary: "Riwayat perhitungan milik saya",
      responses: {
        ...commonErrorResponses,
        200: jsonResponse("Riwayat perhitungan terpaginasi"),
        401: errorResponse("Riwayat anonim membutuhkan header x-session-key"),
      },
    }),
    async (c) => {
      const db = c.get("db");
      const user = c.get("user");
      const sessionKey = anonymousKey(c);
      const page = pagination(c);

      if (!user && !sessionKey) {
        return fail(c, 401, "Masuk atau sertakan header x-session-key untuk melihat riwayat.");
      }

      const where = user
        ? eq(calculatorResults.userId, user.id)
        : eq(calculatorResults.sessionKey, sessionKey as string);

      const [rows, count] = await Promise.all([
        db
          .select()
          .from(calculatorResults)
          .where(where)
          .orderBy(desc(calculatorResults.createdAt))
          .limit(page.perPage)
          .offset(page.offset),
        db
          .select({ total: sql<number>`count(*)::int` })
          .from(calculatorResults)
          .where(where),
      ]);

      return ok(c, paginated(page, count[0]?.total ?? 0, rows));
    },
  );

export default router;
