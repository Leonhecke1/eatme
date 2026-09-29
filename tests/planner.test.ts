import { describe, expect, it } from "vitest";
import { generatePlan, suggestReplacement, slotsForMeals, type PlannerIngredient, type PlannerInput, type PlannerRecipe } from "@/lib/planner/generate";
import { buildShoppingList } from "@/lib/planner/shopping";
import { INGREDIENTS } from "../prisma/seed/ingredients";
import { RECIPES } from "../prisma/seed/recipes";

const ingredients = new Map<string, PlannerIngredient>(
  INGREDIENTS.map((r) => [r[0], { id: r[0], kcal: r[2], protein: r[3], carbs: r[4], fat: r[5], price: r[7], allergens: r[9] ?? [] }]),
);
const recipes: PlannerRecipe[] = RECIPES.map((r) => ({
  id: r.slug, mealType: r.mealType, baseType: r.baseType, servings: r.servings,
  ingredients: r.ingredients.map(([n, g]) => ({ ingredientId: n, grams: g })),
}));

function input(overrides: Partial<PlannerInput> = {}): PlannerInput {
  return {
    recipes, ingredients, targetKcal: 2500, goal: "MUSKELAUFBAU", mealsPerDay: 3, budgetCents: 6000,
    favoriteIds: new Set(), dislikedIds: new Set(), allergies: new Set(), preferredBases: new Set(), seed: 42,
    ...overrides,
  };
}

describe("planner", () => {
  it("erzeugt 7 Tage mit allen Slots", () => {
    const plan = generatePlan(input());
    expect(plan.entries).toHaveLength(21);
    for (let d = 0; d < 7; d++) expect(plan.entries.filter((e) => e.dayIndex === d)).toHaveLength(3);
  });

  it("trifft die Ziel-kcal pro Tag ungefaehr", () => {
    for (const meals of [3, 4, 5]) {
      const plan = generatePlan(input({ mealsPerDay: meals }));
      expect(plan.entries).toHaveLength(7 * slotsForMeals(meals).length);
      for (const kcal of plan.dailyKcal) expect(Math.abs(kcal - 2500) / 2500).toBeLessThan(0.12);
    }
  });

  it("ist deterministisch fuer denselben Seed", () => {
    expect(generatePlan(input()).entries).toEqual(generatePlan(input()).entries);
    expect(generatePlan(input({ seed: 7 })).entries).not.toEqual(generatePlan(input()).entries);
  });

  it("respektiert Allergien und Abneigungen", () => {
    const plan = generatePlan(input({ allergies: new Set(["SOJA", "GLUTEN"]), dislikedIds: new Set(["Kichererbsen (Dose)"]) }));
    for (const e of plan.entries) {
      const r = recipes.find((x) => x.id === e.recipeId)!;
      for (const ri of r.ingredients) {
        expect(ingredients.get(ri.ingredientId)!.allergens).not.toContain("SOJA");
        expect(ingredients.get(ri.ingredientId)!.allergens).not.toContain("GLUTEN");
        expect(ri.ingredientId).not.toBe("Kichererbsen (Dose)");
      }
    }
  });

  it("verwendet kein Rezept oefter als zweimal", () => {
    const plan = generatePlan(input());
    const counts = new Map<string, number>();
    plan.entries.forEach((e) => counts.set(e.recipeId, (counts.get(e.recipeId) ?? 0) + 1));
    expect(Math.max(...counts.values())).toBeLessThanOrEqual(2);
  });

  it("senkt die Kosten bei knappem Budget", () => {
    const generous = generatePlan(input({ budgetCents: 20000 }));
    const tight = generatePlan(input({ budgetCents: 3000 }));
    expect(tight.costCents).toBeLessThanOrEqual(generous.costCents);
    expect(generous.overBudget).toBe(false);
  });

  it("behaelt gesperrte Eintraege", () => {
    const first = generatePlan(input());
    const locked = [{ ...first.entries[4], locked: true }];
    const second = generatePlan(input({ seed: 99, locked }));
    expect(second.entries.find((e) => e.dayIndex === locked[0].dayIndex && e.slot === locked[0].slot)!.recipeId).toBe(
      locked[0].recipeId,
    );
  });

  it("schlaegt beim Tauschen ein anderes Rezept vor", () => {
    const plan = generatePlan(input());
    const alt = suggestReplacement(input({ seed: 3 }), plan.entries, plan.entries[0]);
    expect(alt).not.toBeNull();
    expect(alt!.recipeId).not.toBe(plan.entries[0].recipeId);
  });

  it("baut eine Einkaufsliste mit Kosten", () => {
    const plan = generatePlan(input());
    const list = buildShoppingList(
      plan.entries,
      new Map(recipes.map((r) => [r.id, r])),
      new Map(INGREDIENTS.map((r) => [r[0], { id: r[0], price: r[7], packageGrams: r[8] }])),
    );
    const total = list.reduce((s, l) => s + l.costCents, 0);
    expect(Math.abs(total - plan.costCents)).toBeLessThan(list.length + 1);
    expect(list.every((l) => l.packages >= 1)).toBe(true);
  });
});
