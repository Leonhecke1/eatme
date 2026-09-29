import "server-only";
import { db } from "@/lib/db";
import { dateFromISO } from "@/lib/dates";
import {
  generatePlan,
  suggestReplacement,
  type PlanEntry,
  type PlannerIngredient,
  type PlannerInput,
  type PlannerRecipe,
} from "@/lib/planner/generate";
import { buildShoppingList } from "@/lib/planner/shopping";
import { loadUserContext, type UserContext } from "@/server/context";

export interface BookRecipe extends PlannerRecipe {
  savedRecipeId: string | null;
}

/** Rezepte aus Sicht des Nutzers: gespeicherte Versionen ersetzen das Original. */
export async function loadRecipeBook(userId: string) {
  const [recipes, saved, ingredients] = await Promise.all([
    db.recipe.findMany({
      where: { published: true },
      select: {
        id: true,
        mealType: true,
        baseType: true,
        servings: true,
        ingredients: { select: { ingredientId: true, grams: true } },
      },
    }),
    db.savedRecipe.findMany({
      where: { userId },
      select: {
        id: true,
        recipeId: true,
        servings: true,
        ingredients: { where: { isRemoved: false }, select: { ingredientId: true, grams: true } },
      },
    }),
    db.ingredient.findMany(),
  ]);
  const savedByRecipe = new Map(saved.map((s) => [s.recipeId, s]));
  const book = new Map<string, BookRecipe>();
  for (const r of recipes) {
    const s = savedByRecipe.get(r.id);
    book.set(r.id, {
      id: r.id,
      mealType: r.mealType,
      baseType: r.baseType,
      servings: s ? s.servings : r.servings,
      ingredients: s ? s.ingredients : r.ingredients,
      savedRecipeId: s?.id ?? null,
    });
  }
  return { book, ingredients };
}

function plannerIngredients(ingredients: Awaited<ReturnType<typeof loadRecipeBook>>["ingredients"], ctx: UserContext) {
  return new Map<string, PlannerIngredient>(
    ingredients.map((i) => [
      i.id,
      { id: i.id, kcal: i.kcal, protein: i.protein, carbs: i.carbs, fat: i.fat, price: ctx.priceOf(i), allergens: i.allergens },
    ]),
  );
}

async function plannerInput(userId: string, seed: number, locked: PlanEntry[] = []) {
  const ctx = await loadUserContext(userId);
  const { book, ingredients } = await loadRecipeBook(userId);
  const input: PlannerInput = {
    recipes: [...book.values()],
    ingredients: plannerIngredients(ingredients, ctx),
    targetKcal: ctx.energy.target,
    goal: ctx.profile.goal,
    mealsPerDay: ctx.profile.mealsPerDay,
    budgetCents: ctx.profile.weeklyBudgetCents,
    favoriteIds: ctx.favoriteIds,
    dislikedIds: new Set(ctx.profile.dislikedIds),
    allergies: new Set(ctx.profile.allergies),
    preferredBases: new Set(ctx.profile.preferredBases),
    seed,
    locked,
  };
  return { ctx, book, ingredients, input };
}

