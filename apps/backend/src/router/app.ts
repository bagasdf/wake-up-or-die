import { Hono } from "hono";
import type { HonoOptions } from "hono/hono-base";

export type BackendEnv = {
  Bindings: {
    SERVER_API_URL?: string;
  };
  //  Variables: AuthType & {
  //    account: typeof account.$inferSelect & {
  //      session: AuthType["session"];
  //    };
  //  };
};

export function createHono(
  options?: HonoOptions<BackendEnv>,
) {
  return new Hono<BackendEnv>(options)
}