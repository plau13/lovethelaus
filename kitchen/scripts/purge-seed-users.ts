/**
 * Remove legacy seed accounts. Foreign keys cascade to sessions, accounts, recipes,
 * cookbooks, memberships, notes, and favorites.
 *   npm run db:purge-seed-users
 */
import { inArray } from "drizzle-orm";
import { createDb, schema } from "../src/db/client";

const LEGACY_SEED_EMAILS = ["mom@laus.family", "dad@laus.family", "alex@laus.family"];

async function main() {
  const db = createDb();
  const removed = await db
    .delete(schema.user)
    .where(inArray(schema.user.email, LEGACY_SEED_EMAILS))
    .returning({ email: schema.user.email });
  if (removed.length === 0) {
    console.log("No legacy seed users found.");
    return;
  }
  for (const row of removed) {
    console.log(`Removed ${row.email}`);
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
