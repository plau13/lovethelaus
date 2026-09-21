import Link from "next/link";
import { QueryFlash } from "@/components/QueryFlash";
import { requireOnboardedUser } from "@/lib/auth";
import { listFavoriteCookbookIds } from "@/lib/cookbook-favorites";
import { PUBLIC_COOKBOOKS_PER_PAGE, countPublicCookbooks, listCookbooksForUser } from "@/lib/cookbooks";
import { Pager } from "@/components/Pager";
import { paginate } from "@/lib/pagination";
import { CookbookListItem } from "@/components/CookbookListItem";
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
      <ul className="grid gap-3">
        {cookbooks.map((cookbook) => (
          <CookbookListItem
            key={cookbook.id}
            id={cookbook.id}
            title={cookbook.title}
            recipeCount={cookbook._count.recipes}
            visibility={cookbook.visibility}
            role={cookbook.members[0]?.role ?? null}
          />
        ))}
      </ul>
    </section>
  );
}

function cookbooksUrl(q: string, filter: CookbookListFilter, page: number): string {
  const params = new URLSearchParams();
  if (q) {
    params.set("q", q);
  }
  if (filter !== "all") {
    params.set("filter", filter);
  }
  if (page > 1) {
    params.set("page", String(page));
  }
  return params.size ? `/cookbooks?${params}` : "/cookbooks";
}

export default async function CookbooksPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; filter?: string; page?: string; error?: string }>;
}) {
  const user = await requireOnboardedUser();
  const { q = "", filter: filterRaw = "all", page: pageRaw, error } = await searchParams;
  const filter = COOKBOOK_LIST_FILTERS.includes(filterRaw as CookbookListFilter)
    ? (filterRaw as CookbookListFilter)
    : "all";
  // Public cookbooks are unbounded, so that section pages; the user's own and
  // shared books are bounded by their memberships and come back whole.
  const showsPublic = filter === "all" || filter === "public";
  const publicTotal = showsPublic ? await countPublicCookbooks(user.id, q) : 0;
  const pagination = paginate(pageRaw, PUBLIC_COOKBOOKS_PER_PAGE, publicTotal);
  const [grouped, favoriteIds] = await Promise.all([
    listCookbooksForUser(user.id, {
      q,
      filter,
      limit: pagination.perPage,
      offset: pagination.offset,
    }),
    listFavoriteCookbookIds(user.id),
  ]);

  const allCookbooks = [...grouped.own, ...grouped.shared, ...grouped.public];
  const favoriteCookbooks = allCookbooks.filter((cookbook) => favoriteIds.has(cookbook.id));

  return (
    <main className="grid gap-6">
      <QueryFlash error={error} />
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
          // Changing the filter starts over at page one.
          return (
            <Link
              key={item}
              href={cookbooksUrl(q, item, 1)}
              className={`rounded-full px-4 py-2 no-underline ${filter === item ? "bg-clay text-white" : "border border-line bg-white text-ink"}`}
            >
              {filterLabel(item)}
            </Link>
          );
        })}
      </div>

      {favoriteCookbooks.length > 0 ? (
        <CookbookSection title={`Favorites (${favoriteCookbooks.length})`} cookbooks={favoriteCookbooks} />
      ) : null}

      {grouped.own.length > 0 ? (
        <CookbookSection title={`Your cookbooks (${grouped.own.length})`} cookbooks={grouped.own} />
      ) : null}

      {grouped.shared.length > 0 ? (
        <CookbookSection title={`Shared with you (${grouped.shared.length})`} cookbooks={grouped.shared} />
      ) : null}

      {grouped.public.length > 0 ? (
        <>
          <CookbookSection title={`Public cookbooks (${publicTotal})`} cookbooks={grouped.public} />
          <Pager
            pagination={pagination}
            noun="public cookbook"
            hrefForPage={(page) => cookbooksUrl(q, filter, page)}
            label="Public cookbook pages"
          />
        </>
      ) : null}

      {grouped.own.length + grouped.shared.length + grouped.public.length === 0 ? (
        <p className="text-muted">No cookbooks match. Create one or try another search.</p>
      ) : null}
    </main>
  );
}
