import { resolver } from "hono-openapi";
import { z } from "zod";

export const errorSchema = z.object({
  success: z.literal(false),
  message: z.string(),
});

export const okSchema = <T extends z.ZodType>(data: T) =>
  z.object({ success: z.literal(true), data });

export const jsonContent = (schema: z.ZodType) => ({
  "application/json": { schema: resolver(schema) },
});

export const jsonResponse = (description: string, schema?: z.ZodType) => ({
  description,
  ...(schema ? { content: jsonContent(schema) } : {}),
});

export const errorResponse = (description = "Request gagal") =>
  jsonResponse(description, errorSchema);

export const commonErrorResponses = {
  400: errorResponse("Input tidak valid"),
  401: errorResponse("Belum terautentikasi"),
  403: errorResponse("Tidak punya akses"),
  404: errorResponse("Data tidak ditemukan"),
  429: errorResponse("Terlalu banyak permintaan"),
} as const;

export const bearerSecurity = [{ bearerAuth: [] }, { cookieAuth: [] }];
