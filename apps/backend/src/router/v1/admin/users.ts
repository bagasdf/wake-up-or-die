import { and, desc, eq, ilike, or, sql, type SQL } from "drizzle-orm";
import { describeRoute } from "hono-openapi";
import { z } from "zod";

import { user } from "@/db/schema";
import { currentUser } from "@/lib/guards";
import { fail, ok, paginated, pagination } from "@/lib/http";
import { commonErrorResponses, errorResponse, jsonResponse } from "@/lib/openapi";
import { jsonBody } from "@/lib/validate";
import { createHono } from "@/router/app";

const ROLES = ["user", "admin"] as const;

const updateSchema = z.object({
  role: z.enum(ROLES).optional(),
  banned: z.boolean().optional(),
  banReason: z.string().trim().max(500).nullish(),
});

const router = createHono()
  .get(
    "/",
    describeRoute({
      tags: ["Admin"],
      summary: "Daftar pengguna",
      responses: {
        ...commonErrorResponses,
        200: jsonResponse("Pengguna terpaginasi"),
      },
    }),
    async (c) => {
      const db = c.get("db");
      const page = pagination(c);

      const filters: SQL[] = [];
      const role = c.req.query("role");
      if (role && (ROLES as readonly string[]).includes(role)) {
        filters.push(eq(user.role, role));
      }
      const q = c.req.query("q")?.trim();
      if (q) {
        const pattern = `%${q}%`;
        const search = or(ilike(user.name, pattern), ilike(user.email, pattern));
        if (search) filters.push(search);
      }

      const where = filters.length > 0 ? and(...filters) : undefined;

      const [rows, count] = await Promise.all([
        db
          .select({
            id: user.id,
            name: user.name,
            email: user.email,
            image: user.image,
            role: user.role,
            banned: user.banned,
            createdAt: user.createdAt,
          })
          .from(user)
          .where(where)
          .orderBy(desc(user.createdAt))
          .limit(page.perPage)
          .offset(page.offset),
        db.select({ total: sql<number>`count(*)::int` }).from(user).where(where),
      ]);

      return ok(c, paginated(page, count[0]?.total ?? 0, rows));
    },
  )

  .patch(
    "/:id",
    describeRoute({
      tags: ["Admin"],
      summary: "Ubah peran atau blokir pengguna",
      responses: {
        ...commonErrorResponses,
        200: jsonResponse("Pengguna terbaru"),
        400: errorResponse("Admin tidak dapat menurunkan perannya sendiri"),
        404: errorResponse("Pengguna tidak ditemukan"),
      },
    }),
    jsonBody(updateSchema),
    async (c) => {
      const db = c.get("db");
      const me = currentUser(c);
      const id = c.req.param("id");
      const body = c.req.valid("json");

      const [existing] = await db
        .select({ id: user.id, role: user.role })
        .from(user)
        .where(eq(user.id, id))
        .limit(1);
      if (!existing) return fail(c, 404, "Pengguna tidak ditemukan.");

      if (id === me.id && body.role && body.role !== "admin") {
        return fail(c, 400, "Anda tidak dapat menurunkan peran akun sendiri.");
      }

      const updates: Partial<typeof user.$inferInsert> = {};
      if (body.role !== undefined) updates.role = body.role;
      if (body.banned !== undefined) {
        updates.banned = body.banned;
        if (!body.banned) updates.banReason = null;
      }
      if (body.banReason !== undefined) updates.banReason = body.banReason;

      if (Object.keys(updates).length === 0) {
        return fail(c, 400, "Tidak ada perubahan yang dikirim.");
      }

      const [row] = await db
        .update(user)
        .set(updates)
        .where(eq(user.id, id))
        .returning({
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          banned: user.banned,
          banReason: user.banReason,
        });

      return ok(c, row);
    },
  );

export default router;
