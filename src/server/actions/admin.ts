"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { db } from "@/lib/db";
import { ALLERGENS, BASE_TYPES, MEAL_TYPES } from "@/lib/labels";
import { requireAdmin } from "@/server/auth";

export interface AdminState {
  ok?: string;
  error?: string;
}

const recipeSchema = z.object({
  id: z.string().optional(),
  title: z.string().trim().min(3).max(120),
  description: z.string().trim().min(3).max(400),
  mealType: z.enum(MEAL_TYPES),
  baseType: z.enum(BASE_TYPES),
  servings: z.number().int().min(1).max(12),
  prepMinutes: z.number().int().min(1).max(600),
  tags: z.array(z.string().trim().min(1).max(30)).max(10),
  steps: z.array(z.string().trim().min(1).max(600)).min(1).max(30),
  published: z.boolean(),
  ingredients: z
    .array(z.object({ ingredientId: z.string().min(1), grams: z.number().min(0.5).max(5000) }))
    .min(1, "Mindestens eine Zutat"),
});

export type AdminRecipeInput = z.infer<typeof recipeSchema>;

function slugify(s: string) {
  return s
    .toLowerCase()
    .replace(/ä/g, "ae")
    .replace(/ö/g, "oe")
    .replace(/ü/g, "ue")
    .replace(/ß/g, "ss")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

export async function saveRecipeAdminAction(raw: AdminRecipeInput): Promise<AdminState> {
  await requireAdmin();
  const parsed = recipeSchema.safeParse(raw);
  if (!parsed.success) {
    const i = parsed.error.issues[0];
    return { error: `${i.path.join(".")}: ${i.message}` };
  }
  const { id, ingredients, ...data } = parsed.data;

  let recipeId = id;
  if (recipeId) {
    await db.$transaction([
      db.recipe.update({ where: { id: recipeId }, data }),
      db.recipeIngredient.deleteMany({ where: { recipeId } }),
      db.recipeIngredient.createMany({ data: ingredients.map((i, position) => ({ ...i, recipeId: recipeId!, position })) }),
    ]);
  } else {
    let slug = slugify(data.title) || "rezept";
    if (await db.recipe.findUnique({ where: { slug } })) slug = `${slug}-${Date.now().toString(36)}`;
    const created = await db.recipe.create({
      data: { ...data, slug, ingredients: { create: ingredients.map((i, position) => ({ ...i, position })) } },
    });
    recipeId = created.id;
  }
  revalidatePath("/rezepte");
  revalidatePath("/admin/rezepte");
  redirect(`/admin/rezepte?gespeichert=${recipeId}`);
}

export async function deleteRecipeAdminAction(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");
  // Rezepte mit Nutzerbezug werden nur versteckt, damit Plaene und Gespeichertes nicht verloren gehen.
  const inUse = await db.recipe.findFirst({ where: { id, OR: [{ saved: { some: {} } }, { planEntries: { some: {} } }] } });
  if (inUse) await db.recipe.update({ where: { id }, data: { published: false } });
  else await db.recipe.delete({ where: { id } });
  revalidatePath("/admin/rezepte");
  revalidatePath("/rezepte");
  redirect("/admin/rezepte");
}

const ingredientSchema = z.object({
  id: z.string().optional(),
  name: z.string().trim().min(2).max(80),
  category: z.string().trim().min(2).max(60),
  kcal: z.coerce.number().min(0).max(1000),
  protein: z.coerce.number().min(0).max(100),
  carbs: z.coerce.number().min(0).max(100),
  fat: z.coerce.number().min(0).max(100),
  fiber: z.coerce.number().min(0).max(100),
  pricePer100gCents: z.coerce.number().min(0).max(10000),
  packageGrams: z.coerce.number().int().min(1).max(25000),
  unitName: z.string().trim().max(30).optional(),
  gramsPerUnit: z.coerce.number().min(0).max(5000).optional(),
  allergens: z.array(z.enum(ALLERGENS)),
});

function num(v: FormDataEntryValue | null) {
  return String(v ?? "").replace(",", ".");
}

export async function saveIngredientAdminAction(_: AdminState, formData: FormData): Promise<AdminState> {
  await requireAdmin();
  const parsed = ingredientSchema.safeParse({
    id: formData.get("id") || undefined,
    name: formData.get("name"),
    category: formData.get("category"),
    kcal: num(formData.get("kcal")),
    protein: num(formData.get("protein")),
    carbs: num(formData.get("carbs")),
    fat: num(formData.get("fat")),
    fiber: num(formData.get("fiber")) || "0",
    pricePer100gCents: num(formData.get("pricePer100gCents")),
    packageGrams: num(formData.get("packageGrams")),
    unitName: formData.get("unitName") || undefined,
    gramsPerUnit: num(formData.get("gramsPerUnit")) || undefined,
    allergens: formData.getAll("allergens"),
  });
  if (!parsed.success) {
    const i = parsed.error.issues[0];
    return { error: `${String(i.path[0])}: ${i.message}` };
  }
  const { id, unitName, gramsPerUnit, ...data } = parsed.data;
  const full = { ...data, unitName: unitName || null, gramsPerUnit: unitName && gramsPerUnit ? gramsPerUnit : null };
  const dupe = await db.ingredient.findUnique({ where: { name: data.name } });
  if (dupe && dupe.id !== id) return { error: "Eine Zutat mit diesem Namen existiert bereits." };
  if (id) await db.ingredient.update({ where: { id }, data: full });
  else await db.ingredient.create({ data: full });
  revalidatePath("/admin/zutaten");
  return { ok: id ? "Zutat aktualisiert." : "Zutat angelegt." };
}

export async function saveSupermarketAdminAction(formData: FormData) {
  await requireAdmin();
  const parsed = z
    .object({ id: z.string().optional(), name: z.string().trim().min(2).max(60), priceFactor: z.coerce.number().min(0.3).max(3) })
    .safeParse({ id: formData.get("id") || undefined, name: formData.get("name"), priceFactor: num(formData.get("priceFactor")) });
  if (!parsed.success) return;
  const { id, ...data } = parsed.data;
  if (id) await db.supermarket.update({ where: { id }, data });
  else await db.supermarket.upsert({ where: { name: data.name }, update: data, create: data });
  revalidatePath("/admin/supermaerkte");
}
