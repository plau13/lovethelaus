import type { Metadata } from "next";
import { ExploreView, exploreMetadata } from "./ExploreView";

// Uses searchParams (?page=), so it renders on demand; recipe and cookbook pages are the ISR-cached ones.

type Props = { searchParams: Promise<{ page?: string }> };

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const { page } = await searchParams;
  return exploreMetadata(undefined, Number.parseInt(page ?? "1", 10) || 1);
}

export default async function ExplorePage({ searchParams }: Props) {
  const { page } = await searchParams;
  return <ExploreView pageParam={page} />;
}
