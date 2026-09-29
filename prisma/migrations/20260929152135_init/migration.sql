-- CreateEnum
CREATE TYPE "Role" AS ENUM ('USER', 'ADMIN');

-- CreateEnum
CREATE TYPE "Sex" AS ENUM ('MAENNLICH', 'WEIBLICH');

-- CreateEnum
CREATE TYPE "DailyActivity" AS ENUM ('SITZEND', 'LEICHT', 'MITTEL', 'STARK');

-- CreateEnum
CREATE TYPE "Goal" AS ENUM ('ABNEHMEN', 'HALTEN', 'MUSKELAUFBAU', 'ZUNEHMEN');

-- CreateEnum
CREATE TYPE "MealType" AS ENUM ('FRUEHSTUECK', 'MITTAG', 'ABEND', 'SNACK');

-- CreateEnum
CREATE TYPE "BaseType" AS ENUM ('REIS', 'NUDELN', 'KARTOFFELN', 'BROT', 'HUELSENFRUECHTE', 'HAFER', 'BOWL', 'SUPPE', 'SALAT', 'SONSTIGES');

-- CreateEnum
CREATE TYPE "Allergen" AS ENUM ('GLUTEN', 'SOJA', 'NUESSE', 'ERDNUESSE', 'SESAM');

-- CreateEnum
CREATE TYPE "LogSource" AS ENUM ('RECIPE', 'SAVED_RECIPE', 'INGREDIENT');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "role" "Role" NOT NULL DEFAULT 'USER',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Profile" (
    "userId" TEXT NOT NULL,
    "sex" "Sex" NOT NULL,
    "birthDate" TIMESTAMP(3) NOT NULL,
    "heightCm" INTEGER NOT NULL,
    "weightKg" DOUBLE PRECISION NOT NULL,
    "bodyFatPct" DOUBLE PRECISION,
    "dailyActivity" "DailyActivity" NOT NULL,
    "goal" "Goal" NOT NULL,
    "mealsPerDay" INTEGER NOT NULL DEFAULT 3,
    "supermarketId" TEXT,
    "weeklyBudgetCents" INTEGER NOT NULL DEFAULT 5000,
    "allergies" "Allergen"[],
    "dislikedIds" TEXT[],
    "preferredBases" "BaseType"[],
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Profile_pkey" PRIMARY KEY ("userId")
);

-- CreateTable
CREATE TABLE "SportActivity" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "minutesPerSession" INTEGER NOT NULL,
    "sessionsPerWeek" INTEGER NOT NULL,

    CONSTRAINT "SportActivity_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WeightLog" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "weightKg" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "WeightLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Supermarket" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "priceFactor" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "Supermarket_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Ingredient" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "kcal" DOUBLE PRECISION NOT NULL,
    "protein" DOUBLE PRECISION NOT NULL,
    "carbs" DOUBLE PRECISION NOT NULL,
    "fat" DOUBLE PRECISION NOT NULL,
    "fiber" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "pricePer100gCents" DOUBLE PRECISION NOT NULL,
    "packageGrams" INTEGER NOT NULL DEFAULT 500,
    "unitName" TEXT,
    "gramsPerUnit" DOUBLE PRECISION,
    "allergens" "Allergen"[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Ingredient_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserIngredientPrice" (
    "userId" TEXT NOT NULL,
    "ingredientId" TEXT NOT NULL,
    "pricePer100gCents" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "UserIngredientPrice_pkey" PRIMARY KEY ("userId","ingredientId")
);

-- CreateTable
CREATE TABLE "FavoriteIngredient" (
    "userId" TEXT NOT NULL,
    "ingredientId" TEXT NOT NULL,

    CONSTRAINT "FavoriteIngredient_pkey" PRIMARY KEY ("userId","ingredientId")
);

