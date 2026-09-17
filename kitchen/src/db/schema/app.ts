import { sql } from "drizzle-orm";
import { boolean, customType, index, integer, pgTable, text, timestamp, uniqueIndex, type AnyPgColumn } from "drizzle-orm/pg-core";
import { createId } from "@paralleldrive/cuid2";
import { user } from "./auth";

/** Postgres full-text search vector. Drizzle has no built-in tsvector type. */
const tsvector = customType<{ data: string; driverData: string }>({
  dataType: () => "tsvector",
});

/**
 * Weighted search document for a recipe. The title matters most, then tags, then
 * the story and ingredients, then the steps. `to_tsvector(regconfig, text)` is
 * immutable with a literal config, which is what a generated column requires.
 */
const RECIPE_SEARCH_DOCUMENT = sql`setweight(to_tsvector('english', "title"), 'A') || setweight(to_tsvector('english', "tags"), 'B') || setweight(to_tsvector('english', "story"), 'C') || setweight(to_tsvector('english', "ingredients"), 'C') || setweight(to_tsvector('english', "steps"), 'D')`;

const ts = (name: string) => timestamp(name, { withTimezone: true, mode: "date" });
const id = () =>
  text("id")
    .primaryKey()
    .$defaultFn(() => createId());
const createdAt = () => ts("created_at").notNull().defaultNow();
const updatedAt = () =>
  ts("updated_at")
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date());
const userRef = (name: string) =>
  text(name)
    .notNull()
    .references(() => user.id, { onDelete: "cascade" });

