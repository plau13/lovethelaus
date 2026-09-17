import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { cache } from "react";
import * as schema from "./schema";

function connectionString(): string {
  const url = process.env.DATABASE_URL?.trim();
  if (!url) {
    throw new Error("DATABASE_URL is not set.");
  }
  return url;
}

/**
 * Create a Drizzle client over Neon's HTTP driver. Stateless, so a client per request is fine.
 * neon-http has no interactive transactions: never call `db.transaction()`; order writes parent → child.
 */
export function createDb() {
  return drizzle({ client: neon(connectionString()), schema });
}

/** Per-request client (memoised by React `cache` inside a server render). */
export const getDb = cache(createDb);

export type Db = ReturnType<typeof createDb>;
export { schema };
