import { and, desc, eq } from "drizzle-orm";
import { describeRoute } from "hono-openapi";

import { certificates } from "@/db/schema";
import { DEFAULT_APP_NAME } from "@/env";
import { renderCertificateSvg } from "@/lib/certificate";
import { currentUser, requireUser } from "@/lib/guards";
import { fail, ok } from "@/lib/http";
import { commonErrorResponses, errorResponse, jsonResponse } from "@/lib/openapi";
import { createHono } from "@/router/app";

const router = createHono()
  .get(
    "/",
    describeRoute({
      tags: ["Gamification"],
      summary: "Sertifikat milik pengguna yang login",
      responses: {
        ...commonErrorResponses,
        200: jsonResponse("Daftar sertifikat"),
      },
    }),
    requireUser,
    async (c) => {
      const db = c.get("db");
      const user = currentUser(c);

      const rows = await db
        .select()
        .from(certificates)
        .where(eq(certificates.userId, user.id))
        .orderBy(desc(certificates.issuedAt));

      return ok(c, rows);
    },
  )

  .get(
    "/:code",
    describeRoute({
      tags: ["Gamification"],
      summary: "Verifikasi keaslian sertifikat",
      description: "Endpoint publik untuk memeriksa kode sertifikat tanpa perlu login.",
      responses: {
        ...commonErrorResponses,
        200: jsonResponse("Sertifikat valid"),
        404: errorResponse("Kode sertifikat tidak ditemukan"),
      },
    }),
    async (c) => {
      const db = c.get("db");
      const code = c.req.param("code").toUpperCase();

      const [certificate] = await db
        .select()
        .from(certificates)
        .where(eq(certificates.code, code))
        .limit(1);

      if (!certificate) {
        return fail(c, 404, "Sertifikat tidak ditemukan atau kode tidak valid.");
      }

      return ok(c, {
        valid: true,
        code: certificate.code,
        title: certificate.title,
        recipientName: certificate.recipientName,
        type: certificate.type,
        issuedAt: certificate.issuedAt,
        metadata: certificate.metadata,
      });
    },
  )

  .get(
    "/:code/download",
    describeRoute({
      tags: ["Gamification"],
      summary: "Unduh sertifikat sebagai SVG",
      responses: {
        ...commonErrorResponses,
        200: jsonResponse("Berkas SVG sertifikat"),
        404: errorResponse("Kode sertifikat tidak ditemukan"),
      },
    }),
    async (c) => {
      const db = c.get("db");
      const code = c.req.param("code").toUpperCase();

      const [certificate] = await db
        .select()
        .from(certificates)
        .where(eq(certificates.code, code))
        .limit(1);

      if (!certificate) {
        return fail(c, 404, "Sertifikat tidak ditemukan atau kode tidak valid.");
      }

      const svg = renderCertificateSvg({
        title: certificate.title,
        recipientName: certificate.recipientName,
        code: certificate.code,
        issuedAt: certificate.issuedAt,
        appName: c.env.APP_NAME ?? DEFAULT_APP_NAME,
      });

      c.header("Content-Type", "image/svg+xml; charset=utf-8");
      c.header("Content-Disposition", `attachment; filename="${certificate.code}.svg"`);
      c.header("Cache-Control", "public, max-age=86400");
      return c.body(svg);
    },
  );

export default router;
