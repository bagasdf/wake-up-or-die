import { Scalar } from "@scalar/hono-api-reference";
import { openAPIRouteHandler } from "hono-openapi";

import { createHono } from "@/router/app";
import { router } from "@/router/routes";

const api = createHono({ strict: false }).basePath("/api").route("/", router);

export const app = api
  .get("/", (c) =>
    c.json({
      success: true,
      message: "Welcome to Nusantara Hack Youth public API.",
      hint: "Go to /api/docs or /api/openapi.json for more info on available endpoints.",
    }),
  )

  .get("/openapi.json", (c, next) =>
    openAPIRouteHandler(router, {
      documentation: {
        info: {
          title: "Nusantara Hack Youth API",
          version: "1.0.0",
          description: "Public API for Nusantara Hack Youth services.",
        },
        servers: [{ url: c.env?.SERVER_API_URL ?? "/api" }],
      },
    })(c, next),
  )
  .get(
    "/docs",
    Scalar({
      pageTitle: "Nusantara Hack Youth API Reference",
      url: "/api/openapi.json",
    }),
  )
  .notFound((c) =>
    c.json(
      {
        success: false,
        message: "Route not found.",
        hint: "Go to /api/docs or /api/openapi.json for more info on available endpoints.",
      },
      404,
    ),
  )
  .onError((err, c) => {
    // TODO: Log error
    return c.json(
      {
        success: false,
        message: "Internal server error.",
      },
      500,
    );
  });

export type AppType = typeof app;
export type { RouterRoutes } from "./router/routes";

export { router };
export default app;
