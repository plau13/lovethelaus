import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { listCookbooksForUser } from "@/lib/cookbooks";
import { CookbookSpineShelf } from "@/components/CookbookSpineShelf";
import { COOKBOOK_LIST_FILTERS, type CookbookListFilter } from "@/lib/types";

function filterLabel(filter: CookbookListFilter): string {
  switch (filter) {
    case "all":
      return "All";
    case "private":
      return "Private";
    case "shared":
      return "Shared";
    case "public":
      return "Public";
    default: {
      const _exhaustive: never = filter;
      return _exhaustive;
    }
  }
}

function CookbookSection({
  title,
  cookbooks,
}: {
  title: string;
  cookbooks: Awaited<ReturnType<typeof listCookbooksForUser>>["own"];
}) {
  if (cookbooks.length === 0) {
    return null;
  }
  return (
    <section className="grid gap-3">
      <h2 className="text-xl font-semibold">{title}</h2>
      <CookbookSpineShelf
        cookbooks={cookbooks.map((cookbook) => ({
          id: cookbook.id,
          title: cookbook.title,
          recipeCount: cookbook._count.recipes,
          visibility: cookbook.visibility,
        }))}
      />
    </section>
  );
}

export default async function CookbooksPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; filter?: string }>;
}) {
  const user = await requireUser();
  const { q = "", filter: filterRaw = "all" } = await searchParams;
  const filter = COOKBOOK_LIST_FILTERS.includes(filterRaw as CookbookListFilter)
    ? (filterRaw as CookbookListFilter)
    : "all";
  const grouped = await listCookbooksForUser(user.id, { q, filter });

  return (
    <main className="grid gap-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <h1 className="font-serif text-4xl">Cookbooks</h1>
        <Link
          href="/cookbooks/new"
          className="btn-clay btn-clay-hover inline-flex min-h-12 items-center rounded-xl px-4 py-2 no-underline"
        >
          New cookbook
        </Link>
      </div>

      <form className="no-print grid gap-3">
        <label className="grid gap-1">
          <span className="text-muted">Search cookbooks</span>
          <input
            name="q"
            defaultValue={q}
            className="rounded-xl border border-line bg-white px-3 py-3"
            placeholder="Family dinners"
          />
        </label>
        <input type="hidden" name="filter" value={filter} />
        <button type="submit" className="btn w-fit rounded-xl border border-line px-4 py-2">
          Search
        </button>
      </form>

      <div className="flex flex-wrap gap-2">
        {COOKBOOK_LIST_FILTERS.map((item) => {
          const params = new URLSearchParams();
          if (q) {
            params.set("q", q);
          }
          if (item !== "all") {
            params.set("filter", item);
          }
          const href = params.size ? `/cookbooks?${params}` : "/cookbooks";
          return (
            <Link
              key={item}
              href={href}
              className={`rounded-full px-4 py-2 no-underline ${filter === item ? "bg-clay text-white" : "border border-line bg-white text-ink"}`}
            >
              {filterLabel(item)}
            </Link>
          );
        })}
      </div>

      {grouped.own.length > 0 ? (
        <CookbookSection title={`Your cookbooks (${grouped.own.length})`} cookbooks={grouped.own} />
      ) : null}

      {grouped.shared.length > 0 ? (
        <CookbookSection title={`Shared with you (${grouped.shared.length})`} cookbooks={grouped.shared} />
      ) : null}

      {grouped.public.length > 0 ? (
        <CookbookSection title={`Public cookbooks (${grouped.public.length})`} cookbooks={grouped.public} />
      ) : null}

      {grouped.own.length + grouped.shared.length + grouped.public.length === 0 ? (
        <p className="text-muted">No cookbooks match. Create one or try another search.</p>
      ) : null}
    </main>
  );
}
