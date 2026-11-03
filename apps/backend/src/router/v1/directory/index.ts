import { and, asc, eq, ilike, or, sql, type SQL } from "drizzle-orm";
import { describeRoute } from "hono-openapi";

import { helpContacts, type ContactCategory } from "@/db/schema";
import { ok, paginated, pagination } from "@/lib/http";
import { commonErrorResponses, jsonResponse } from "@/lib/openapi";
import { createHono } from "@/router/app";

const CATEGORIES = ["darurat", "bnn", "rehabilitasi", "hotline", "lainnya"] as const;

function filtersFromQuery(c: {
  req: { query: (key: string) => string | undefined };
}): SQL[] {
  const filters: SQL[] = [eq(helpContacts.isVerified, true)];

  const category = c.req.query("category");
  if (category && (CATEGORIES as readonly string[]).includes(category)) {
    filters.push(eq(helpContacts.category, category as ContactCategory));
  }

  const province = c.req.query("province");
  if (province) filters.push(eq(helpContacts.province, province));

  const city = c.req.query("city");
  if (city) filters.push(eq(helpContacts.city, city));

  if (c.req.query("is24h") === "true") filters.push(eq(helpContacts.is24h, true));

  const q = c.req.query("q")?.trim();
  if (q) {
    const pattern = `%${q}%`;
    const search = or(
      ilike(helpContacts.name, pattern),
      ilike(helpContacts.organization, pattern),
      ilike(helpContacts.city, pattern),
      ilike(helpContacts.province, pattern),
      ilike(helpContacts.address, pattern),
    );
    if (search) filters.push(search);
  }

  return filters;
}

const router = createHono()
  .get(
    "/contacts",
    describeRoute({
      tags: ["Directory"],
      summary: "Direktori kontak bantuan dan darurat",
      description:
        "Mendukung filter kategori, provinsi, kota, layanan 24 jam, dan pencarian. Hanya kontak terverifikasi yang ditampilkan.",
      responses: {
        ...commonErrorResponses,
        200: jsonResponse("Kontak bantuan terpaginasi"),
      },
    }),
    async (c) => {
      const db = c.get("db");
      const page = pagination(c);
      const where = and(...filtersFromQuery(c));

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

  .get(
    "/emergency",
    describeRoute({
      tags: ["Directory"],
      summary: "Kontak darurat yang aktif 24 jam",
      responses: {
        ...commonErrorResponses,
        200: jsonResponse("Daftar kontak darurat"),
      },
    }),
    async (c) => {
      const db = c.get("db");

      const rows = await db
        .select()
        .from(helpContacts)
        .where(
          and(
            eq(helpContacts.isVerified, true),
            or(eq(helpContacts.is24h, true), eq(helpContacts.category, "darurat")),
          ),
        )
        .orderBy(asc(helpContacts.position));

      return ok(c, rows);
    },
  )

  .get(
    "/rehab",
    describeRoute({
      tags: ["Directory"],
      summary: "Lokasi layanan rehabilitasi",
      description:
        "Daftar pusat rehabilitasi terverifikasi, dapat disaring berdasarkan provinsi dan kota.",
      responses: {
        ...commonErrorResponses,
        200: jsonResponse("Daftar layanan rehabilitasi terpaginasi"),
      },
    }),
    async (c) => {
      const db = c.get("db");
      const page = pagination(c);
      const filters: SQL[] = [
        eq(helpContacts.isVerified, true),
        eq(helpContacts.category, "rehabilitasi"),
      ];

      const province = c.req.query("province");
      if (province) filters.push(eq(helpContacts.province, province));

      const city = c.req.query("city");
      if (city) filters.push(eq(helpContacts.city, city));

      const q = c.req.query("q")?.trim();
      if (q) {
        const pattern = `%${q}%`;
        const search = or(ilike(helpContacts.name, pattern), ilike(helpContacts.address, pattern));
        if (search) filters.push(search);
      }

      const where = and(...filters);

      const [rows, count] = await Promise.all([
        db
          .select()
          .from(helpContacts)
          .where(where)
          .orderBy(asc(helpContacts.province), asc(helpContacts.name))
          .limit(page.perPage)
          .offset(page.offset),
        db.select({ total: sql<number>`count(*)::int` }).from(helpContacts).where(where),
      ]);

      return ok(c, paginated(page, count[0]?.total ?? 0, rows));
    },
  );

export default router;
