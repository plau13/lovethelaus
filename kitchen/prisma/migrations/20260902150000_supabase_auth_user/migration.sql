-- AlterTable
ALTER TABLE "User" ADD COLUMN "authUserId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "User_authUserId_key" ON "User"("authUserId");

-- DropTable
DROP TABLE IF EXISTS "MagicLink";

-- DropTable
DROP TABLE IF EXISTS "Session";
