"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/lib/db";
import { dateFromISO, todayISO } from "@/lib/dates";
import { MEAL_TYPES } from "@/lib/labels";
import { scaleMacros, sumIngredients } from "@/lib/nutrition/calc";
import { requireUser } from "@/server/auth";

const baseSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  mealType: z.enum(MEAL_TYPES),
});

function revalidateLog() {
  revalidatePath("/heute");
  revalidatePath("/tagebuch");
  revalidatePath("/plan");
}

export interface LogResult {
  ok?: boolean;
  error?: string;
}

/** Rezept (Original oder gespeicherte Version) als gegessen eintragen. */
export async function logRecipeAction(_: LogResult, formData: FormData): Promise<LogResult> {
  const user = await requireUser();
  const parsed = baseSchema
    .extend({
      source: z.enum(["RECIPE", "SAVED_RECIPE"]),
      refId: z.string().min(1),
      servings: z.coerce.number().min(0.25).max(10),
    })
    .safeParse({
      date: formData.get("date") || todayISO(),
      mealType: formData.get("mealType"),
      source: formData.get("source"),
      refId: formData.get("refId"),
      servings: formData.get("servings"),
    });
  if (!parsed.success) return { error: "Bitte prüfe deine Eingaben." };
  const { date, mealType, source, refId, servings } = parsed.data;

  let title: string;
  let perServing;
  if (source === "SAVED_RECIPE") {
    const saved = await db.savedRecipe.findFirst({
      where: { id: refId, userId: user.id },
      include: { recipe: true, ingredients: { where: { isRemoved: false }, include: { ingredient: true } } },
    });
    if (!saved) return { error: "Rezept nicht gefunden." };
    title = saved.recipe.title;
    perServing = scaleMacros(sumIngredients(saved.ingredients), 1 / saved.servings);
  } else {
    const recipe = await db.recipe.findUnique({ where: { id: refId }, include: { ingredients: { include: { ingredient: true } } } });
    if (!recipe) return { error: "Rezept nicht gefunden." };
    title = recipe.title;
    perServing = scaleMacros(sumIngredients(recipe.ingredients), 1 / recipe.servings);
  }
  const m = scaleMacros(perServing, servings);
  await db.foodLogEntry.create({
    data: {
      userId: user.id,
      date: dateFromISO(date),
      mealType,
      source,
      refId,
      title,
      amount: servings,
      amountUnit: servings === 1 ? "Portion" : "Portionen",
      kcal: m.kcal,
      protein: m.protein,
      carbs: m.carbs,
      fat: m.fat,
    },
  });
  revalidateLog();
  return { ok: true };
}

export async function logIngredientAction(_: LogResult, formData: FormData): Promise<LogResult> {
  const user = await requireUser();
  const parsed = baseSchema
    .extend({ ingredientId: z.string().min(1), grams: z.coerce.number().min(1).max(5000) })
    .safeParse({
      date: formData.get("date") || todayISO(),
      mealType: formData.get("mealType"),
      ingredientId: formData.get("ingredientId"),
      grams: formData.get("grams"),
    });
  if (!parsed.success) return { error: "Bitte wähle ein Lebensmittel und eine Menge." };
  const { date, mealType, ingredientId, grams } = parsed.data;
  const ing = await db.ingredient.findUnique({ where: { id: ingredientId } });
  if (!ing) return { error: "Lebensmittel nicht gefunden." };
  const f = grams / 100;
  await db.foodLogEntry.create({
    data: {
      userId: user.id,
      date: dateFromISO(date),
      mealType,
      source: "INGREDIENT",
      refId: ing.id,
      title: ing.name,
      amount: grams,
      amountUnit: "g",
      kcal: ing.kcal * f,
      protein: ing.protein * f,
      carbs: ing.carbs * f,
      fat: ing.fat * f,
    },
  });
  revalidateLog();
  return { ok: true };
}

export async function deleteLogEntryAction(formData: FormData) {
  const user = await requireUser();
  const id = String(formData.get("id") ?? "");
  const entry = await db.foodLogEntry.findFirst({ where: { id, userId: user.id } });
  if (!entry) return;
  await db.foodLogEntry.delete({ where: { id: entry.id } });
  if (entry.planEntryId) {
    await db.mealPlanEntry.updateMany({ where: { id: entry.planEntryId, plan: { userId: user.id } }, data: { eaten: false } });
  }
  revalidateLog();
}

/** Plan-Mahlzeit als gegessen markieren (legt Tagebuch-Eintrag an) oder wieder entfernen. */
export async function togglePlanEntryEatenAction(formData: FormData) {
  const user = await requireUser();
  const entryId = String(formData.get("entryId") ?? "");
  const date = String(formData.get("date") ?? todayISO());
  const entry = await db.mealPlanEntry.findFirst({
    where: { id: entryId, plan: { userId: user.id } },
    include: {
      recipe: { include: { ingredients: { include: { ingredient: true } } } },
      savedRecipe: { include: { ingredients: { where: { isRemoved: false }, include: { ingredient: true } } } },
    },
  });
  if (!entry) return;

  if (entry.eaten) {
    await db.$transaction([
      db.foodLogEntry.deleteMany({ where: { userId: user.id, planEntryId: entry.id } }),
      db.mealPlanEntry.update({ where: { id: entry.id }, data: { eaten: false } }),
    ]);
  } else {
    const perServing = entry.savedRecipe
      ? scaleMacros(sumIngredients(entry.savedRecipe.ingredients), 1 / entry.savedRecipe.servings)
      : scaleMacros(sumIngredients(entry.recipe.ingredients), 1 / entry.recipe.servings);
    const m = scaleMacros(perServing, entry.servingFactor);
    await db.$transaction([
      db.foodLogEntry.create({
        data: {
          userId: user.id,
          date: dateFromISO(/^\d{4}-\d{2}-\d{2}$/.test(date) ? date : todayISO()),
          mealType: entry.mealType,
          source: entry.savedRecipe ? "SAVED_RECIPE" : "RECIPE",
          refId: entry.savedRecipeId ?? entry.recipeId,
          planEntryId: entry.id,
          title: entry.recipe.title,
          amount: entry.servingFactor,
          amountUnit: entry.servingFactor === 1 ? "Portion" : "Portionen",
          kcal: m.kcal,
          protein: m.protein,
          carbs: m.carbs,
          fat: m.fat,
        },
      }),
      db.mealPlanEntry.update({ where: { id: entry.id }, data: { eaten: true } }),
    ]);
  }
  revalidateLog();
}
