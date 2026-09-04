-- AlterTable
ALTER TABLE "User" ADD COLUMN "firstName" TEXT NOT NULL DEFAULT '';
ALTER TABLE "User" ADD COLUMN "lastName" TEXT NOT NULL DEFAULT '';
ALTER TABLE "User" ADD COLUMN "onboardingCompletedAt" TIMESTAMP(3);
ALTER TABLE "User" ADD COLUMN "onboardingAnswers" TEXT NOT NULL DEFAULT '{}';

-- Backfill names from existing display name
UPDATE "User"
SET
  "firstName" = CASE
    WHEN position(' ' in "name") > 0 THEN split_part("name", ' ', 1)
    ELSE "name"
  END,
  "lastName" = CASE
    WHEN position(' ' in "name") > 0 THEN trim(substring("name" from position(' ' in "name") + 1))
    ELSE ''
  END;

-- Existing users skip onboarding
UPDATE "User" SET "onboardingCompletedAt" = "createdAt" WHERE "onboardingCompletedAt" IS NULL;

-- CreateTable
CREATE TABLE "CookbookFavorite" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "cookbookId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CookbookFavorite_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "CookbookFavorite_userId_idx" ON "CookbookFavorite"("userId");
CREATE INDEX "CookbookFavorite_cookbookId_idx" ON "CookbookFavorite"("cookbookId");
CREATE UNIQUE INDEX "CookbookFavorite_userId_cookbookId_key" ON "CookbookFavorite"("userId", "cookbookId");

-- AddForeignKey
ALTER TABLE "CookbookFavorite" ADD CONSTRAINT "CookbookFavorite_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CookbookFavorite" ADD CONSTRAINT "CookbookFavorite_cookbookId_fkey" FOREIGN KEY ("cookbookId") REFERENCES "Cookbook"("id") ON DELETE CASCADE ON UPDATE CASCADE;
