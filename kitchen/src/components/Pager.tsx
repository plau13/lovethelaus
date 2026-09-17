import Link from "next/link";
import { pageSummary, type Pagination } from "@/lib/pagination";

/**
 * Previous/next pager with a plain-language count. Rendered as links rather
 * than buttons so a page is shareable and the back button behaves.
 */
export function Pager({
  pagination,
  noun,
  pluralNoun,
  hrefForPage,
  label = "Pagination",
}: {
  pagination: Pagination;
  noun: string;
  pluralNoun?: string;
  hrefForPage: (page: number) => string;
  label?: string;
}) {
  const summary = pageSummary(pagination, noun, pluralNoun);
  if (pagination.totalPages <= 1) {
    return <p className="text-sm text-muted">{summary}</p>;
  }

  const hasPrevious = pagination.page > 1;
  const hasNext = pagination.page < pagination.totalPages;

  return (
    <nav className="no-print flex flex-wrap items-center justify-between gap-3" aria-label={label}>
      <p className="text-sm text-muted">{summary}</p>
      <div className="flex items-center gap-2">
        {hasPrevious ? (
          <Link
            href={hrefForPage(pagination.page - 1)}
            rel="prev"
            className="btn rounded-xl border border-line bg-white px-4 py-2 no-underline"
          >
            Previous
          </Link>
        ) : null}
        <span className="text-sm text-muted">
          Page {pagination.page} of {pagination.totalPages}
        </span>
        {hasNext ? (
          <Link
            href={hrefForPage(pagination.page + 1)}
            rel="next"
            className="btn rounded-xl border border-line bg-white px-4 py-2 no-underline"
          >
            Next
          </Link>
        ) : null}
      </div>
    </nav>
  );
}
