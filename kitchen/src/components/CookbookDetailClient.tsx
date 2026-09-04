"use client";

import type { ReactNode } from "react";
import { CookbookDetailToolbar } from "@/components/CookbookDetailToolbar";

type Member = {
  id: string;
  userId: string;
  role: string;
  user: { name: string; email: string };
};

export function CookbookDetailClient({
  cookbookId,
  favorited,
  canExport,
  canManage,
  isOwner,
  members,
  publicShareUrl,
  exportHref,
  children,
}: {
  cookbookId: string;
  favorited: boolean;
  canExport: boolean;
  canManage: boolean;
  isOwner: boolean;
  members: Member[];
  publicShareUrl: string | null;
  exportHref: string;
  children: ReactNode;
}) {
  return (
    <div className="grid gap-6">
      <CookbookDetailToolbar
        cookbookId={cookbookId}
        favorited={favorited}
        canExport={canExport}
        canManage={canManage}
        isOwner={isOwner}
        members={members}
        publicShareUrl={publicShareUrl}
        exportHref={exportHref}
      />
      {children}
    </div>
  );
}
