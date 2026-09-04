"use client";

import { useRouter } from "next/navigation";
import { type FormEvent, useState } from "react";

export function HomeRecipeSearch() {
  const router = useRouter();
  const [query, setQuery] = useState("");

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    const trimmed = query.trim();
    if (!trimmed) {
      router.push("/recipes");
      return;
    }
    router.push(`/recipes?q=${encodeURIComponent(trimmed)}`);
  }

  return (
    <form onSubmit={handleSubmit} className="grid gap-1">
      <label className="grid gap-1">
        <span className="text-muted">Search recipes</span>
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          className="rounded-xl border border-line bg-white px-3 py-3"
          placeholder="chicken mushrooms"
        />
      </label>
    </form>
  );
}
