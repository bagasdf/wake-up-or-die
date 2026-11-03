import { Hono } from "hono";
import type { HonoOptions } from "hono/hono-base";

import type { AppEnv } from "@/env";

export type BackendEnv = AppEnv;

export function createHono(options?: HonoOptions<AppEnv>) {
  return new Hono<AppEnv>(options);
}
