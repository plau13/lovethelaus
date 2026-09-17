import { relations } from "drizzle-orm";
import { account, session, user } from "./auth";
import {
  cookbook,
  cookbookFavorite,
  cookbookInvite,
  cookbookMember,
  cookbookRecipe,
  importDraft,
  interviewResponse,
  person,
  recipe,
  recipeCollaborator,
  recipeFavorite,
  recipeMedia,
  recipeMemory,
  recipeNote,
  recipePhoto,
  recipeRevision,
} from "./app";

export const userRelations = relations(user, ({ many, one }) => ({
  sessions: many(session),
  accounts: many(account),
  recipes: many(recipe),
  cookbooks: many(cookbook),
  memberships: many(cookbookMember),
  notes: many(recipeNote),
  interview: one(interviewResponse, { fields: [user.id], references: [interviewResponse.userId] }),
  importDrafts: many(importDraft),
  recipeCollaborations: many(recipeCollaborator),
  recipeRevisions: many(recipeRevision),
  recipeFavorites: many(recipeFavorite),
  cookbookFavorites: many(cookbookFavorite),
  people: many(person),
}));

export const sessionRelations = relations(session, ({ one }) => ({
  user: one(user, { fields: [session.userId], references: [user.id] }),
}));

export const accountRelations = relations(account, ({ one }) => ({
  user: one(user, { fields: [account.userId], references: [user.id] }),
}));

export const personRelations = relations(person, ({ one, many }) => ({
  owner: one(user, { fields: [person.ownerUserId], references: [user.id] }),
  recipes: many(recipe),
}));

export const recipeRelations = relations(recipe, ({ one, many }) => ({
  owner: one(user, { fields: [recipe.ownerId], references: [user.id] }),
  originPerson: one(person, { fields: [recipe.originPersonId], references: [person.id] }),
  adaptedFrom: one(recipe, {
    fields: [recipe.adaptedFromRecipeId],
    references: [recipe.id],
    relationName: "lineage",
  }),
  adaptations: many(recipe, { relationName: "lineage" }),
  photos: many(recipePhoto),
  media: many(recipeMedia),
  memories: many(recipeMemory),
  cookbookRecipes: many(cookbookRecipe),
  notes: many(recipeNote),
  importDrafts: many(importDraft),
  collaborators: many(recipeCollaborator),
  revisions: many(recipeRevision),
  favorites: many(recipeFavorite),
}));

export const recipeFavoriteRelations = relations(recipeFavorite, ({ one }) => ({
  user: one(user, { fields: [recipeFavorite.userId], references: [user.id] }),
  recipe: one(recipe, { fields: [recipeFavorite.recipeId], references: [recipe.id] }),
}));

export const recipePhotoRelations = relations(recipePhoto, ({ one }) => ({
  recipe: one(recipe, { fields: [recipePhoto.recipeId], references: [recipe.id] }),
}));

export const recipeMediaRelations = relations(recipeMedia, ({ one }) => ({
  recipe: one(recipe, { fields: [recipeMedia.recipeId], references: [recipe.id] }),
  creator: one(user, { fields: [recipeMedia.createdBy], references: [user.id] }),
}));

export const recipeMemoryRelations = relations(recipeMemory, ({ one }) => ({
  recipe: one(recipe, { fields: [recipeMemory.recipeId], references: [recipe.id] }),
  user: one(user, { fields: [recipeMemory.userId], references: [user.id] }),
  media: one(recipeMedia, { fields: [recipeMemory.mediaId], references: [recipeMedia.id] }),
}));

export const cookbookRelations = relations(cookbook, ({ one, many }) => ({
  owner: one(user, { fields: [cookbook.ownerId], references: [user.id] }),
  recipes: many(cookbookRecipe),
  members: many(cookbookMember),
  invites: many(cookbookInvite),
  favorites: many(cookbookFavorite),
}));

export const cookbookFavoriteRelations = relations(cookbookFavorite, ({ one }) => ({
  user: one(user, { fields: [cookbookFavorite.userId], references: [user.id] }),
  cookbook: one(cookbook, { fields: [cookbookFavorite.cookbookId], references: [cookbook.id] }),
}));

export const cookbookRecipeRelations = relations(cookbookRecipe, ({ one }) => ({
  cookbook: one(cookbook, { fields: [cookbookRecipe.cookbookId], references: [cookbook.id] }),
  recipe: one(recipe, { fields: [cookbookRecipe.recipeId], references: [recipe.id] }),
}));

export const cookbookMemberRelations = relations(cookbookMember, ({ one }) => ({
  cookbook: one(cookbook, { fields: [cookbookMember.cookbookId], references: [cookbook.id] }),
  user: one(user, { fields: [cookbookMember.userId], references: [user.id] }),
}));

export const cookbookInviteRelations = relations(cookbookInvite, ({ one }) => ({
  cookbook: one(cookbook, { fields: [cookbookInvite.cookbookId], references: [cookbook.id] }),
  invitedBy: one(user, { fields: [cookbookInvite.invitedByUserId], references: [user.id] }),
}));

export const recipeNoteRelations = relations(recipeNote, ({ one }) => ({
  recipe: one(recipe, { fields: [recipeNote.recipeId], references: [recipe.id] }),
  user: one(user, { fields: [recipeNote.userId], references: [user.id] }),
}));

export const importDraftRelations = relations(importDraft, ({ one }) => ({
  user: one(user, { fields: [importDraft.userId], references: [user.id] }),
  recipe: one(recipe, { fields: [importDraft.recipeId], references: [recipe.id] }),
}));

export const interviewResponseRelations = relations(interviewResponse, ({ one }) => ({
  user: one(user, { fields: [interviewResponse.userId], references: [user.id] }),
}));

export const recipeCollaboratorRelations = relations(recipeCollaborator, ({ one }) => ({
  recipe: one(recipe, { fields: [recipeCollaborator.recipeId], references: [recipe.id] }),
  user: one(user, { fields: [recipeCollaborator.userId], references: [user.id] }),
}));

export const recipeRevisionRelations = relations(recipeRevision, ({ one }) => ({
  recipe: one(recipe, { fields: [recipeRevision.recipeId], references: [recipe.id] }),
  editor: one(user, { fields: [recipeRevision.editorId], references: [user.id] }),
}));
