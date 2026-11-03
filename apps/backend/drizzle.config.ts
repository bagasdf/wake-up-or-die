import { defineConfig } from "drizzle-kit";

const env = (
  globalThis as unknown as { process?: { env?: Record<string, string | undefined> } }
).process?.env;

export default defineConfig({
  dialect: "postgresql",
  schema: "./src/db/schema.ts",
  out: "./drizzle",
  dbCredentials: {
    url: env?.DATABASE_URL ?? "",
  },
  verbose: true,
  strict: true,
});
