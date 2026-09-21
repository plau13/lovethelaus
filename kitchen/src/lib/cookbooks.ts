import { randomBytes } from "crypto";
import { and, asc, count, desc, eq, exists, gt, ilike, inArray, or, sql, type SQL } from "drizzle-orm";
import { getDb, schema } from "@/db/client";
import { sendCookbookInviteEmail, sendCookbookMemberAddedEmail } from "@/lib/email-templates";
import { appUrl } from "@/lib/paths";
import { canEditCookbookContents, canManageCookbook, canViewCookbook } from "@/lib/permissions";
import { ensureRecipeSlugs } from "@/lib/recipes";
import { searchTerms } from "@/lib/search-terms";
import { slugify } from "@/lib/slug";
import { isVisibility } from "@/lib/kitchen-prefs";
import type { CookbookListFilter, CookbookRole, Visibility } from "@/lib/types";
import { COOKBOOK_ROLES } from "@/lib/types";

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
  if (!isVisibility(value)) {
    throw new Error("Visibility must be private, unlisted, or public.");
  }
  return value;
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

export const PUBLIC_COOKBOOKS_PER_PAGE = 20;

/** SQL: title or description contains the search text. Null when there is no query. */
function cookbookMatches(query: string): SQL | null {
  if (!query) {
    return null;
  }
  const needle = `%${query.replace(/[%_]/g, (char) => `\\${char}`)}%`;
  return or(ilike(cookbook.title, needle), ilike(cookbook.description, needle))!;
}

/** Public cookbooks matching a search, without loading them. Fixes the page number. */
export async function countPublicCookbooks(userId: string, q = ""): Promise<number> {
  const db = getDb();
  const matches = cookbookMatches(searchTerms(q));
  const notMine = sql`NOT ${memberOf(userId)}`;
  const where = matches
    ? and(eq(cookbook.visibility, "public"), notMine, matches)
    : and(eq(cookbook.visibility, "public"), notMine);
  const [row] = await db.select({ total: count() }).from(cookbook).where(where);
  return Number(row?.total ?? 0);
}

/**
 * The cookbooks a user can reach, grouped as the index page shows them. The
 * user's own and shared books are bounded by their memberships and come back
 * whole; the public list is unbounded, so it is filtered and paged in Postgres.
 */
export async function listCookbooksForUser(
  userId: string,
  options: { q?: string; filter?: CookbookListFilter; limit?: number; offset?: number } = {}
) {
  const db = getDb();
  const { q = "", filter = "all", limit = PUBLIC_COOKBOOKS_PER_PAGE, offset = 0 } = options;
  const query = searchTerms(q);
  const matches = cookbookMatches(query);

  const wantsMembers = filter === "all" || filter === "private" || filter === "shared";
  const wantsPublic = filter === "all" || filter === "public";

  const memberRows = wantsMembers
    ? await db.query.cookbook.findMany({
        where: matches ? and(memberOf(userId), matches) : memberOf(userId),
        orderBy: [desc(cookbook.isDefault), desc(cookbook.updatedAt)],
      })
    : [];

  let publicRows: CookbookRow[] = [];
  let publicTotal = 0;
  if (wantsPublic) {
    // Books the user is already a member of appear in their own sections instead.
    const notMine = sql`NOT ${memberOf(userId)}`;
    const publicWhere = matches
      ? and(eq(cookbook.visibility, "public"), notMine, matches)
      : and(eq(cookbook.visibility, "public"), notMine);
    const [countRow] = await db.select({ total: count() }).from(cookbook).where(publicWhere);
    publicTotal = Number(countRow?.total ?? 0);
    publicRows = await db.query.cookbook.findMany({
      where: publicWhere,
      orderBy: [desc(cookbook.updatedAt)],
      limit,
      ...(offset ? { offset } : {}),
    });
  }

  const [memberCookbooks, publicCookbooks] = await Promise.all([
    withListCounts(memberRows, userId),
    withListCounts(publicRows, userId),
  ]);

  const own = memberCookbooks.filter((entry) => entry.ownerId === userId);
  const shared = memberCookbooks.filter((entry) => entry.ownerId !== userId);

  switch (filter) {
    case "private":
      return { own: own.filter((entry) => entry.visibility === "private"), shared: [], public: [], publicTotal: 0 };
    case "shared":
      return { own: [], shared, public: [], publicTotal: 0 };
    case "public":
      return { own: [], shared: [], public: publicCookbooks, publicTotal };
    case "all":
      return { own, shared, public: publicCookbooks, publicTotal };
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

export async function createCookbook(userId: string, title: string, description: string, visibility: Visibility) {
  const db = getDb();
  const trimmed = title.trim();
  if (!trimmed) {
    throw new Error("Name the cookbook.");
  }
  const slug = `${slugify(trimmed)}-${randomBytes(3).toString("hex")}`;
  const [created] = await db
    .insert(cookbook)
    .values({ ownerId: userId, title: trimmed, description: description.trim(), visibility, slug })
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
  familyName?: string | null;
  dedication?: string | null;
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
  const visibility = parseVisibility(args.visibility);
  const [updated] = await db
    .update(cookbook)
    .set({
      title: args.title.trim(),
      description: args.description.trim(),
      visibility,
      ...(args.familyName !== undefined ? { familyName: args.familyName?.trim() || null } : {}),
      ...(args.dedication !== undefined ? { dedication: (args.dedication ?? "").trim() } : {}),
    })
    .where(eq(cookbook.id, args.cookbookId))
    .returning();
  if (visibility !== "private") {
    const entries = await db.query.cookbookRecipe.findMany({
      where: eq(cookbookRecipe.cookbookId, args.cookbookId),
      columns: { recipeId: true },
    });
    await ensureRecipeSlugs(entries.map((entry) => entry.recipeId));
  }
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

/**
 * Cookbook loaded for the print-ready book: every recipe with its provenance
 * person, in cookbook order. Returns null when the caller cannot view the book.
 */
export async function getCookbookForBook(cookbookId: string, userId: string) {
  const db = getDb();
  const found = await db.query.cookbook.findFirst({
    where: eq(cookbook.id, cookbookId),
    with: {
      members: { columns: { userId: true } },
      owner: { columns: { id: true, name: true } },
      recipes: {
        with: { recipe: { with: { originPerson: true } } },
        orderBy: [asc(cookbookRecipe.position)],
      },
    },
  });
  if (!found) {
    return null;
  }
  const allowed = canViewCookbook({
    userId,
    ownerId: found.ownerId,
    visibility: found.visibility,
    memberUserIds: found.members.map((member) => member.userId),
  });
  return allowed ? found : null;
}
