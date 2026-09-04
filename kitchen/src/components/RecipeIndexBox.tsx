import type { ReactNode } from "react";

export function RecipeIndexBox({ children }: { children: ReactNode }) {
  return (
    <div className="relative rounded-2xl border border-line bg-paper p-4 pt-8 shadow-[inset_0_2px_8px_rgb(44_24_16/8%)]">
      <ul className="relative z-10 -mt-10 flex flex-wrap items-end gap-x-2 gap-y-1">{children}</ul>
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-10 rounded-t-2xl border-b border-line/60 bg-gradient-to-b from-[#ebe2d4] to-transparent"
      />
    </div>
  );
}
