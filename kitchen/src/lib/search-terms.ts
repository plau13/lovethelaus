/**
 * Pure helpers that normalize user input before it reaches Postgres full-text
 * search. The query itself is passed to `websearch_to_tsquery`, which already
 * tolerates bare words, quoted phrases, `or` and `-exclusions`, so the job here
 * is only to decide whether there is a query at all and to tidy whitespace.
 */

/** Longer than any real search; keeps a pathological query out of the planner. */
const MAX_QUERY_LENGTH = 200;

/** Collapsed search text, or "" when the input is only whitespace. */
export function searchTerms(raw: string | null | undefined): string {
  if (!raw) {
    return "";
  }
  return raw.trim().replace(/\s+/g, " ").slice(0, MAX_QUERY_LENGTH);
}

/** True when a query should trigger ranking instead of the default ordering. */
export function hasSearchTerms(raw: string | null | undefined): boolean {
  return searchTerms(raw).length > 0;
}

/** Tags are stored lowercased by `serializeTags`, so a filter has to match that. */
export function normalizeTag(raw: string | null | undefined): string {
  return (raw ?? "").trim().toLowerCase();
}
