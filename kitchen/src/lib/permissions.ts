import type { CookbookRole, Visibility } from "@/lib/types";

function isRole(value: string): value is CookbookRole {
  return value === "owner" || value === "editor" || value === "viewer";
}

function isVisibility(value: string): value is Visibility {
  return value === "private" || value === "unlisted" || value === "public";
}

function isCollabRole(value: string): value is "view" | "comment" | "edit" | "co-author" {
  return value === "view" || value === "comment" || value === "edit" || value === "co-author";
}

function collabRank(role: string): number {
  if (role === "co-author") return 4;
  if (role === "edit") return 3;
  if (role === "comment") return 2;
  if (role === "view") return 1;
  return 0;
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
      const _exhaustive: never = args.visibility as never;
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
  collaboratorRole?: string | null;
  containingCookbooks: Array<{ visibility: string; ownerId: string; memberUserIds: string[] }>;
}): boolean {
  if (args.userId && args.userId === args.recipeOwnerId) {
    return true;
  }
  if (args.collaboratorRole && isCollabRole(args.collaboratorRole)) {
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

export function canEditRecipe(args: {
  userId: string | null;
  recipeOwnerId: string;
  collaboratorRole?: string | null;
}): boolean {
  if (args.userId && args.userId === args.recipeOwnerId) {
    return true;
  }
  return args.collaboratorRole === "edit" || args.collaboratorRole === "co-author";
}

export function canInviteOnRecipe(args: {
  userId: string | null;
  recipeOwnerId: string;
  collaboratorRole?: string | null;
}): boolean {
  return canEditRecipe(args);
}

export function canCommentOnRecipe(args: {
  userId: string | null;
  recipeOwnerId: string;
  collaboratorRole?: string | null;
  canView: boolean;
}): boolean {
  if (!args.userId || !args.canView) {
    return false;
  }
  if (args.userId === args.recipeOwnerId) {
    return true;
  }
  if (
    args.collaboratorRole === "edit" ||
    args.collaboratorRole === "co-author" ||
    args.collaboratorRole === "comment"
  ) {
    return true;
  }
  return args.canView;
}

export function canAddNote(args: { userId: string | null; canComment: boolean }): boolean {
  return Boolean(args.userId && args.canComment);
}

export function roleAtLeast(role: string | null, needed: CookbookRole): boolean {
  if (!role || !isRole(role)) {
    return false;
  }
  const rank: Record<CookbookRole, number> = { viewer: 1, editor: 2, owner: 3 };
  return rank[role] >= rank[needed];
}

export function collabRoleAtLeast(
  role: string | null,
  needed: "view" | "comment" | "edit" | "co-author",
): boolean {
  if (!role || !isCollabRole(role)) {
    return false;
  }
  const neededRank = collabRank(needed);
  return collabRank(role) >= neededRank;
}
