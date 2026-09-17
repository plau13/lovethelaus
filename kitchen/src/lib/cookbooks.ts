import { randomBytes } from "crypto";
import { and, asc, count, desc, eq, exists, gt, inArray, notInArray, sql } from "drizzle-orm";
import { getDb, schema } from "@/db/client";
import { sendCookbookInviteEmail, sendCookbookMemberAddedEmail } from "@/lib/email-templates";
import { appUrl } from "@/lib/paths";
import { canEditCookbookContents, canManageCookbook, canViewCookbook } from "@/lib/permissions";
import { slugify } from "@/lib/slug";
import type { CookbookListFilter, CookbookRole, Visibility } from "@/lib/types";
import { COOKBOOK_ROLES, VISIBILITIES } from "@/lib/types";

const { cookbook, cookbookMember, cookbookRecipe, cookbookInvite, cookbookFavorite, recipe, user } = schema;

export const INVITE_TTL_MS = 14 * 24 * 60 * 60 * 1000;

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
  const db = getDb();
  const member = await db.query.cookbookMember.findFirst({
    where: and(eq(cookbookMember.cookbookId, cookbookId), eq(cookbookMember.userId, userId)),
    columns: { role: true },
  });
  return member?.role ?? null;
}

type CookbookRow = typeof cookbook.$inferSelect;
type CookbookListEntry = CookbookRow & {
  members: (typeof cookbookMember.$inferSelect)[];
  _count: { recipes: number; members: number };
};

/** Attach `_count` (recipes, members) and the caller's membership rows to cookbook rows. */
async function withListCounts(rows: CookbookRow[], userId: string): Promise<CookbookListEntry[]> {
  if (rows.length === 0) {
    return [];
  }
  const db = getDb();
  const ids = rows.map((row) => row.id);
  const [recipeCounts, memberCounts, myMemberships] = await Promise.all([
    db
      .select({ cookbookId: cookbookRecipe.cookbookId, total: count() })
      .from(cookbookRecipe)
      .where(inArray(cookbookRecipe.cookbookId, ids))
      .groupBy(cookbookRecipe.cookbookId),
    db
      .select({ cookbookId: cookbookMember.cookbookId, total: count() })
      .from(cookbookMember)
      .where(inArray(cookbookMember.cookbookId, ids))
      .groupBy(cookbookMember.cookbookId),
    db.query.cookbookMember.findMany({
      where: and(inArray(cookbookMember.cookbookId, ids), eq(cookbookMember.userId, userId)),
    }),
  ]);
  const recipeTotals = new Map(recipeCounts.map((row) => [row.cookbookId, Number(row.total)]));
  const memberTotals = new Map(memberCounts.map((row) => [row.cookbookId, Number(row.total)]));
  const membershipByCookbook = new Map<string, (typeof cookbookMember.$inferSelect)[]>();
  for (const membership of myMemberships) {
    const list = membershipByCookbook.get(membership.cookbookId) ?? [];
    list.push(membership);
    membershipByCookbook.set(membership.cookbookId, list);
  }
  return rows.map((row) => ({
    ...row,
    members: membershipByCookbook.get(row.id) ?? [],
    _count: { recipes: recipeTotals.get(row.id) ?? 0, members: memberTotals.get(row.id) ?? 0 },
  }));
}

function memberOf(userId: string) {
  const db = getDb();
  return exists(
    db
      .select({ one: sql`1` })
      .from(cookbookMember)
      .where(and(eq(cookbookMember.cookbookId, cookbook.id), eq(cookbookMember.userId, userId)))
  );
}

export async function listMyCookbooks(userId: string) {
  const db = getDb();
  const rows = await db.query.cookbook.findMany({
    where: memberOf(userId),
    orderBy: [desc(cookbook.isDefault), desc(cookbook.updatedAt)],
  });
  return withListCounts(rows, userId);
}

function matchesCookbookQuery(entry: { title: string; description: string }, query: string): boolean {
  const needle = query.trim().toLowerCase();
  if (!needle) {
    return true;
  }
  return `${entry.title} ${entry.description}`.toLowerCase().includes(needle);
}

