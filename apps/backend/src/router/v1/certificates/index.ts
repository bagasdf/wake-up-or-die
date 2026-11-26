import { and, desc, eq } from "drizzle-orm";
import { describeRoute } from "hono-openapi";

import { certificates } from "@/db/schema";
import { DEFAULT_APP_NAME } from "@/env";
import { renderCertificatePdf } from "@/lib/certificate";
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

  .post(
    "/:code/refresh",
    describeRoute({
      tags: ["Certificates"],
      summary: "Refresh certificate recipient name",
      description:
        "Updates the certificate name to the authenticated user's saved profile name.",
      responses: {
        ...commonErrorResponses,
        200: jsonResponse("Certificate name refreshed"),
        400: errorResponse("A full name is required"),
        404: errorResponse("Certificate not found"),
      },
    }),
    requireUser,
    async (c) => {
      const me = currentUser(c);
      const recipientName = me.name?.trim();
      if (!recipientName) return fail(c, 400, "Isi nama lengkap di profil terlebih dahulu.");

      const [certificate] = await c
        .get("db")
        .update(certificates)
        .set({ recipientName })
        .where(
          and(
            eq(certificates.code, c.req.param("code")),
            eq(certificates.userId, me.id),
          ),
        )
        .returning({ code: certificates.code, recipientName: certificates.recipientName });

      if (!certificate) return fail(c, 404, "Sertifikat tidak ditemukan.");
      return ok(c, certificate);
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
      summary: "Unduh sertifikat sebagai PDF",
      responses: {
        ...commonErrorResponses,
        200: {
          description: "Berkas PDF sertifikat",
          content: {
            "application/pdf": {
              schema: { type: "string", format: "binary" },
            },
          },
        },
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

      const pdf = await renderCertificatePdf({
        title: certificate.title,
        recipientName: certificate.recipientName,
        code: certificate.code,
        issuedAt: certificate.issuedAt,
        appName: c.env.APP_NAME ?? DEFAULT_APP_NAME,
      });

      c.header("Content-Type", "application/pdf");
      c.header("Content-Disposition", `attachment; filename="${certificate.code}.pdf"`);
      c.header("Cache-Control", "no-store");
      return c.body(new Uint8Array(pdf));
    },
  );

export default router;
