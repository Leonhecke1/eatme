import "server-only";
import { db } from "@/lib/db";
import { addDays, dateFromISO } from "@/lib/dates";
import { roundMacros, scaleMacros, sumIngredients, type Macros } from "@/lib/nutrition/calc";
import { costForGrams } from "@/lib/pricing";
import { loadUserContext } from "@/server/context";
import { loadRecipeBook } from "@/server/plan";

export interface PlanEntryView {
  id: string;
  dayIndex: number;
  slot: number;
  date: string;
  mealType: "FRUEHSTUECK" | "MITTAG" | "ABEND" | "SNACK";
  title: string;
  slug: string;
  baseType: string;
  savedRecipeId: string | null;
  servingFactor: number;
  locked: boolean;
  eaten: boolean;
  macros: Macros;
  costCents: number;
}

/** Plan einer Woche inkl. Naehrwerten je Eintrag (auf Basis der Nutzer-Rezeptversionen). */
export async function loadPlanView(userId: string, weekStart: string) {
  const plan = await db.mealPlan.findUnique({
    where: { userId_weekStart: { userId, weekStart: dateFromISO(weekStart) } },
    include: {
      entries: { orderBy: [{ dayIndex: "asc" }, { slot: "asc" }], include: { recipe: { select: { title: true, slug: true, baseType: true } } } },
    },
  });
  if (!plan) return null;
  const [ctx, { book, ingredients }] = await Promise.all([loadUserContext(userId), loadRecipeBook(userId)]);
  const ingMap = new Map(ingredients.map((i) => [i.id, i]));

  const entries: PlanEntryView[] = plan.entries.map((e) => {
    const r = book.get(e.recipeId);
    const rows = (r?.ingredients ?? [])
      .map((ri) => ({ grams: ri.grams, ingredient: ingMap.get(ri.ingredientId)! }))
      .filter((x) => x.ingredient);
    const servings = r?.servings ?? 1;
    const factor = e.servingFactor / servings;
    const cost = rows.reduce((s, x) => s + costForGrams(ctx.priceOf(x.ingredient), x.grams), 0) * factor;
    return {
      id: e.id,
      dayIndex: e.dayIndex,
      slot: e.slot,
      date: addDays(weekStart, e.dayIndex),
      mealType: e.mealType,
      title: e.recipe.title,
      slug: e.recipe.slug,
      baseType: e.recipe.baseType,
      savedRecipeId: e.savedRecipeId,
      servingFactor: e.servingFactor,
      locked: e.locked,
      eaten: e.eaten,
      macros: roundMacros(scaleMacros(sumIngredients(rows), factor)),
      costCents: Math.round(cost),
    };
  });

  return { plan, entries, ctx };
}