-- CreateTable
CREATE TABLE "Recipe" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "mealType" "MealType" NOT NULL,
    "baseType" "BaseType" NOT NULL,
    "servings" INTEGER NOT NULL DEFAULT 2,
    "prepMinutes" INTEGER NOT NULL,
    "steps" TEXT[],
    "tags" TEXT[],
    "published" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Recipe_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RecipeIngredient" (
    "id" TEXT NOT NULL,
    "recipeId" TEXT NOT NULL,
    "ingredientId" TEXT NOT NULL,
    "grams" DOUBLE PRECISION NOT NULL,
    "note" TEXT,
    "position" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "RecipeIngredient_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SavedRecipe" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "recipeId" TEXT NOT NULL,
    "note" TEXT,
    "servings" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SavedRecipe_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SavedRecipeIngredient" (
    "id" TEXT NOT NULL,
    "savedRecipeId" TEXT NOT NULL,
    "ingredientId" TEXT NOT NULL,
    "grams" DOUBLE PRECISION NOT NULL,
    "isAdded" BOOLEAN NOT NULL DEFAULT false,
    "isRemoved" BOOLEAN NOT NULL DEFAULT false,
    "isChecked" BOOLEAN NOT NULL DEFAULT false,
    "position" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "SavedRecipeIngredient_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MealPlan" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "weekStart" DATE NOT NULL,
    "targetKcal" INTEGER NOT NULL,
    "targetProtein" INTEGER NOT NULL,
    "targetCarbs" INTEGER NOT NULL,
    "targetFat" INTEGER NOT NULL,
    "budgetCents" INTEGER NOT NULL,
    "estimatedCostCents" INTEGER NOT NULL,
    "seed" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MealPlan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MealPlanEntry" (
    "id" TEXT NOT NULL,
    "planId" TEXT NOT NULL,
    "dayIndex" INTEGER NOT NULL,
    "mealType" "MealType" NOT NULL,
    "slot" INTEGER NOT NULL DEFAULT 0,
    "recipeId" TEXT NOT NULL,
    "savedRecipeId" TEXT,
    "servingFactor" DOUBLE PRECISION NOT NULL,
    "locked" BOOLEAN NOT NULL DEFAULT false,
    "eaten" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "MealPlanEntry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ShoppingListItem" (
    "id" TEXT NOT NULL,
    "planId" TEXT NOT NULL,
    "ingredientId" TEXT NOT NULL,
    "grams" DOUBLE PRECISION NOT NULL,
    "packages" INTEGER NOT NULL,
    "costCents" INTEGER NOT NULL,
    "checked" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "ShoppingListItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FoodLogEntry" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "mealType" "MealType" NOT NULL,
    "source" "LogSource" NOT NULL,
    "refId" TEXT,
    "planEntryId" TEXT,
    "title" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "amountUnit" TEXT NOT NULL,
    "kcal" DOUBLE PRECISION NOT NULL,
    "protein" DOUBLE PRECISION NOT NULL,
    "carbs" DOUBLE PRECISION NOT NULL,
    "fat" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FoodLogEntry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LoginAttempt" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LoginAttempt_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "SportActivity_userId_idx" ON "SportActivity"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "WeightLog_userId_date_key" ON "WeightLog"("userId", "date");

-- CreateIndex
CREATE UNIQUE INDEX "Supermarket_name_key" ON "Supermarket"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Ingredient_name_key" ON "Ingredient"("name");

-- CreateIndex
CREATE INDEX "Ingredient_category_idx" ON "Ingredient"("category");

-- CreateIndex
CREATE UNIQUE INDEX "Recipe_slug_key" ON "Recipe"("slug");

-- CreateIndex
CREATE INDEX "Recipe_mealType_baseType_idx" ON "Recipe"("mealType", "baseType");

-- CreateIndex
CREATE INDEX "RecipeIngredient_recipeId_idx" ON "RecipeIngredient"("recipeId");

-- CreateIndex
CREATE UNIQUE INDEX "SavedRecipe_userId_recipeId_key" ON "SavedRecipe"("userId", "recipeId");

-- CreateIndex
CREATE INDEX "SavedRecipeIngredient_savedRecipeId_idx" ON "SavedRecipeIngredient"("savedRecipeId");

-- CreateIndex
CREATE UNIQUE INDEX "MealPlan_userId_weekStart_key" ON "MealPlan"("userId", "weekStart");

-- CreateIndex
CREATE INDEX "MealPlanEntry_planId_dayIndex_idx" ON "MealPlanEntry"("planId", "dayIndex");

-- CreateIndex
CREATE UNIQUE INDEX "ShoppingListItem_planId_ingredientId_key" ON "ShoppingListItem"("planId", "ingredientId");

-- CreateIndex
CREATE INDEX "FoodLogEntry_userId_date_idx" ON "FoodLogEntry"("userId", "date");

-- CreateIndex
CREATE INDEX "LoginAttempt_key_createdAt_idx" ON "LoginAttempt"("key", "createdAt");

-- AddForeignKey
ALTER TABLE "Profile" ADD CONSTRAINT "Profile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Profile" ADD CONSTRAINT "Profile_supermarketId_fkey" FOREIGN KEY ("supermarketId") REFERENCES "Supermarket"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SportActivity" ADD CONSTRAINT "SportActivity_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WeightLog" ADD CONSTRAINT "WeightLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserIngredientPrice" ADD CONSTRAINT "UserIngredientPrice_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserIngredientPrice" ADD CONSTRAINT "UserIngredientPrice_ingredientId_fkey" FOREIGN KEY ("ingredientId") REFERENCES "Ingredient"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FavoriteIngredient" ADD CONSTRAINT "FavoriteIngredient_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FavoriteIngredient" ADD CONSTRAINT "FavoriteIngredient_ingredientId_fkey" FOREIGN KEY ("ingredientId") REFERENCES "Ingredient"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RecipeIngredient" ADD CONSTRAINT "RecipeIngredient_recipeId_fkey" FOREIGN KEY ("recipeId") REFERENCES "Recipe"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RecipeIngredient" ADD CONSTRAINT "RecipeIngredient_ingredientId_fkey" FOREIGN KEY ("ingredientId") REFERENCES "Ingredient"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SavedRecipe" ADD CONSTRAINT "SavedRecipe_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SavedRecipe" ADD CONSTRAINT "SavedRecipe_recipeId_fkey" FOREIGN KEY ("recipeId") REFERENCES "Recipe"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SavedRecipeIngredient" ADD CONSTRAINT "SavedRecipeIngredient_savedRecipeId_fkey" FOREIGN KEY ("savedRecipeId") REFERENCES "SavedRecipe"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SavedRecipeIngredient" ADD CONSTRAINT "SavedRecipeIngredient_ingredientId_fkey" FOREIGN KEY ("ingredientId") REFERENCES "Ingredient"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MealPlan" ADD CONSTRAINT "MealPlan_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MealPlanEntry" ADD CONSTRAINT "MealPlanEntry_planId_fkey" FOREIGN KEY ("planId") REFERENCES "MealPlan"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MealPlanEntry" ADD CONSTRAINT "MealPlanEntry_recipeId_fkey" FOREIGN KEY ("recipeId") REFERENCES "Recipe"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MealPlanEntry" ADD CONSTRAINT "MealPlanEntry_savedRecipeId_fkey" FOREIGN KEY ("savedRecipeId") REFERENCES "SavedRecipe"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ShoppingListItem" ADD CONSTRAINT "ShoppingListItem_planId_fkey" FOREIGN KEY ("planId") REFERENCES "MealPlan"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ShoppingListItem" ADD CONSTRAINT "ShoppingListItem_ingredientId_fkey" FOREIGN KEY ("ingredientId") REFERENCES "Ingredient"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FoodLogEntry" ADD CONSTRAINT "FoodLogEntry_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
