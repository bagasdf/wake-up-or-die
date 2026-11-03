import { createHono } from "@/router/app";
import miscRouter from "./(misc)";

export const router = createHono().route("/misc", miscRouter);
export type RouterRoutes = typeof router;