export async function listCookbooksForUser(userId: string, options: { q?: string; filter?: CookbookListFilter } = {}) {
  const db = getDb();
  const { q = "", filter = "all" } = options;

  const memberRows = await db.query.cookbook.findMany({
    where: memberOf(userId),
    orderBy: [desc(cookbook.isDefault), desc(cookbook.updatedAt)],
  });
  const memberIds = memberRows.map((row) => row.id);

  const publicRows = await db.query.cookbook.findMany({
    where: memberIds.length > 0 ? and(eq(cookbook.visibility, "public"), notInArray(cookbook.id, memberIds)) : eq(cookbook.visibility, "public"),
    orderBy: [desc(cookbook.updatedAt)],
  });

  const [memberCookbooks, publicCookbooks] = await Promise.all([
    withListCounts(memberRows, userId),
    withListCounts(publicRows, userId),
  ]);

  const own = memberCookbooks.filter((entry) => entry.ownerId === userId && matchesCookbookQuery(entry, q));
  const shared = memberCookbooks.filter((entry) => entry.ownerId !== userId && matchesCookbookQuery(entry, q));
  const pub = publicCookbooks.filter((entry) => matchesCookbookQuery(entry, q));

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
  const db = getDb();
  const found = await db.query.cookbook.findFirst({
    where: eq(cookbook.id, cookbookId),
    with: {
      members: { with: { user: true }, orderBy: [asc(cookbookMember.createdAt)] },
      recipes: { with: { recipe: { with: { photos: true } } }, orderBy: [asc(cookbookRecipe.position)] },
      invites: true,
      owner: true,
      ...(userId ? { favorites: { where: eq(cookbookFavorite.userId, userId), columns: { id: true }, limit: 1 } } : {}),
    },
  });
  if (!found) {
    return null;
  }
  const { favorites, ...cookbookData } = found as typeof found & { favorites?: { id: string }[] };
  const favorited = Boolean(userId && favorites && favorites.length > 0);
  const allowed = canViewCookbook({
    userId,
    ownerId: cookbookData.ownerId,
    visibility: cookbookData.visibility,
    memberUserIds: cookbookData.members.map((member) => member.userId),
  });
  if (!allowed) {
    return null;
  }
  return { ...cookbookData, favorited };
}

export async function getPublicCookbook(slug: string) {
  const db = getDb();
  const found = await db.query.cookbook.findFirst({
    where: eq(cookbook.slug, slug),
    with: {
      members: true,
      recipes: { with: { recipe: { with: { photos: true } } }, orderBy: [asc(cookbookRecipe.position)] },
      owner: { columns: { id: true, name: true } },
    },
  });
  if (!found || (found.visibility !== "public" && found.visibility !== "unlisted")) {
    return null;
  }
  return found;
}

export async function createCookbook(userId: string, title: string, description: string) {
  const db = getDb();
  const trimmed = title.trim();
  if (!trimmed) {
    throw new Error("Name the cookbook.");
  }
  const slug = `${slugify(trimmed)}-${randomBytes(3).toString("hex")}`;
  const [created] = await db
    .insert(cookbook)
    .values({ ownerId: userId, title: trimmed, description: description.trim(), visibility: "private", slug })
    .returning();
  await db.insert(cookbookMember).values({ cookbookId: created.id, userId, role: "owner" }).onConflictDoNothing();
  return created;
}

export async function updateCookbookSettings(args: {
  userId: string;
  cookbookId: string;
  title: string;
  description: string;
  visibility: string;
}) {
  const db = getDb();
  const existing = await db.query.cookbook.findFirst({ where: eq(cookbook.id, args.cookbookId), columns: { id: true } });
  if (!existing) {
    throw new Error("Cookbook not found.");
  }
  const role = await memberRole(args.cookbookId, args.userId);
  if (!canManageCookbook(role)) {
    throw new Error("Only the cookbook owner can change sharing.");
  }
  const [updated] = await db
    .update(cookbook)
    .set({
      title: args.title.trim(),
      description: args.description.trim(),
      visibility: parseVisibility(args.visibility),
    })
    .where(eq(cookbook.id, args.cookbookId))
    .returning();
  return updated;
}

export async function addRecipeToCookbook(userId: string, cookbookId: string, recipeId: string) {
  const db = getDb();
  const role = await memberRole(cookbookId, userId);
  if (!canEditCookbookContents(role)) {
    throw new Error("You need editor access to add recipes to this book.");
  }
  const target = await db.query.recipe.findFirst({ where: eq(recipe.id, recipeId), columns: { ownerId: true } });
  if (!target || target.ownerId !== userId) {
    throw new Error("Add recipes you own, or copy one into your box first.");
  }
  const [{ total }] = await db
    .select({ total: count() })
    .from(cookbookRecipe)
    .where(eq(cookbookRecipe.cookbookId, cookbookId));
  await db
    .insert(cookbookRecipe)
    .values({ cookbookId, recipeId, position: Number(total) })
    .onConflictDoNothing();
}

export async function createInvite(userId: string, cookbookId: string, role: string) {
  const db = getDb();
  const member = await memberRole(cookbookId, userId);
  if (!canManageCookbook(member)) {
    throw new Error("Only the owner can invite people.");
  }
  const token = randomBytes(16).toString("hex");
  const [invite] = await db
    .insert(cookbookInvite)
    .values({
      cookbookId,
      token,
      role: parseRole(role),
      invitedByUserId: userId,
      expiresAt: new Date(Date.now() + INVITE_TTL_MS),
    })
    .returning();
  return invite;
}

export async function getInvite(token: string) {
  const db = getDb();
  const invite = await db.query.cookbookInvite.findFirst({
    where: eq(cookbookInvite.token, token),
    with: { cookbook: true, invitedBy: { columns: { name: true } } },
  });
  if (!invite || invite.expiresAt < new Date()) {
    return null;
  }
  return invite;
}

