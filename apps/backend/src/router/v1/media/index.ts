import { describeRoute } from "hono-openapi";

import { fail } from "@/lib/http";
import { commonErrorResponses, errorResponse, jsonResponse } from "@/lib/openapi";
import { createHono } from "@/router/app";

const router = createHono().get(
  "/:key{.+}",
  describeRoute({
    tags: ["Media"],
    summary: "Sajikan berkas media dari R2",
    responses: {
      ...commonErrorResponses,
      200: jsonResponse("Berkas media"),
      404: errorResponse("Berkas tidak ditemukan"),
    },
  }),
  async (c) => {
    const key = c.req.param("key");

    if (!c.env.MEDIA_BUCKET) {
      return fail(c, 503, "Penyimpanan media belum dikonfigurasi.");
    }

    const object = await c.env.MEDIA_BUCKET.get(key);
    if (!object) return fail(c, 404, "Berkas tidak ditemukan.");

    return c.body(object.body, 200, {
      "Content-Type": object.httpMetadata?.contentType ?? "application/octet-stream",
      "Content-Length": String(object.size),
      "Cache-Control": "public, max-age=31536000, immutable",
    });
  },
);

export default router;
