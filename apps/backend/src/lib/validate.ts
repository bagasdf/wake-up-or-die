import type { Context } from "hono";
import { validator } from "hono-openapi";
import type { z } from "zod";

import type { AppEnv } from "@/env";
import { fail } from "@/lib/http";

/**
 * Body validator that keeps the API envelope consistent when validation fails.
 */
export function jsonBody<T extends z.ZodType>(schema: T) {
  return validator("json", schema, (result, c) => {
    if (result.success) return;
    return fail(c as Context<AppEnv>, 400, "Input tidak valid.", {
      errors: result.error.map((issue) => ({
        path: (issue.path ?? [])
          .map((segment) =>
            typeof segment === "object" && segment !== null && "key" in segment
              ? String(segment.key)
              : String(segment),
          )
          .join("."),
        message: issue.message,
      })),
    });
  });
}
