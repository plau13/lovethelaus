import { describe, expect, it } from "vitest";
import {
  canAddNote,
  canCommentOnRecipe,
  canEditCookbookContents,
  canEditRecipe,
  canManageCookbook,
  canViewCookbook,
  canViewRecipe,
} from "./permissions";

describe("canViewCookbook", () => {
  it("lets anyone open a public book", () => {
    expect(
      canViewCookbook({
        userId: null,
        ownerId: "mom",
        visibility: "public",
        memberUserIds: ["mom"],
      }),
    ).toBe(true);
  });

  it("keeps unlisted and private books to members", () => {
    expect(
      canViewCookbook({
        userId: null,
        ownerId: "mom",
        visibility: "unlisted",
        memberUserIds: ["mom"],
      }),
    ).toBe(false);
    expect(
      canViewCookbook({
        userId: "aunt",
        ownerId: "mom",
        visibility: "private",
        memberUserIds: ["mom", "aunt"],
      }),
    ).toBe(true);
  });
});

describe("cookbook roles", () => {
  it("only the owner manages sharing", () => {
    expect(canManageCookbook("owner")).toBe(true);
    expect(canManageCookbook("editor")).toBe(false);
  });

  it("owners and editors can add recipes", () => {
    expect(canEditCookbookContents("editor")).toBe(true);
    expect(canEditCookbookContents("viewer")).toBe(false);
  });
});

describe("recipes", () => {
  it("only the recipe owner can edit unless collaborator has edit", () => {
    expect(canEditRecipe({ userId: "mom", recipeOwnerId: "mom" })).toBe(true);
    expect(canEditRecipe({ userId: "aunt", recipeOwnerId: "mom" })).toBe(false);
    expect(
      canEditRecipe({ userId: "aunt", recipeOwnerId: "mom", collaboratorRole: "edit" }),
    ).toBe(true);
  });

  it("members can view a private recipe through the book", () => {
    expect(
      canViewRecipe({
        userId: "aunt",
        recipeOwnerId: "mom",
        containingCookbooks: [
          { visibility: "private", ownerId: "mom", memberUserIds: ["mom", "aunt"] },
        ],
      }),
    ).toBe(true);
  });

  it("strangers cannot view a private recipe", () => {
    expect(
      canViewRecipe({
        userId: "stranger",
        recipeOwnerId: "mom",
        containingCookbooks: [
          { visibility: "private", ownerId: "mom", memberUserIds: ["mom"] },
        ],
      }),
    ).toBe(false);
  });

  it("allows notes when the user can comment", () => {
    expect(
      canAddNote({
        userId: "aunt",
        canComment: canCommentOnRecipe({
          userId: "aunt",
          recipeOwnerId: "mom",
          collaboratorRole: "comment",
          canView: true,
        }),
      }),
    ).toBe(true);
    expect(canAddNote({ userId: null, canComment: true })).toBe(false);
  });
});
