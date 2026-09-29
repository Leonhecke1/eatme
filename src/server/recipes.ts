import "server-only";
import type { Prisma } from "@/generated/prisma/client";
import { db } from "@/lib/db";
import { roundMacros, scaleMacros, sumIngredients } from "@/lib/nutrition/calc";
import { costForGrams } from "@/lib/pricing";
import type { UserContext } from "@/server/context";

export interface RecipeFilters {
  q?: string;
  basis?: string;
  mahlzeit?: string;
  zeit?: number;
  tag?: string;
}

const ingredientSelect = {
  id: true,
  name: true,
  category: true,
  kcal: true,
  protein: true,
  carbs: true,
  fat: true,
  fiber: true,
  pricePer100gCents: true,
  packageGrams: true,
  unitName: true,
  gramsPerUnit: true,
  allergens: true,
} as const;

export type IngredientRow = Prisma.IngredientGetPayload<{ select: typeof ingredientSelect }>;

export function summarize(
  items: { grams: number; ingredient: IngredientRow }[],
  servings: number,
  ctx: Pick<UserContext, "priceOf">,
) {
  const total = sumIngredients(items);
  const perServing = roundMacros(scaleMacros(total, 1 / Math.max(1, servings)));
  const costTotal = items.reduce((s, it) => s + costForGrams(ctx.priceOf(it.ingredient), it.grams), 0);
  const allergens = [...new Set(items.flatMap((it) => it.ingredient.allergens))];
  return { perServing, costPerServing: Math.round(costTotal / Math.max(1, servings)), costTotal: Math.round(costTotal), allergens };
}

export async function listRecipes(userId: string, ctx: UserContext, filters: RecipeFilters) {
  const where: Prisma.RecipeWhereInput = { published: true };
  if (filters.q) where.title = { contains: filters.q, mode: "insensitive" };
  if (filters.basis) where.baseType = filters.basis as Prisma.RecipeWhereInput["baseType"];
  if (filters.mahlzeit) where.mealType = filters.mahlzeit as Prisma.RecipeWhereInput["mealType"];
  if (filters.zeit) where.prepMinutes = { lte: filters.zeit };
  if (filters.tag) where.tags = { has: filters.tag };

  const [recipes, saved] = await Promise.all([
    db.recipe.findMany({
      where,
      orderBy: { title: "asc" },
      include: { ingredients: { include: { ingredient: { select: ingredientSelect } } } },
    }),
    db.savedRecipe.findMany({ where: { userId }, select: { id: true, recipeId: true } }),
  ]);
  const savedMap = new Map(saved.map((s) => [s.recipeId, s.id]));
  return recipes.map((r) => ({
    id: r.id,
    slug: r.slug,
    title: r.title,
    description: r.description,
    mealType: r.mealType,
    baseType: r.baseType,
    prepMinutes: r.prepMinutes,
    tags: r.tags,
    savedId: savedMap.get(r.id) ?? null,
    ...summarize(r.ingredients, r.servings, ctx),
  }));
}

export type RecipeSummary = Awaited<ReturnType<typeof listRecipes>>[number];

export async function getRecipeBySlug(slug: string) {
  return db.recipe.findUnique({
    where: { slug },
    include: { ingredients: { orderBy: { position: "asc" }, include: { ingredient: { select: ingredientSelect } } } },
  });
}

export async function getSavedRecipe(userId: string, id: string) {
  return db.savedRecipe.findFirst({
    where: { id, userId },
    include: {
      recipe: true,
      ingredients: { orderBy: { position: "asc" }, include: { ingredient: { select: ingredientSelect } } },
    },
  });
}

export async function allIngredientsForPicker() {
  return db.ingredient.findMany({ select: ingredientSelect, orderBy: { name: "asc" } });
}
