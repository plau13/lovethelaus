-- Subscription, import counters, recipe collaboration, version history

ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "subscriptionTier" TEXT NOT NULL DEFAULT 'free';
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "socialImportCount" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "socialImportPeriodStart" TIMESTAMP(3);
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "socialImportPeriodCount" INTEGER NOT NULL DEFAULT 0;

CREATE TABLE IF NOT EXISTS "RecipeCollaborator" (
  "id" TEXT NOT NULL,
  "recipeId" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "role" TEXT NOT NULL DEFAULT 'view',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "RecipeCollaborator_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "RecipeCollaborator_recipeId_userId_key" ON "RecipeCollaborator"("recipeId", "userId");
CREATE INDEX IF NOT EXISTS "RecipeCollaborator_userId_idx" ON "RecipeCollaborator"("userId");

ALTER TABLE "RecipeCollaborator" DROP CONSTRAINT IF EXISTS "RecipeCollaborator_recipeId_fkey";
ALTER TABLE "RecipeCollaborator" ADD CONSTRAINT "RecipeCollaborator_recipeId_fkey"
  FOREIGN KEY ("recipeId") REFERENCES "Recipe"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "RecipeCollaborator" DROP CONSTRAINT IF EXISTS "RecipeCollaborator_userId_fkey";
ALTER TABLE "RecipeCollaborator" ADD CONSTRAINT "RecipeCollaborator_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE IF NOT EXISTS "RecipeRevision" (
  "id" TEXT NOT NULL,
  "recipeId" TEXT NOT NULL,
  "editorId" TEXT NOT NULL,
  "snapshot" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "RecipeRevision_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "RecipeRevision_recipeId_idx" ON "RecipeRevision"("recipeId");
CREATE INDEX IF NOT EXISTS "RecipeRevision_editorId_idx" ON "RecipeRevision"("editorId");

ALTER TABLE "RecipeRevision" DROP CONSTRAINT IF EXISTS "RecipeRevision_recipeId_fkey";
ALTER TABLE "RecipeRevision" ADD CONSTRAINT "RecipeRevision_recipeId_fkey"
  FOREIGN KEY ("recipeId") REFERENCES "Recipe"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "RecipeRevision" DROP CONSTRAINT IF EXISTS "RecipeRevision_editorId_fkey";
ALTER TABLE "RecipeRevision" ADD CONSTRAINT "RecipeRevision_editorId_fkey"
  FOREIGN KEY ("editorId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
