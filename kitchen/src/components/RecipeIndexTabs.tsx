import type { ReactNode } from "react";

export function RecipeBox({ children }: { children: ReactNode }) {
  return (
    <div className="rounded-2xl rounded-tl-none border border-line bg-paper p-5 shadow-[inset_0_1px_0_rgb(255_255_255/60%)]">
      {children}
    </div>
  );
}
