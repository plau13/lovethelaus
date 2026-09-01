import { randomBytes } from "crypto";
import { prisma } from "@/lib/prisma";
import { slugify } from "@/lib/slug";
import type { CookbookListFilter } from "@/lib/types";
import {
  canEditCookbookContents,
  canManageCookbook,
  canViewCookbook,
} from "@/lib/permissions";
import type { CookbookRole, Visibility } from "@/lib/types";
import { VISIBILITIES, COOKBOOK_ROLES } from "@/lib/types";

function parseRole(value: string): CookbookRole {
  const match = COOKBOOK_ROLES.find((role) => role === value);
  if (!match) {
    throw new Error("Pick a role: viewer, editor, or owner.");
  }
  return match;
}

function parseVisibility(value: string): Visibility {
  const match = VISIBILITIES.find((item) => item === value);
  if (!match) {
    throw new Error("Visibility must be private, unlisted, or public.");
  }
  return match;
}

export async function memberRole(cookbookId: string, userId: string | null) {
  if (!userId) {
    return null;
  }
  const member = await prisma.cookbookMember.findUnique({
    where: { cookbookId_userId: { cookbookId, userId } },
  });
  return member?.role ?? null;
}

export async function listMyCookbooks(userId: string) {
  return prisma.cookbook.findMany({
    where: { members: { some: { userId } } },
    include: {
      _count: { select: { recipes: true, members: true } },
      members: { where: { userId } },
    },
    orderBy: [{ isDefault: "desc" }, { updatedAt: "desc" }],
  });
}

function matchesCookbookQuery(
  cookbook: { title: string; description: string },
  query: string
): boolean {
  const needle = query.trim().toLowerCase();
  if (!needle) {
    return true;
  }
  const haystack = `${cookbook.title} ${cookbook.description}`.toLowerCase();
  return haystack.includes(needle);
}

export async function listCookbooksForUser(
  userId: string,
  options: { q?: string; filter?: CookbookListFilter } = {}
) {
  const { q = "", filter = "all" } = options;

  const memberCookbooks = await prisma.cookbook.findMany({
    where: { members: { some: { userId } } },
    include: {
      _count: { select: { recipes: true, members: true } },
      members: { where: { userId } },
    },
    orderBy: [{ isDefault: "desc" }, { updatedAt: "desc" }],
  });

  const memberIds = new Set(memberCookbooks.map((cookbook) => cookbook.id));

  const publicCookbooks = await prisma.cookbook.findMany({
    where: {
      visibility: "public",
      id: { notIn: [...memberIds] },
    },
    include: {
      _count: { select: { recipes: true, members: true } },
      members: { where: { userId } },
    },
    orderBy: { updatedAt: "desc" },
  });

  const own = memberCookbooks.filter(
    (cookbook) => cookbook.ownerId === userId && matchesCookbookQuery(cookbook, q)
  );
  const shared = memberCookbooks.filter(
    (cookbook) => cookbook.ownerId !== userId && matchesCookbookQuery(cookbook, q)
  );
  const pub = publicCookbooks.filter((cookbook) => matchesCookbookQuery(cookbook, q));

  switch (filter) {
    case "private":
      return { own: own.filter((c) => c.visibility === "private"), shared: [], public: [] };
    case "shared":
      return { own: [], shared, public: [] };
    case "public":
      return { own: [], shared: [], public: pub };
    case "all":
      return { own, shared, public: pub };
    default: {
      const _exhaustive: never = filter;
      return _exhaustive;
    }
  }
}

export async function getCookbookForUser(cookbookId: string, userId: string | null) {
  const cookbook = await prisma.cookbook.findUnique({
    where: { id: cookbookId },
    include: {
      members: { include: { user: true } },
      recipes: {
        include: { recipe: { include: { photos: true } } },
        orderBy: { position: "asc" },
      },
      invites: true,
      owner: true,
    },
  });
  if (!cookbook) {
    return null;
  }
  const allowed = canViewCookbook({
    userId,
    ownerId: cookbook.ownerId,
    visibility: cookbook.visibility,
    memberUserIds: cookbook.members.map((member) => member.userId),
  });
  if (!allowed) {
    return null;
  }
  return cookbook;
}

export async function getPublicCookbook(slug: string) {
  const cookbook = await prisma.cookbook.findUnique({
    where: { slug },
    include: {
      members: true,
      recipes: {
        include: { recipe: { include: { photos: true } } },
        orderBy: { position: "asc" },
      },
      owner: true,
    },
  });
  if (!cookbook || (cookbook.visibility !== "public" && cookbook.visibility !== "unlisted")) {
    return null;
  }
  return cookbook;
}

export async function createCookbook(userId: string, title: string, description: string) {
  const trimmed = title.trim();
  if (!trimmed) {
    throw new Error("Name the cookbook.");
  }
  const slug = `${slugify(trimmed)}-${randomBytes(3).toString("hex")}`;
  return prisma.cookbook.create({
    data: {
      ownerId: userId,
      title: trimmed,
      description: description.trim(),
      visibility: "private",
      slug,
      members: { create: { userId, role: "owner" } },
    },
  });
}

export async function updateCookbookSettings(args: {
  userId: string;
  cookbookId: string;
  title: string;
  description: string;
  visibility: string;
}) {
  const cookbook = await prisma.cookbook.findUnique({ where: { id: args.cookbookId } });
  if (!cookbook) {
    throw new Error("Cookbook not found.");
  }
  const role = await memberRole(args.cookbookId, args.userId);
  if (!canManageCookbook(role)) {
    throw new Error("Only the cookbook owner can change sharing.");
  }
  return prisma.cookbook.update({
    where: { id: args.cookbookId },
    data: {
      title: args.title.trim(),
      description: args.description.trim(),
      visibility: parseVisibility(args.visibility),
    },
  });
}

export async function addRecipeToCookbook(userId: string, cookbookId: string, recipeId: string) {
  const role = await memberRole(cookbookId, userId);
  if (!canEditCookbookContents(role)) {
    throw new Error("You need editor access to add recipes to this book.");
  }
  const recipe = await prisma.recipe.findUnique({ where: { id: recipeId } });
  if (!recipe || recipe.ownerId !== userId) {
    throw new Error("Add recipes you own, or copy one into your box first.");
  }
  const count = await prisma.cookbookRecipe.count({ where: { cookbookId } });
  return prisma.cookbookRecipe.upsert({
    where: { cookbookId_recipeId: { cookbookId, recipeId } },
    update: {},
    create: { cookbookId, recipeId, position: count },
  });
}

export async function createInvite(userId: string, cookbookId: string, role: string) {
  const member = await memberRole(cookbookId, userId);
  if (!canManageCookbook(member)) {
    throw new Error("Only the owner can invite people.");
  }
  const token = randomBytes(16).toString("hex");
  const expiresAt = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000);
  return prisma.cookbookInvite.create({
    data: {
      cookbookId,
      token,
      role: parseRole(role),
      expiresAt,
    },
  });
}

export async function acceptInvite(userId: string, token: string) {
  const invite = await prisma.cookbookInvite.findUnique({ where: { token } });
  if (!invite || invite.expiresAt < new Date()) {
    throw new Error("This invite expired.");
  }
  await prisma.cookbookMember.upsert({
    where: { cookbookId_userId: { cookbookId: invite.cookbookId, userId } },
    update: { role: invite.role },
    create: { cookbookId: invite.cookbookId, userId, role: invite.role },
  });
  await prisma.cookbookInvite.delete({ where: { id: invite.id } });
  return invite.cookbookId;
}
