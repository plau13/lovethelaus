/** Page arithmetic shared by the signed-in lists and the public explore pages. */

export type Pagination = {
  page: number;
  perPage: number;
  total: number;
  totalPages: number;
  offset: number;
};

/** Clamp a page number from a query string into a real page of `total` rows. */
export function paginate(
  pageRaw: string | number | undefined,
  perPage: number,
  total: number,
): Pagination {
  const parsed = typeof pageRaw === "number" ? pageRaw : Number.parseInt(String(pageRaw ?? "1"), 10);
  const totalPages = Math.max(1, Math.ceil(total / perPage));
  const page = Math.min(Math.max(Number.isFinite(parsed) ? parsed : 1, 1), totalPages);
  return { page, perPage, total, totalPages, offset: (page - 1) * perPage };
}

/** "Showing 11–20 of 57 recipes", or "No recipes yet" when there are none. */
export function pageSummary(pagination: Pagination, noun: string, pluralNoun?: string): string {
  const plural = pluralNoun ?? `${noun}s`;
  if (pagination.total === 0) {
    return `No ${plural} yet`;
  }
  const first = pagination.offset + 1;
  const last = Math.min(pagination.offset + pagination.perPage, pagination.total);
  const label = pagination.total === 1 ? noun : plural;
  if (first === last) {
    return `Showing ${first} of ${pagination.total} ${label}`;
  }
  return `Showing ${first}–${last} of ${pagination.total} ${label}`;
}
