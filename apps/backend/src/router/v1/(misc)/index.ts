// import * as z from "zod";
// import { zValidator } from "@hono/zod-validator";
import { createHono } from "@/router/app";

const router = createHono().get("/", (c) => {
  return c.json({ ok: true });
});

export default router;
