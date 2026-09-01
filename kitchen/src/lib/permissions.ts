import type { CookbookRole, Visibility } from "@/lib/types";

function isRole(value: string): value is CookbookRole {
  return value === "owner" || value === "editor" || value === "viewer";
}

function isVisibility(value: string): value is Visibility {
  return value === "private" || value === "unlisted" || value === "public";
}

export function canViewCookbook(args: {
  userId: string | null;
  ownerId: string;
  visibility: string;
  memberUserIds: string[];
}): boolean {
  if (!isVisibility(args.visibility)) {
    return false;
  }
  switch (args.visibility) {
    case "public":
      return true;
    case "unlisted":
    case "private":
      if (!args.userId) {
        return false;
      }
      return args.ownerId === args.userId || args.memberUserIds.includes(args.userId);
    default: {
      const _exhaustive: never = args.visibility;
      return _exhaustive;
    }
  }
}

export function canManageCookbook(role: string | null): boolean {
  return role === "owner";
}

export function canEditCookbookContents(role: string | null): boolean {
  return role === "owner" || role === "editor";
}

export function canViewRecipe(args: {
  userId: string | null;
  recipeOwnerId: string;
  containingCookbooks: Array<{ visibility: string; ownerId: string; memberUserIds: string[] }>;
}): boolean {
  if (args.userId && args.userId === args.recipeOwnerId) {
    return true;
  }
  return args.containingCookbooks.some((cookbook) =>
    canViewCookbook({
      userId: args.userId,
      ownerId: cookbook.ownerId,
      visibility: cookbook.visibility,
      memberUserIds: cookbook.memberUserIds,
    }),
  );
}

export function canEditRecipe(args: { userId: string | null; recipeOwnerId: string }): boolean {
  return Boolean(args.userId && args.userId === args.recipeOwnerId);
}

export function canAddNote(args: { userId: string | null; canView: boolean }): boolean {
  return Boolean(args.userId && args.canView);
}

export function roleAtLeast(role: string | null, needed: CookbookRole): boolean {
  if (!role || !isRole(role)) {
    return false;
  }
  const rank: Record<CookbookRole, number> = { viewer: 1, editor: 2, owner: 3 };
  return rank[role] >= rank[needed];
}
