function SkeletonBlock({ className = "" }: { className?: string }) {
  return <div className={`animate-pulse rounded-xl bg-line/60 ${className}`} />;
}

export function ListCardSkeleton() {
  return (
    <li className="rounded-xl border border-line bg-white p-4 shadow-sm">
      <SkeletonBlock className="mb-2 h-7 w-2/3" />
      <SkeletonBlock className="h-4 w-1/2" />
    </li>
  );
}

export function ListPageSkeleton({ titleWidth = "w-32" }: { titleWidth?: string }) {
  return (
    <main className="grid gap-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <SkeletonBlock className={`h-10 ${titleWidth}`} />
        <SkeletonBlock className="h-12 w-28" />
      </div>
      <SkeletonBlock className="h-24 w-full" />
      <ul className="grid gap-3">
        {Array.from({ length: 5 }, (_, index) => (
          <ListCardSkeleton key={index} />
        ))}
      </ul>
    </main>
  );
}

export function RecipeDetailSkeleton() {
  return (
    <main className="grid gap-6">
      <div className="flex items-center justify-between gap-3">
        <SkeletonBlock className="h-10 w-48" />
        <div className="flex gap-1">
          {Array.from({ length: 4 }, (_, index) => (
            <SkeletonBlock key={index} className="size-12" />
          ))}
        </div>
      </div>
      <SkeletonBlock className="h-12 w-3/4" />
      <SkeletonBlock className="h-5 w-40" />
      <SkeletonBlock className="h-64 w-full" />
      <div className="flex gap-6">
        <SkeletonBlock className="h-20 w-36" />
        <SkeletonBlock className="h-20 w-28" />
      </div>
      <SkeletonBlock className="h-48 w-full" />
      <SkeletonBlock className="h-40 w-full" />
    </main>
  );
}
