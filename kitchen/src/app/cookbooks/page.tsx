import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { listCookbooksForUser } from "@/lib/cookbooks";
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

function CookbookCards({
  cookbooks,
}: {
  cookbooks: Awaited<ReturnType<typeof listCookbooksForUser>>["own"];
}) {
  if (cookbooks.length === 0) {
    return null;
  }
  return (
    <ul className="grid gap-3">
      {cookbooks.map((cookbook) => (
        <li key={cookbook.id} className="rounded-2xl border border-line bg-white p-4">
          <Link href={`/cookbooks/${cookbook.id}`} className="font-serif text-2xl text-ink no-underline">
            {cookbook.title}
          </Link>
          <p className="text-muted">
            {cookbook.visibility} · {cookbook._count.recipes} recipes
            {cookbook.members[0]?.role ? ` · ${cookbook.members[0].role}` : ""}
          </p>
        </li>
      ))}
    </ul>
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
          className="inline-flex min-h-12 items-center rounded-xl bg-clay px-4 py-2 text-white no-underline hover:bg-clay-dark"
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
        <section className="grid gap-3">
          <h2 className="text-xl font-semibold">Your cookbooks ({grouped.own.length})</h2>
          <CookbookCards cookbooks={grouped.own} />
        </section>
      ) : null}

      {grouped.shared.length > 0 ? (
        <section className="grid gap-3">
          <h2 className="text-xl font-semibold">Shared with you ({grouped.shared.length})</h2>
          <CookbookCards cookbooks={grouped.shared} />
        </section>
      ) : null}

      {grouped.public.length > 0 ? (
        <section className="grid gap-3">
          <h2 className="text-xl font-semibold">Public cookbooks ({grouped.public.length})</h2>
          <CookbookCards cookbooks={grouped.public} />
        </section>
      ) : null}

      {grouped.own.length + grouped.shared.length + grouped.public.length === 0 ? (
        <p className="text-muted">No cookbooks match. Create one or try another search.</p>
      ) : null}
    </main>
  );
}
