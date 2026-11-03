import { createHono } from "@/router/app";
import { router as v1Router } from "@/router/v1/routes";
import type { Hono } from "hono";

export const router = createHono().route("/v1", v1Router);

export type RouterRoutes = typeof router;
