import { and, desc, eq, ilike, or, sql, type SQL } from "drizzle-orm";
import { describeRoute } from "hono-openapi";
import { z } from "zod";

import { reports } from "@/db/schema";
import { currentUser } from "@/lib/guards";
import { fail, ok, paginated, pagination } from "@/lib/http";
import { commonErrorResponses, errorResponse, jsonResponse } from "@/lib/openapi";
import { jsonBody } from "@/lib/validate";
import { createHono } from "@/router/app";

const STATUSES = ["new", "in_review", "resolved", "closed"] as const;
const PRIORITIES = ["low", "normal", "high", "urgent"] as const;
const CATEGORIES = ["konsultasi", "pengaduan"] as const;

const updateSchema = z.object({
  status: z.enum(STATUSES).optional(),
  priority: z.enum(PRIORITIES).optional(),
  adminNotes: z.string().trim().max(5_000).nullish(),
});

const router = createHono()
  .get(
    "/",
    describeRoute({
      tags: ["Admin"],
      summary: "Daftar tiket konsultasi dan pengaduan",
      responses: {
        ...commonErrorResponses,
        200: jsonResponse("Tiket terpaginasi"),
      },
    }),
    async (c) => {
      const db = c.get("db");
      const page = pagination(c);

      const filters: SQL[] = [];
      const status = c.req.query("status");
      if (status && (STATUSES as readonly string[]).includes(status)) {
        filters.push(eq(reports.status, status as (typeof STATUSES)[number]));
      }
      const priority = c.req.query("priority");
      if (priority && (PRIORITIES as readonly string[]).includes(priority)) {
        filters.push(eq(reports.priority, priority as (typeof PRIORITIES)[number]));
      }
      const category = c.req.query("category");
      if (category && (CATEGORIES as readonly string[]).includes(category)) {
        filters.push(eq(reports.category, category as (typeof CATEGORIES)[number]));
      }
      const q = c.req.query("q")?.trim();
      if (q) {
        const pattern = `%${q}%`;
        const search = or(
          ilike(reports.ticketCode, pattern),
          ilike(reports.subject, pattern),
          ilike(reports.message, pattern),
        );
        if (search) filters.push(search);
      }

      const where = filters.length > 0 ? and(...filters) : undefined;

      const [rows, count] = await Promise.all([
        db
          .select({
            id: reports.id,
            ticketCode: reports.ticketCode,
            category: reports.category,
            subject: reports.subject,
            status: reports.status,
            priority: reports.priority,
            createdAt: reports.createdAt,
            updatedAt: reports.updatedAt,
          })
          .from(reports)
          .where(where)
          .orderBy(desc(reports.createdAt))
          .limit(page.perPage)
          .offset(page.offset),
        db.select({ total: sql<number>`count(*)::int` }).from(reports).where(where),
      ]);

      return ok(c, paginated(page, count[0]?.total ?? 0, rows));
    },
  )

  .get(
    "/:id",
    describeRoute({
      tags: ["Admin"],
      summary: "Detail tiket",
      responses: {
        ...commonErrorResponses,
        200: jsonResponse("Detail tiket termasuk pesan lengkap"),
        404: errorResponse("Tiket tidak ditemukan"),
      },
    }),
    async (c) => {
      const db = c.get("db");
      const id = c.req.param("id");

      const [row] = await db.select().from(reports).where(eq(reports.id, id)).limit(1);
      if (!row) return fail(c, 404, "Tiket tidak ditemukan.");
      return ok(c, row);
    },
  )

  .patch(
    "/:id",
    describeRoute({
      tags: ["Admin"],
      summary: "Perbarui status tiket",
      responses: {
        ...commonErrorResponses,
        200: jsonResponse("Tiket terbaru"),
        404: errorResponse("Tiket tidak ditemukan"),
      },
    }),
    jsonBody(updateSchema),
    async (c) => {
      const db = c.get("db");
      const me = currentUser(c);
      const id = c.req.param("id");
      const body = c.req.valid("json");

      const [existing] = await db.select().from(reports).where(eq(reports.id, id)).limit(1);
      if (!existing) return fail(c, 404, "Tiket tidak ditemukan.");

      const updates: Partial<typeof reports.$inferInsert> = { handledBy: me.id };
      if (body.status !== undefined) updates.status = body.status;
      if (body.priority !== undefined) updates.priority = body.priority;
      if (body.adminNotes !== undefined) updates.adminNotes = body.adminNotes;

      const [row] = await db.update(reports).set(updates).where(eq(reports.id, id)).returning();
      return ok(c, row);
    },
  )

  .delete(
    "/:id",
    describeRoute({
      tags: ["Admin"],
      summary: "Hapus tiket",
      responses: {
        ...commonErrorResponses,
        200: jsonResponse("Tiket dihapus"),
        404: errorResponse("Tiket tidak ditemukan"),
      },
    }),
    async (c) => {
      const db = c.get("db");
      const id = c.req.param("id");

      const deleted = await db
        .delete(reports)
        .where(eq(reports.id, id))
        .returning({ id: reports.id });

      if (deleted.length === 0) return fail(c, 404, "Tiket tidak ditemukan.");
      return ok(c, { id, deleted: true });
    },
  );

export default router;
