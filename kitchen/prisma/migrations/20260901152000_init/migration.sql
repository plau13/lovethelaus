-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "defaultServings" INTEGER NOT NULL DEFAULT 4,
    "preferredUnits" TEXT NOT NULL DEFAULT 'us',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Session" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MagicLink" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "userId" TEXT,

    CONSTRAINT "MagicLink_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Recipe" (
    "id" TEXT NOT NULL,
    "ownerId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "ingredients" TEXT NOT NULL,
    "steps" TEXT NOT NULL,
    "bakingSteps" TEXT NOT NULL DEFAULT '',
    "recipeType" TEXT NOT NULL DEFAULT 'cooking',
    "servings" INTEGER,
    "sourceType" TEXT NOT NULL DEFAULT 'typed',
    "sourceUrl" TEXT,
    "sourceAttribution" TEXT,
    "tags" TEXT NOT NULL DEFAULT '',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Recipe_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RecipePhoto" (
    "id" TEXT NOT NULL,
    "recipeId" TEXT NOT NULL,
    "path" TEXT NOT NULL,
    "alt" TEXT NOT NULL DEFAULT '',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RecipePhoto_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Cookbook" (
    "id" TEXT NOT NULL,
    "ownerId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL DEFAULT '',
    "visibility" TEXT NOT NULL DEFAULT 'private',
    "slug" TEXT NOT NULL,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Cookbook_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CookbookRecipe" (
    "id" TEXT NOT NULL,
    "cookbookId" TEXT NOT NULL,
    "recipeId" TEXT NOT NULL,
    "position" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CookbookRecipe_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CookbookMember" (
    "id" TEXT NOT NULL,
    "cookbookId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'viewer',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CookbookMember_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CookbookInvite" (
    "id" TEXT NOT NULL,
    "cookbookId" TEXT NOT NULL,
    "email" TEXT,
    "token" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'viewer',
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CookbookInvite_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RecipeNote" (
    "id" TEXT NOT NULL,
    "recipeId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RecipeNote_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ImportDraft" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "recipeId" TEXT,
    "sourceUrl" TEXT NOT NULL,
    "sourceType" TEXT NOT NULL,
    "rawPayload" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "ingredients" TEXT NOT NULL,
    "steps" TEXT NOT NULL,
    "attribution" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ImportDraft_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InterviewResponse" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "answers" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "InterviewResponse_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "User_email_idx" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Session_token_key" ON "Session"("token");

-- CreateIndex
CREATE INDEX "Session_userId_idx" ON "Session"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "MagicLink_token_key" ON "MagicLink"("token");

-- CreateIndex
CREATE INDEX "MagicLink_email_idx" ON "MagicLink"("email");

-- CreateIndex
CREATE INDEX "Recipe_ownerId_idx" ON "Recipe"("ownerId");

-- CreateIndex
CREATE INDEX "Recipe_title_idx" ON "Recipe"("title");

-- CreateIndex
CREATE INDEX "Recipe_recipeType_idx" ON "Recipe"("recipeType");

-- CreateIndex
CREATE INDEX "RecipePhoto_recipeId_idx" ON "RecipePhoto"("recipeId");

-- CreateIndex
CREATE UNIQUE INDEX "Cookbook_slug_key" ON "Cookbook"("slug");

-- CreateIndex
CREATE INDEX "Cookbook_ownerId_idx" ON "Cookbook"("ownerId");

-- CreateIndex
CREATE INDEX "Cookbook_visibility_idx" ON "Cookbook"("visibility");

-- CreateIndex
CREATE INDEX "CookbookRecipe_recipeId_idx" ON "CookbookRecipe"("recipeId");

-- CreateIndex
CREATE UNIQUE INDEX "CookbookRecipe_cookbookId_recipeId_key" ON "CookbookRecipe"("cookbookId", "recipeId");

-- CreateIndex
CREATE INDEX "CookbookMember_userId_idx" ON "CookbookMember"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "CookbookMember_cookbookId_userId_key" ON "CookbookMember"("cookbookId", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "CookbookInvite_token_key" ON "CookbookInvite"("token");

-- CreateIndex
CREATE INDEX "CookbookInvite_cookbookId_idx" ON "CookbookInvite"("cookbookId");

-- CreateIndex
CREATE INDEX "RecipeNote_recipeId_idx" ON "RecipeNote"("recipeId");

-- CreateIndex
CREATE INDEX "ImportDraft_userId_idx" ON "ImportDraft"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "InterviewResponse_userId_key" ON "InterviewResponse"("userId");

-- AddForeignKey
ALTER TABLE "Session" ADD CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MagicLink" ADD CONSTRAINT "MagicLink_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Recipe" ADD CONSTRAINT "Recipe_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RecipePhoto" ADD CONSTRAINT "RecipePhoto_recipeId_fkey" FOREIGN KEY ("recipeId") REFERENCES "Recipe"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Cookbook" ADD CONSTRAINT "Cookbook_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CookbookRecipe" ADD CONSTRAINT "CookbookRecipe_cookbookId_fkey" FOREIGN KEY ("cookbookId") REFERENCES "Cookbook"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CookbookRecipe" ADD CONSTRAINT "CookbookRecipe_recipeId_fkey" FOREIGN KEY ("recipeId") REFERENCES "Recipe"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CookbookMember" ADD CONSTRAINT "CookbookMember_cookbookId_fkey" FOREIGN KEY ("cookbookId") REFERENCES "Cookbook"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CookbookMember" ADD CONSTRAINT "CookbookMember_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CookbookInvite" ADD CONSTRAINT "CookbookInvite_cookbookId_fkey" FOREIGN KEY ("cookbookId") REFERENCES "Cookbook"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RecipeNote" ADD CONSTRAINT "RecipeNote_recipeId_fkey" FOREIGN KEY ("recipeId") REFERENCES "Recipe"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RecipeNote" ADD CONSTRAINT "RecipeNote_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ImportDraft" ADD CONSTRAINT "ImportDraft_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ImportDraft" ADD CONSTRAINT "ImportDraft_recipeId_fkey" FOREIGN KEY ("recipeId") REFERENCES "Recipe"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InterviewResponse" ADD CONSTRAINT "InterviewResponse_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Enable RLS (deny API access; app uses Prisma connection string)
ALTER TABLE "User" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Session" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "MagicLink" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Recipe" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "RecipePhoto" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Cookbook" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "CookbookRecipe" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "CookbookMember" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "CookbookInvite" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "RecipeNote" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "ImportDraft" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "InterviewResponse" ENABLE ROW LEVEL SECURITY;
