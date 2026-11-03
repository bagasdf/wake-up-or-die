import { and, asc, eq, ilike, or, sql, type SQL } from "drizzle-orm";
import { describeRoute } from "hono-openapi";
import { z } from "zod";

import { helpContacts, type ContactCategory } from "@/db/schema";
import { created, fail, ok, paginated, pagination } from "@/lib/http";
import { commonErrorResponses, errorResponse, jsonResponse } from "@/lib/openapi";
import { jsonBody } from "@/lib/validate";
import { createHono } from "@/router/app";

const CATEGORIES = ["darurat", "bnn", "rehabilitasi", "hotline", "lainnya"] as const;

const contactFields = {
  name: z.string().trim().min(2).max(200),
  organization: z.string().trim().max(200).nullish(),
  category: z.enum(CATEGORIES).default("hotline"),
  phone: z.string().trim().max(60).nullish(),
  whatsapp: z.string().trim().max(60).nullish(),
  email: z.string().email().max(200).nullish(),
  website: z.string().url().max(500).nullish(),
  address: z.string().trim().max(500).nullish(),
  city: z.string().trim().max(120).nullish(),
  province: z.string().trim().max(120).nullish(),
  latitude: z.number().min(-90).max(90).nullish(),
  longitude: z.number().min(-180).max(180).nullish(),
  operatingHours: z.string().trim().max(200).nullish(),
  is24h: z.boolean().default(false),
  isVerified: z.boolean().default(true),
  position: z.number().int().min(0).max(10_000).default(0),
};

const createSchema = z.object(contactFields);
const updateSchema = z.object(contactFields).partial();

const router = createHono()
  .get(
    "/",
    describeRoute({
      tags: ["Admin"],
      summary: "Daftar seluruh kontak bantuan",
      responses: {
        ...commonErrorResponses,
        200: jsonResponse("Kontak terpaginasi"),
      },
    }),
    async (c) => {
      const db = c.get("db");
      const page = pagination(c);

      const filters: SQL[] = [];
      const category = c.req.query("category");
      if (category && (CATEGORIES as readonly string[]).includes(category)) {
        filters.push(eq(helpContacts.category, category as ContactCategory));
      }
      const q = c.req.query("q")?.trim();
      if (q) {
        const pattern = `%${q}%`;
        const search = or(ilike(helpContacts.name, pattern), ilike(helpContacts.city, pattern));
        if (search) filters.push(search);
      }

      const where = filters.length > 0 ? and(...filters) : undefined;

      const [rows, count] = await Promise.all([
        db
          .select()
          .from(helpContacts)
          .where(where)
          .orderBy(asc(helpContacts.position), asc(helpContacts.name))
          .limit(page.perPage)
          .offset(page.offset),
        db.select({ total: sql<number>`count(*)::int` }).from(helpContacts).where(where),
      ]);

      return ok(c, paginated(page, count[0]?.total ?? 0, rows));
    },
  )

  .post(
    "/",
    describeRoute({
      tags: ["Admin"],
      summary: "Tambah kontak bantuan",
      responses: {
        ...commonErrorResponses,
        201: jsonResponse("Kontak dibuat"),
      },
    }),
    jsonBody(createSchema),
    async (c) => {
      const db = c.get("db");
      const body = c.req.valid("json");

      const [row] = await db
        .insert(helpContacts)
        .values({
          ...body,
          organization: body.organization ?? null,
          phone: body.phone ?? null,
          whatsapp: body.whatsapp ?? null,
          email: body.email ?? null,
          website: body.website ?? null,
          address: body.address ?? null,
          city: body.city ?? null,
          province: body.province ?? null,
          latitude: body.latitude ?? null,
          longitude: body.longitude ?? null,
          operatingHours: body.operatingHours ?? null,
        })
        .returning();

      return created(c, row);
    },
  )

  .patch(
    "/:id",
    describeRoute({
      tags: ["Admin"],
      summary: "Perbarui kontak bantuan",
      responses: {
        ...commonErrorResponses,
        200: jsonResponse("Kontak terbaru"),
        404: errorResponse("Kontak tidak ditemukan"),
      },
    }),
    jsonBody(updateSchema),
    async (c) => {
      const db = c.get("db");
      const id = c.req.param("id");
      const body = c.req.valid("json");

      const [existing] = await db
        .select({ id: helpContacts.id })
        .from(helpContacts)
        .where(eq(helpContacts.id, id))
        .limit(1);
      if (!existing) return fail(c, 404, "Kontak tidak ditemukan.");

      const updates: Partial<typeof helpContacts.$inferInsert> = {};
      for (const [key, value] of Object.entries(body)) {
        if (value !== undefined) {
          (updates as Record<string, unknown>)[key] = value;
        }
      }

      if (Object.keys(updates).length === 0) {
        return fail(c, 400, "Tidak ada perubahan yang dikirim.");
      }

      const [row] = await db
        .update(helpContacts)
        .set(updates)
        .where(eq(helpContacts.id, id))
        .returning();
      return ok(c, row);
    },
  )

  .delete(
    "/:id",
    describeRoute({
      tags: ["Admin"],
      summary: "Hapus kontak bantuan",
      responses: {
        ...commonErrorResponses,
        200: jsonResponse("Kontak dihapus"),
        404: errorResponse("Kontak tidak ditemukan"),
      },
    }),
    async (c) => {
      const db = c.get("db");
      const id = c.req.param("id");

      const deleted = await db
        .delete(helpContacts)
        .where(eq(helpContacts.id, id))
        .returning({ id: helpContacts.id });

      if (deleted.length === 0) return fail(c, 404, "Kontak tidak ditemukan.");
      return ok(c, { id, deleted: true });
    },
  );

export default router;
