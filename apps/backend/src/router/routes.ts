import { createHono } from "@/router/app";
import { router as v1Router } from "@/router/v1/routes";
import { withDb, withSession } from "@/lib/guards";

export const router = createHono()
  .use("/v1/*", withDb)
  .use("/v1/*", withSession)
  .route("/v1", v1Router);

export type RouterRoutes = typeof router;
