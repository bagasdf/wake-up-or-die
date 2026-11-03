import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "./schema";

const makeDb = (connectionString: string) => drizzle(neon(connectionString), { schema });

export type Database = ReturnType<typeof makeDb>;

let cached: { url: string; db: Database } | undefined;

/**
 * Neon's HTTP driver is stateless, so creating a client per isolate is cheap.
 * The instance is cached to keep a single connection pool per Worker isolate.
 */
export function createDb(connectionString: string): Database {
  if (!connectionString) {
    throw new Error("DATABASE_URL is not configured.");
  }
  if (cached?.url === connectionString) {
    return cached.db;
  }
  const db = makeDb(connectionString);
  cached = { url: connectionString, db };
  return db;
}
