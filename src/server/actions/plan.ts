"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/lib/db";
import { isISODate, todayISO, weekStartISO } from "@/lib/dates";
import { requireUser } from "@/server/auth";
import { generateWeekPlan, rebuildShoppingList, swapPlanEntry } from "@/server/plan";

function revalidatePlan() {
  revalidatePath("/plan");
  revalidatePath("/plan/einkaufsliste");
  revalidatePath("/heute");
}

export async function generatePlanAction(formData: FormData) {
  const user = await requireUser();
  const week = String(formData.get("weekStart") ?? "");
  const weekStart = weekStartISO(isISODate(week) ? week : todayISO());
  await generateWeekPlan(user.id, weekStart, { keepLocked: formData.get("keepLocked") === "1" });
  revalidatePlan();
}

export async function swapEntryAction(formData: FormData) {
  const user = await requireUser();
  await swapPlanEntry(user.id, String(formData.get("entryId") ?? ""));
  revalidatePlan();
}

export async function toggleLockAction(formData: FormData) {
  const user = await requireUser();
  const entry = await db.mealPlanEntry.findFirst({ where: { id: String(formData.get("entryId") ?? ""), plan: { userId: user.id } } });
  if (!entry) return;
  await db.mealPlanEntry.update({ where: { id: entry.id }, data: { locked: !entry.locked } });
  revalidatePlan();
}

export async function changeServingAction(formData: FormData) {
  const user = await requireUser();
  const delta = Number(formData.get("delta"));
  if (![0.25, -0.25].includes(delta)) return;
  const entry = await db.mealPlanEntry.findFirst({ where: { id: String(formData.get("entryId") ?? ""), plan: { userId: user.id } } });
  if (!entry) return;
  const next = Math.min(4, Math.max(0.25, entry.servingFactor + delta));
  await db.mealPlanEntry.update({ where: { id: entry.id }, data: { servingFactor: next } });
  await rebuildShoppingList(user.id, entry.planId);
  revalidatePlan();
}

export async function toggleShoppingItemAction(itemId: string) {
  const user = await requireUser();
  const item = await db.shoppingListItem.findFirst({ where: { id: itemId, plan: { userId: user.id } } });
  if (!item) return;
  await db.shoppingListItem.update({ where: { id: item.id }, data: { checked: !item.checked } });
}

export async function uncheckAllShoppingAction(formData: FormData) {
  const user = await requireUser();
  await db.shoppingListItem.updateMany({
    where: { planId: String(formData.get("planId") ?? ""), plan: { userId: user.id } },
    data: { checked: false },
  });
  revalidatePath("/plan/einkaufsliste");
}

const priceSchema = z.object({
  ingredientId: z.string().min(1),
  packagePrice: z.coerce.number().min(0.01).max(500),
});

/** Eigener Preis: Eingabe als Packungspreis in Euro, gespeichert als Cent pro 100 g. */
export async function setPriceOverrideAction(formData: FormData) {
  const user = await requireUser();
  const parsed = priceSchema.safeParse({
    ingredientId: formData.get("ingredientId"),
    packagePrice: String(formData.get("packagePrice") ?? "").replace(",", "."),
  });
  if (!parsed.success) return;
  const ing = await db.ingredient.findUnique({ where: { id: parsed.data.ingredientId } });
  if (!ing) return;
  const pricePer100gCents = (parsed.data.packagePrice * 100 * 100) / ing.packageGrams;
  await db.userIngredientPrice.upsert({
    where: { userId_ingredientId: { userId: user.id, ingredientId: ing.id } },
    update: { pricePer100gCents },
    create: { userId: user.id, ingredientId: ing.id, pricePer100gCents },
  });
  await rebuildCurrentPlans(user.id);
  revalidatePlan();
}

export async function resetPriceOverrideAction(formData: FormData) {
  const user = await requireUser();
  await db.userIngredientPrice.deleteMany({ where: { userId: user.id, ingredientId: String(formData.get("ingredientId") ?? "") } });
  await rebuildCurrentPlans(user.id);
  revalidatePlan();
}

async function rebuildCurrentPlans(userId: string) {
  const plans = await db.mealPlan.findMany({
    where: { userId, weekStart: { gte: new Date(`${weekStartISO(todayISO())}T00:00:00.000Z`) } },
    select: { id: true },
  });
  for (const p of plans) await rebuildShoppingList(userId, p.id);
}
