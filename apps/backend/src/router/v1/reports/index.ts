import { eq } from "drizzle-orm";
import { describeRoute } from "hono-openapi";
import { z } from "zod";

import { reports } from "@/db/schema";
import { created, fail, ipFingerprint, ok, ticketCode } from "@/lib/http";
import { commonErrorResponses, errorResponse, jsonResponse } from "@/lib/openapi";
import { rateLimit } from "@/lib/rate-limit";
import { jsonBody } from "@/lib/validate";
import { createHono } from "@/router/app";

const reportSchema = z.object({
  category: z.enum(["konsultasi", "pengaduan"]).default("konsultasi"),
  subject: z.string().trim().min(5).max(150),
  message: z.string().trim().min(10).max(5_000),
  contactMethod: z.enum(["whatsapp", "email", "telepon", "tidak_ada"]).optional(),
  contactValue: z.string().trim().min(3).max(120).optional(),
});

const router = createHono()
  .post(
    "/",
    describeRoute({
      tags: ["Reports"],
      summary: "Kirim konsultasi atau pengaduan anonim",
      description:
        "Tidak memerlukan akun. IP disimpan sebagai hash ber-salt, bukan alamat mentah. Balasan berisi kode tiket untuk memantau status.",
      responses: {
        ...commonErrorResponses,
        201: jsonResponse("Tiket berhasil dibuat"),
        429: errorResponse("Terlalu banyak pengiriman"),
      },
    }),
    jsonBody(reportSchema),
    async (c) => {
      const db = c.get("db");
      const body = c.req.valid("json");

      const fingerprint = await ipFingerprint(c);
      const limit = rateLimit(`report:${fingerprint}`, 3, 60 * 60 * 1_000);
      if (!limit.ok) {
        c.header("Retry-After", String(limit.retryAfterSeconds));
        return fail(c, 429, "Terlalu banyak pengiriman. Coba lagi dalam satu jam.");
      }

      const [report] = await db
        .insert(reports)
        .values({
          ticketCode: ticketCode(),
          category: body.category,
          subject: body.subject,
          message: body.message,
          contactMethod: body.contactMethod ?? "tidak_ada",
          contactValue: body.contactValue ?? null,
          ipHash: fingerprint,
        })
        .returning({
          ticketCode: reports.ticketCode,
          category: reports.category,
          status: reports.status,
          createdAt: reports.createdAt,
        });

      return created(c, {
        ...report,
        message:
          "Laporan diterima. Simpan kode tiket ini untuk memantau status. Tim akan menindaklanjuti melalui kontak yang Anda berikan (jika ada).",
        followUpHint:
          "Untuk keadaan darurat, segera hubungi 119 atau layanan informasi BNN di 184. Jangan menunggu balasan tiket.",
      });
    },
  )

  .get(
    "/:ticketCode",
    describeRoute({
      tags: ["Reports"],
      summary: "Pantau status tiket",
      description:
        "Menampilkan status tiket tanpa data sensitif seperti catatan admin atau hash IP.",
      responses: {
        ...commonErrorResponses,
        200: jsonResponse("Status tiket"),
        404: errorResponse("Tiket tidak ditemukan"),
      },
    }),
    async (c) => {
      const db = c.get("db");
      const code = c.req.param("ticketCode").toUpperCase();

      const [report] = await db
        .select({
          ticketCode: reports.ticketCode,
          category: reports.category,
          subject: reports.subject,
          status: reports.status,
          priority: reports.priority,
          createdAt: reports.createdAt,
          updatedAt: reports.updatedAt,
        })
        .from(reports)
        .where(eq(reports.ticketCode, code))
        .limit(1);

      if (!report) return fail(c, 404, "Tiket tidak ditemukan. Periksa kembali kode Anda.");

      return ok(c, report);
    },
  );

export default router;
