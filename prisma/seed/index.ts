import "dotenv/config";
import bcrypt from "bcryptjs";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient, type Allergen } from "../../src/generated/prisma/client";
import { INGREDIENTS } from "./ingredients";
import { RECIPES } from "./recipes";

const SUPERMARKETS: [string, number][] = [
  ["Aldi", 0.85],
  ["Lidl", 0.85],
  ["Penny", 0.87],
  ["Netto", 0.87],
  ["Kaufland", 0.95],
  ["Rewe", 1.1],
  ["Edeka", 1.12],
  ["Bio-Markt (Alnatura, denn's)", 1.4],
];

const db = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }) });

async function main() {
  for (const [name, priceFactor] of SUPERMARKETS) {
    await db.supermarket.upsert({ where: { name }, update: { priceFactor }, create: { name, priceFactor } });
  }

  const ids = new Map<string, string>();
  for (const [name, category, kcal, protein, carbs, fat, fiber, price, pkg, allergens, unitName, gramsPerUnit] of INGREDIENTS) {
    const data = {
      category,
      kcal,
      protein,
      carbs,
      fat,
      fiber,
      pricePer100gCents: price,
      packageGrams: pkg,
      allergens: (allergens ?? []) as Allergen[],
      unitName: unitName ?? null,
      gramsPerUnit: gramsPerUnit ?? null,
    };
    const ing = await db.ingredient.upsert({ where: { name }, update: data, create: { name, ...data } });
    ids.set(name, ing.id);
  }

  const missing = new Set<string>();
  for (const rec of RECIPES) for (const [name] of rec.ingredients) if (!ids.has(name)) missing.add(name);
  if (missing.size > 0) throw new Error(`Unbekannte Zutaten in Rezepten: ${[...missing].join(", ")}`);

  for (const rec of RECIPES) {
    const data = {
      title: rec.title,
      description: rec.description,
      mealType: rec.mealType,
      baseType: rec.baseType,
      servings: rec.servings,
      prepMinutes: rec.prepMinutes,
      steps: rec.steps,
      tags: rec.tags,
    };
    const recipe = await db.recipe.upsert({ where: { slug: rec.slug }, update: data, create: { slug: rec.slug, ...data } });
    await db.recipeIngredient.deleteMany({ where: { recipeId: recipe.id } });
    await db.recipeIngredient.createMany({
      data: rec.ingredients.map(([name, grams, note], position) => ({
        recipeId: recipe.id,
        ingredientId: ids.get(name)!,
        grams,
        note: note ?? null,
        position,
      })),
    });
  }

  const adminEmail = process.env.ADMIN_EMAIL?.toLowerCase().trim();
  const adminPassword = process.env.ADMIN_PASSWORD;
  if (adminEmail && adminPassword) {
    const passwordHash = await bcrypt.hash(adminPassword, 12);
    await db.user.upsert({
      where: { email: adminEmail },
      update: { role: "ADMIN" },
      create: { email: adminEmail, name: "Admin", passwordHash, role: "ADMIN" },
    });
  }

  console.log(`Seed fertig: ${SUPERMARKETS.length} Supermärkte, ${INGREDIENTS.length} Zutaten, ${RECIPES.length} Rezepte.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
