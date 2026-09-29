"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireUser } from "@/server/auth";
import { rebuildShoppingList } from "@/server/plan";

async function ownedSaved(userId: string, savedRecipeId: string) {
  const saved = await db.savedRecipe.findFirst({ where: { id: savedRecipeId, userId }, select: { id: true, recipeId: true } });
  if (!saved) throw new Error("Nicht gefunden");
  return saved;
}

async function ownedItem(userId: string, itemId: string) {
  const item = await db.savedRecipeIngredient.findFirst({
    where: { id: itemId, savedRecipe: { userId } },
    select: { id: true, isAdded: true, isRemoved: true, isChecked: true, savedRecipeId: true },
  });
  if (!item) throw new Error("Nicht gefunden");
  return item;
}

/** Plaene, die dieses gespeicherte Rezept nutzen, brauchen eine neue Einkaufsliste. */
async function refreshPlansUsing(userId: string, savedRecipeId: string) {
  const plans = await db.mealPlan.findMany({
    where: { userId, entries: { some: { savedRecipeId } } },
    select: { id: true },
  });
  for (const p of plans) await rebuildShoppingList(userId, p.id);
}

export async function saveRecipeAction(formData: FormData) {
  const user = await requireUser();
  const recipeId = String(formData.get("recipeId") ?? "");
  const recipe = await db.recipe.findUnique({ where: { id: recipeId }, include: { ingredients: true } });
  if (!recipe) return;
  const existing = await db.savedRecipe.findUnique({ where: { userId_recipeId: { userId: user.id, recipeId } } });
  if (existing) redirect(`/gespeichert/${existing.id}`);

  const saved = await db.savedRecipe.create({
    data: {
      userId: user.id,
      recipeId,
      servings: recipe.servings,
      ingredients: {
        create: recipe.ingredients.map((ri) => ({ ingredientId: ri.ingredientId, grams: ri.grams, position: ri.position })),
      },
    },
  });
  // Laufende Plaene sollen ab jetzt die eigene Version verwenden.
  await db.mealPlanEntry.updateMany({ where: { recipeId, plan: { userId: user.id } }, data: { savedRecipeId: saved.id } });
  revalidatePath("/rezepte");
  revalidatePath("/gespeichert");
  if (formData.get("stay") === "1") return;
  redirect(`/gespeichert/${saved.id}`);
}

export async function unsaveRecipeAction(formData: FormData) {
  const user = await requireUser();
  const id = String(formData.get("savedRecipeId") ?? "");
  const saved = await ownedSaved(user.id, id);
  const plans = await db.mealPlan.findMany({ where: { userId: user.id, entries: { some: { savedRecipeId: id } } }, select: { id: true } });
  await db.savedRecipe.delete({ where: { id: saved.id } });
  for (const p of plans) await rebuildShoppingList(user.id, p.id);
  revalidatePath("/gespeichert");
  revalidatePath("/rezepte");
  if (formData.get("redirect") === "1") redirect("/gespeichert");
}

export async function toggleCheckedAction(itemId: string) {
  const user = await requireUser();
  const item = await ownedItem(user.id, itemId);
  await db.savedRecipeIngredient.update({ where: { id: item.id }, data: { isChecked: !item.isChecked } });
}

export async function toggleRemovedAction(itemId: string) {
  const user = await requireUser();
  const item = await ownedItem(user.id, itemId);
  await db.savedRecipeIngredient.update({ where: { id: item.id }, data: { isRemoved: !item.isRemoved, isChecked: false } });
  await refreshPlansUsing(user.id, item.savedRecipeId);
}

export async function updateGramsAction(itemId: string, grams: number) {
  const user = await requireUser();
  const g = z.number().min(0.5).max(5000).safeParse(grams);
  if (!g.success) return;
  const item = await ownedItem(user.id, itemId);
  await db.savedRecipeIngredient.update({ where: { id: item.id }, data: { grams: g.data } });
  await refreshPlansUsing(user.id, item.savedRecipeId);
}

export async function deleteAddedItemAction(itemId: string) {
  const user = await requireUser();
  const item = await ownedItem(user.id, itemId);
  if (!item.isAdded) return;
  await db.savedRecipeIngredient.delete({ where: { id: item.id } });
  await refreshPlansUsing(user.id, item.savedRecipeId);
}

export async function addIngredientAction(savedRecipeId: string, ingredientId: string, grams: number): Promise<string | null> {
  const user = await requireUser();
  const saved = await ownedSaved(user.id, savedRecipeId);
  const parsed = z.number().min(0.5).max(5000).safeParse(grams);
  const ingredient = await db.ingredient.findUnique({ where: { id: ingredientId }, select: { id: true } });
  if (!parsed.success || !ingredient) return null;
  const max = await db.savedRecipeIngredient.aggregate({ where: { savedRecipeId: saved.id }, _max: { position: true } });
  const item = await db.savedRecipeIngredient.create({
    data: { savedRecipeId: saved.id, ingredientId, grams: parsed.data, isAdded: true, position: (max._max.position ?? 0) + 1 },
  });
  await refreshPlansUsing(user.id, saved.id);
  return item.id;
}

export async function updateSavedMetaAction(savedRecipeId: string, patch: { servings?: number; note?: string }) {
  const user = await requireUser();
  const saved = await ownedSaved(user.id, savedRecipeId);
  const data: { servings?: number; note?: string | null } = {};
  if (patch.servings !== undefined) {
    const s = z.number().int().min(1).max(12).safeParse(patch.servings);
    if (!s.success) return;
    data.servings = s.data;
  }
  if (patch.note !== undefined) data.note = patch.note.slice(0, 1000) || null;
  await db.savedRecipe.update({ where: { id: saved.id }, data });
  if (data.servings !== undefined) await refreshPlansUsing(user.id, saved.id);
}

export async function resetChecksAction(savedRecipeId: string) {
  const user = await requireUser();
  const saved = await ownedSaved(user.id, savedRecipeId);
  await db.savedRecipeIngredient.updateMany({ where: { savedRecipeId: saved.id }, data: { isChecked: false } });
}

export async function resetToOriginalAction(formData: FormData) {
  const user = await requireUser();
  const saved = await ownedSaved(user.id, String(formData.get("savedRecipeId") ?? ""));
  const recipe = await db.recipe.findUnique({ where: { id: saved.recipeId }, include: { ingredients: true } });
  if (!recipe) return;
  await db.$transaction([
    db.savedRecipeIngredient.deleteMany({ where: { savedRecipeId: saved.id } }),
    db.savedRecipeIngredient.createMany({
      data: recipe.ingredients.map((ri) => ({ savedRecipeId: saved.id, ingredientId: ri.ingredientId, grams: ri.grams, position: ri.position })),
    }),
    db.savedRecipe.update({ where: { id: saved.id }, data: { servings: recipe.servings } }),
  ]);
  await refreshPlansUsing(user.id, saved.id);
  revalidatePath(`/gespeichert/${saved.id}`);
}
