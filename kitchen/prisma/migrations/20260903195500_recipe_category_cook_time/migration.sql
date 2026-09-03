-- AlterTable
ALTER TABLE "Recipe" ADD COLUMN "category" TEXT;
ALTER TABLE "Recipe" ADD COLUMN "cookMinutes" INTEGER;

-- CreateIndex
CREATE INDEX "Recipe_category_idx" ON "Recipe"("category");

-- CreateIndex
CREATE INDEX "Recipe_cookMinutes_idx" ON "Recipe"("cookMinutes");