export async function acceptInvite(userId: string, token: string) {
  const db = getDb();
  const invite = await db.query.cookbookInvite.findFirst({ where: eq(cookbookInvite.token, token) });
  if (!invite || invite.expiresAt < new Date()) {
    throw new Error("This invite expired.");
  }
  if (invite.email) {
    const me = await db.query.user.findFirst({ where: eq(user.id, userId), columns: { email: true } });
    if (!me || me.email.toLowerCase() !== invite.email.toLowerCase()) {
      throw new Error(`This invite was sent to ${invite.email}. Sign in with that email to join.`);
    }
  }
  await db
    .insert(cookbookMember)
    .values({ cookbookId: invite.cookbookId, userId, role: invite.role })
    .onConflictDoUpdate({ target: [cookbookMember.cookbookId, cookbookMember.userId], set: { role: invite.role } });
  await db.delete(cookbookInvite).where(eq(cookbookInvite.id, invite.id));
  return invite.cookbookId;
}

/** Called when a new account is created: join every unexpired cookbook invite addressed to that email. */
export async function acceptPendingInvitesForEmail(userId: string, emailRaw: string): Promise<number> {
  const db = getDb();
  const email = emailRaw.trim().toLowerCase();
  if (!email) {
    return 0;
  }
  const pending = await db.query.cookbookInvite.findMany({
    where: and(eq(cookbookInvite.email, email), gt(cookbookInvite.expiresAt, new Date())),
  });
  for (const invite of pending) {
    await db
      .insert(cookbookMember)
      .values({ cookbookId: invite.cookbookId, userId, role: invite.role })
      .onConflictDoUpdate({ target: [cookbookMember.cookbookId, cookbookMember.userId], set: { role: invite.role } });
    await db.delete(cookbookInvite).where(eq(cookbookInvite.id, invite.id));
  }
  return pending.length;
}

/**
 * Share a cookbook by email. Existing accounts become members immediately; unknown addresses get an
 * emailed invite that is auto-accepted when they sign up with that email.
 */
export async function addCookbookMemberByEmail(args: {
  ownerId: string;
  cookbookId: string;
  email: string;
  role: string;
}): Promise<"added" | "invited"> {
  const db = getDb();
  const target = await db.query.cookbook.findFirst({
    where: eq(cookbook.id, args.cookbookId),
    with: { owner: { columns: { id: true, name: true, email: true } } },
  });
  if (!target || target.ownerId !== args.ownerId) {
    throw new Error("Only the cookbook owner can invite people.");
  }
  const email = args.email.trim().toLowerCase();
  if (!email.includes("@")) {
    throw new Error(`"${args.email}" is not an email address.`);
  }
  const role = parseRole(args.role);
  if (role === "owner") {
    throw new Error("Cannot assign owner role to another person.");
  }
  if (email === target.owner.email.toLowerCase()) {
    throw new Error("You already own this cookbook.");
  }

  const invitee = await db.query.user.findFirst({ where: eq(user.email, email), columns: { id: true, email: true } });
  if (!invitee) {
    const token = randomBytes(16).toString("hex");
    await db.insert(cookbookInvite).values({
      cookbookId: args.cookbookId,
      email,
      token,
      role,
      invitedByUserId: args.ownerId,
      expiresAt: new Date(Date.now() + INVITE_TTL_MS),
    });
    await sendCookbookInviteEmail({
      to: email,
      inviterName: target.owner.name,
      cookbookTitle: target.title,
      role,
      url: appUrl(`/invite/${token}`),
    });
    return "invited";
  }

  await db
    .insert(cookbookMember)
    .values({ cookbookId: args.cookbookId, userId: invitee.id, role })
    .onConflictDoUpdate({ target: [cookbookMember.cookbookId, cookbookMember.userId], set: { role } });
  await sendCookbookMemberAddedEmail({
    to: invitee.email,
    inviterName: target.owner.name,
    cookbookTitle: target.title,
    role,
    url: appUrl(`/cookbooks/${target.id}`),
  });
  return "added";
}

export async function removeCookbookMember(args: { ownerId: string; cookbookId: string; userId: string }) {
  const db = getDb();
  const target = await db.query.cookbook.findFirst({ where: eq(cookbook.id, args.cookbookId), columns: { ownerId: true } });
  if (!target || target.ownerId !== args.ownerId) {
    throw new Error("Only the cookbook owner can remove members.");
  }
  if (args.userId === args.ownerId) {
    throw new Error("Cannot remove the cookbook owner.");
  }
  const member = await db.query.cookbookMember.findFirst({
    where: and(eq(cookbookMember.cookbookId, args.cookbookId), eq(cookbookMember.userId, args.userId)),
    columns: { role: true },
  });
  if (!member || member.role === "owner") {
    throw new Error("Cannot remove the cookbook owner.");
  }
  await db
    .delete(cookbookMember)
    .where(and(eq(cookbookMember.cookbookId, args.cookbookId), eq(cookbookMember.userId, args.userId)));
}
