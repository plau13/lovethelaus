import type { ReactNode } from "react";
import { AppHeader } from "@/components/AppHeader";
import { getCurrentUser } from "@/lib/auth";

export default async function AppLayout({ children }: { children: ReactNode }) {
  const user = await getCurrentUser();
  return (
    <>
      <AppHeader userName={user?.name ?? null} />
      <div className="mx-auto w-full max-w-3xl px-4 pb-16 pt-6">{children}</div>
    </>
  );
}