export const person = pgTable(
  "person",
  {
    id: id(),
    ownerUserId: userRef("owner_user_id"),
    name: text("name").notNull(),
    relationship: text("relationship"),
    birthYear: integer("birth_year"),
    passedYear: integer("passed_year"),
    photoKey: text("photo_key"),
    bio: text("bio").notNull().default(""),
    linkedUserId: text("linked_user_id").references(() => user.id, { onDelete: "set null" }),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [index("person_owner_idx").on(t.ownerUserId)]
);

export const recipe = pgTable(
  "recipe",
  {
    id: id(),
    ownerId: userRef("owner_id"),
    title: text("title").notNull(),
    ingredients: text("ingredients").notNull(),
    steps: text("steps").notNull(),
    bakingSteps: text("baking_steps").notNull().default(""),
    recipeType: text("recipe_type").notNull().default("cooking"),
    servings: integer("servings"),
    sourceType: text("source_type").notNull().default("typed"),
    sourceUrl: text("source_url"),
    sourceAttribution: text("source_attribution"),
    tags: text("tags").notNull().default(""),
    category: text("category"),
    cookMinutes: integer("cook_minutes"),
    difficulty: text("difficulty"),
    // Heritage (see docs/HERITAGE.md)
    slug: text("slug").unique(),
    story: text("story").notNull().default(""),
    originPersonId: text("origin_person_id").references(() => person.id, { onDelete: "set null" }),
    adaptedFromRecipeId: text("adapted_from_recipe_id").references((): AnyPgColumn => recipe.id, {
      onDelete: "set null",
    }),
    firstMadeYear: integer("first_made_year"),
    occasion: text("occasion"),
    /** The photo chosen as the cover. Null falls back to the first by position. */
    coverPhotoId: text("cover_photo_id").references((): AnyPgColumn => recipePhoto.id, { onDelete: "set null" }),
    searchVector: tsvector("search_vector").generatedAlwaysAs(RECIPE_SEARCH_DOCUMENT),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [
    index("recipe_search_idx").using("gin", t.searchVector),
    index("recipe_owner_idx").on(t.ownerId),
    index("recipe_title_idx").on(t.title),
    index("recipe_type_idx").on(t.recipeType),
    index("recipe_category_idx").on(t.category),
    index("recipe_cook_minutes_idx").on(t.cookMinutes),
    index("recipe_difficulty_idx").on(t.difficulty),
    index("recipe_updated_at_idx").on(t.updatedAt),
  ]
);

export const recipeFavorite = pgTable(
  "recipe_favorite",
  {
    id: id(),
    userId: userRef("user_id"),
    recipeId: text("recipe_id")
      .notNull()
      .references(() => recipe.id, { onDelete: "cascade" }),
    createdAt: createdAt(),
  },
  (t) => [
    uniqueIndex("recipe_favorite_user_recipe_key").on(t.userId, t.recipeId),
    index("recipe_favorite_recipe_idx").on(t.recipeId),
  ]
);

/** `path` is the R2 object key (e.g. `<recipeId>/<hex>.jpg`); build URLs with `photoUrl()` from src/lib/paths.ts. */
export const recipePhoto = pgTable(
  "recipe_photo",
  {
    id: id(),
    recipeId: text("recipe_id")
      .notNull()
      .references(() => recipe.id, { onDelete: "cascade" }),
    path: text("path").notNull(),
    contentType: text("content_type"),
    alt: text("alt").notNull().default(""),
    position: integer("position").notNull().default(0),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [uniqueIndex("recipe_photo_path_key").on(t.path), index("recipe_photo_recipe_idx").on(t.recipeId)]
);

export const recipeMedia = pgTable(
  "recipe_media",
  {
    id: id(),
    recipeId: text("recipe_id")
      .notNull()
      .references(() => recipe.id, { onDelete: "cascade" }),
    kind: text("kind").notNull(), // photo | scan | voice
    r2Key: text("r2_key").notNull(),
    contentType: text("content_type"),
    caption: text("caption").notNull().default(""),
    durationSeconds: integer("duration_seconds"),
    /** AI transcription of a scanned card (see docs/HERITAGE.md); read once, stored here. */
    transcript: text("transcript").notNull().default(""),
    transcribedAt: ts("transcribed_at"),
    position: integer("position").notNull().default(0),
    createdBy: text("created_by").references(() => user.id, { onDelete: "set null" }),
    createdAt: createdAt(),
  },
  (t) => [uniqueIndex("recipe_media_key").on(t.r2Key), index("recipe_media_recipe_idx").on(t.recipeId)]
);

export const recipeMemory = pgTable(
  "recipe_memory",
  {
    id: id(),
    recipeId: text("recipe_id")
      .notNull()
      .references(() => recipe.id, { onDelete: "cascade" }),
    userId: userRef("user_id"),
    madeOn: ts("made_on").notNull().defaultNow(),
    note: text("note").notNull().default(""),
    mediaId: text("media_id").references(() => recipeMedia.id, { onDelete: "set null" }),
    createdAt: createdAt(),
  },
  (t) => [index("recipe_memory_recipe_idx").on(t.recipeId), index("recipe_memory_user_idx").on(t.userId)]
);

export const cookbook = pgTable(
  "cookbook",
  {
    id: id(),
    ownerId: userRef("owner_id"),
    title: text("title").notNull(),
    description: text("description").notNull().default(""),
    visibility: text("visibility").notNull().default("private"),
    slug: text("slug").notNull().unique(),
    isDefault: boolean("is_default").notNull().default(false),
    dedication: text("dedication").notNull().default(""),
    familyName: text("family_name"),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [index("cookbook_owner_idx").on(t.ownerId), index("cookbook_visibility_idx").on(t.visibility)]
);

export const cookbookFavorite = pgTable(
  "cookbook_favorite",
  {
    id: id(),
    userId: userRef("user_id"),
    cookbookId: text("cookbook_id")
      .notNull()
      .references(() => cookbook.id, { onDelete: "cascade" }),
    createdAt: createdAt(),
  },
  (t) => [
    uniqueIndex("cookbook_favorite_user_cookbook_key").on(t.userId, t.cookbookId),
    index("cookbook_favorite_cookbook_idx").on(t.cookbookId),
  ]
);

export const cookbookRecipe = pgTable(
  "cookbook_recipe",
  {
    id: id(),
    cookbookId: text("cookbook_id")
      .notNull()
      .references(() => cookbook.id, { onDelete: "cascade" }),
    recipeId: text("recipe_id")
      .notNull()
      .references(() => recipe.id, { onDelete: "cascade" }),
    position: integer("position").notNull().default(0),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [
    uniqueIndex("cookbook_recipe_cookbook_recipe_key").on(t.cookbookId, t.recipeId),
    index("cookbook_recipe_recipe_idx").on(t.recipeId),
  ]
);

export const cookbookMember = pgTable(
  "cookbook_member",
  {
    id: id(),
    cookbookId: text("cookbook_id")
      .notNull()
      .references(() => cookbook.id, { onDelete: "cascade" }),
    userId: userRef("user_id"),
    role: text("role").notNull().default("viewer"),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [
    uniqueIndex("cookbook_member_cookbook_user_key").on(t.cookbookId, t.userId),
    index("cookbook_member_user_idx").on(t.userId),
  ]
);

export const cookbookInvite = pgTable(
  "cookbook_invite",
  {
    id: id(),
    cookbookId: text("cookbook_id")
      .notNull()
      .references(() => cookbook.id, { onDelete: "cascade" }),
    email: text("email"),
    token: text("token").notNull().unique(),
    role: text("role").notNull().default("viewer"),
    invitedByUserId: text("invited_by_user_id").references(() => user.id, { onDelete: "set null" }),
    expiresAt: ts("expires_at").notNull(),
    acceptedAt: ts("accepted_at"),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [index("cookbook_invite_cookbook_idx").on(t.cookbookId), index("cookbook_invite_email_idx").on(t.email)]
);

export const recipeNote = pgTable(
  "recipe_note",
  {
    id: id(),
    recipeId: text("recipe_id")
      .notNull()
      .references(() => recipe.id, { onDelete: "cascade" }),
    userId: userRef("user_id"),
    body: text("body").notNull(),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [index("recipe_note_recipe_idx").on(t.recipeId)]
);

export const importDraft = pgTable(
  "import_draft",
  {
    id: id(),
    userId: userRef("user_id"),
    recipeId: text("recipe_id").references(() => recipe.id, { onDelete: "set null" }),
    sourceUrl: text("source_url").notNull(),
    sourceType: text("source_type").notNull(),
    rawPayload: text("raw_payload").notNull(),
    title: text("title").notNull(),
    ingredients: text("ingredients").notNull(),
    steps: text("steps").notNull(),
    attribution: text("attribution").notNull(),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [index("import_draft_user_idx").on(t.userId)]
);

export const interviewResponse = pgTable("interview_response", {
  id: id(),
  userId: userRef("user_id").unique(),
  answers: text("answers").notNull(),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
});

export const recipeCollaborator = pgTable(
  "recipe_collaborator",
  {
    id: id(),
    recipeId: text("recipe_id")
      .notNull()
      .references(() => recipe.id, { onDelete: "cascade" }),
    userId: userRef("user_id"),
    role: text("role").notNull().default("view"),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [
    uniqueIndex("recipe_collaborator_recipe_user_key").on(t.recipeId, t.userId),
    index("recipe_collaborator_user_idx").on(t.userId),
  ]
);

export const recipeRevision = pgTable(
  "recipe_revision",
  {
    id: id(),
    recipeId: text("recipe_id")
      .notNull()
      .references(() => recipe.id, { onDelete: "cascade" }),
    editorId: userRef("editor_id"),
    snapshot: text("snapshot").notNull(),
    createdAt: createdAt(),
  },
  (t) => [index("recipe_revision_recipe_idx").on(t.recipeId), index("recipe_revision_editor_idx").on(t.editorId)]
);