export async function generateWeekPlan(userId: string, weekStart: string, opts: { keepLocked?: boolean } = {}) {
  const existing = await db.mealPlan.findUnique({
    where: { userId_weekStart: { userId, weekStart: dateFromISO(weekStart) } },
    include: { entries: true },
  });
  const locked: PlanEntry[] =
    opts.keepLocked && existing
      ? existing.entries
          .filter((e) => e.locked)
          .map((e) => ({ dayIndex: e.dayIndex, slot: e.slot, mealType: e.mealType, recipeId: e.recipeId, servingFactor: e.servingFactor, locked: true }))
      : [];
  const seed = Math.floor(Math.random() * 2 ** 31);
  const { ctx, book, input } = await plannerInput(userId, seed, locked);
  const result = generatePlan(input);

  const eatenKeys = new Set(existing?.entries.filter((e) => e.eaten).map((e) => `${e.dayIndex}-${e.slot}-${e.recipeId}`));

  const plan = await db.$transaction(async (tx) => {
    const data = {
      targetKcal: ctx.energy.target,
      targetProtein: ctx.energy.protein,
      targetCarbs: ctx.energy.carbs,
      targetFat: ctx.energy.fat,
      budgetCents: ctx.profile.weeklyBudgetCents,
      estimatedCostCents: result.costCents,
      seed,
    };
    const p = existing
      ? await tx.mealPlan.update({ where: { id: existing.id }, data })
      : await tx.mealPlan.create({ data: { userId, weekStart: dateFromISO(weekStart), ...data } });
    await tx.mealPlanEntry.deleteMany({ where: { planId: p.id } });
    await tx.mealPlanEntry.createMany({
      data: result.entries.map((e) => ({
        planId: p.id,
        dayIndex: e.dayIndex,
        slot: e.slot,
        mealType: e.mealType,
        recipeId: e.recipeId,
        savedRecipeId: book.get(e.recipeId)?.savedRecipeId ?? null,
        servingFactor: e.servingFactor,
        locked: !!e.locked,
        eaten: eatenKeys.has(`${e.dayIndex}-${e.slot}-${e.recipeId}`),
      })),
    });
    return p;
  });
  await rebuildShoppingList(userId, plan.id);
  return plan;
}

/** Einkaufsliste und Kosten aus den aktuellen Eintraegen neu berechnen (abgehakte Positionen bleiben abgehakt). */
export async function rebuildShoppingList(userId: string, planId: string) {
  const ctx = await loadUserContext(userId);
  const { book, ingredients } = await loadRecipeBook(userId);
  const [entries, previous] = await Promise.all([
    db.mealPlanEntry.findMany({ where: { planId } }),
    db.shoppingListItem.findMany({ where: { planId }, select: { ingredientId: true, checked: true } }),
  ]);
  const checked = new Set(previous.filter((p) => p.checked).map((p) => p.ingredientId));
  const lines = buildShoppingList(
    entries,
    book,
    new Map(ingredients.map((i) => [i.id, { id: i.id, price: ctx.priceOf(i), packageGrams: i.packageGrams }])),
  );
  const total = lines.reduce((s, l) => s + l.costCents, 0);
  await db.$transaction([
    db.shoppingListItem.deleteMany({ where: { planId } }),
    db.shoppingListItem.createMany({
      data: lines.map((l) => ({ planId, ...l, checked: checked.has(l.ingredientId) })),
    }),
    // Budget und Ziele folgen immer dem aktuellen Profil.
    db.mealPlan.update({
      where: { id: planId },
      data: {
        estimatedCostCents: total,
        budgetCents: ctx.profile.weeklyBudgetCents,
        targetKcal: ctx.energy.target,
        targetProtein: ctx.energy.protein,
        targetCarbs: ctx.energy.carbs,
        targetFat: ctx.energy.fat,
      },
    }),
  ]);
}

export async function swapPlanEntry(userId: string, entryId: string) {
  const entry = await db.mealPlanEntry.findFirst({ where: { id: entryId, plan: { userId } }, include: { plan: { include: { entries: true } } } });
  if (!entry) return;
  const seed = Math.floor(Math.random() * 2 ** 31);
  const { book, input } = await plannerInput(userId, seed);
  const current: PlanEntry[] = entry.plan.entries.map((e) => ({
    dayIndex: e.dayIndex,
    slot: e.slot,
    mealType: e.mealType,
    recipeId: e.recipeId,
    servingFactor: e.servingFactor,
  }));
  const target = current.find((e) => e.dayIndex === entry.dayIndex && e.slot === entry.slot)!;
  const next = suggestReplacement(input, current, target);
  if (!next) return;
  await db.mealPlanEntry.update({
    where: { id: entry.id },
    data: {
      recipeId: next.recipeId,
      savedRecipeId: book.get(next.recipeId)?.savedRecipeId ?? null,
      servingFactor: next.servingFactor,
      eaten: false,
      locked: false,
    },
  });
  await rebuildShoppingList(userId, entry.planId);
}
