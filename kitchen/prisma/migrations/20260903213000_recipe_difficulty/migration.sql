-- AlterTable
ALTER TABLE "Recipe" ADD COLUMN "difficulty" TEXT;

-- CreateIndex
CREATE INDEX "Recipe_difficulty_idx" ON "Recipe"("difficulty");
