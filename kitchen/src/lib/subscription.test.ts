import { describe, expect, it } from "vitest";
import {
  canCommentOnRecipe,
  canEditRecipe,
  canViewRecipe,
} from "./permissions";
import {
  canStartSocialImport,
  isSubscriber,
  socialImportRemaining,
  FREE_SOCIAL_IMPORT_LIMIT,
} from "./subscription";

describe("subscription", () => {
  it("detects subscriber tier", () => {
    expect(isSubscriber({ subscriptionTier: "subscriber" })).toBe(true);
    expect(isSubscriber({ subscriptionTier: "free" })).toBe(false);
  });

  it("limits free social imports to lifetime cap", () => {
    const user = {
      subscriptionTier: "free",
      socialImportCount: FREE_SOCIAL_IMPORT_LIMIT,
      socialImportPeriodStart: null,
      socialImportPeriodCount: 0,
    };
    expect(socialImportRemaining(user)).toBe(0);
    expect(canStartSocialImport(user)).toBe(false);
  });
});

describe("collaborator permissions", () => {
  it("allows edit collaborators to edit", () => {
    expect(
      canEditRecipe({
        userId: "aunt",
        recipeOwnerId: "mom",
        collaboratorRole: "edit",
      }),
    ).toBe(true);
  });

  it("allows comment collaborators to comment but not edit", () => {
    expect(
      canCommentOnRecipe({
        userId: "aunt",
        recipeOwnerId: "mom",
        collaboratorRole: "comment",
        canView: true,
      }),
    ).toBe(true);
    expect(
      canEditRecipe({
        userId: "aunt",
        recipeOwnerId: "mom",
        collaboratorRole: "comment",
      }),
    ).toBe(false);
  });

  it("grants view access through collaborator role", () => {
    expect(
      canViewRecipe({
        userId: "aunt",
        recipeOwnerId: "mom",
        collaboratorRole: "view",
        containingCookbooks: [],
      }),
    ).toBe(true);
  });
});
