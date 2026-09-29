import type { Goal } from "@/lib/nutrition/energy";

export type MealType = "FRUEHSTUECK" | "MITTAG" | "ABEND" | "SNACK";

export interface PlannerIngredient {
  id: string;
  kcal: number;
  protein: number;
  carbs: number;
  fat: number;
  /** Effektiver Preis pro 100 g in Cent (bereits inkl. Supermarkt-Faktor bzw. Override). */
  price: number;
  allergens: string[];
}

export interface PlannerRecipe {
  id: string;
  mealType: MealType;
  baseType: string;
  servings: number;
  ingredients: { ingredientId: string; grams: number }[];
}

export interface PlannerInput {
  recipes: PlannerRecipe[];
  ingredients: Map<string, PlannerIngredient>;
  targetKcal: number;
  goal: Goal;
  mealsPerDay: number;
  budgetCents: number;
  favoriteIds: Set<string>;
  dislikedIds: Set<string>;
  allergies: Set<string>;
  preferredBases: Set<string>;
  seed: number;
  /** Gesperrte Einträge bleiben unverändert. */
  locked?: PlanEntry[];
  days?: number;
}

export interface PlanEntry {
  dayIndex: number;
  slot: number;
  mealType: MealType;
  recipeId: string;
  servingFactor: number;
  locked?: boolean;
}

export interface PlanResult {
  entries: PlanEntry[];
  costCents: number;
  overBudget: boolean;
  dailyKcal: number[];
}

export interface SlotDef {
  mealType: MealType;
  share: number;
}

export function slotsForMeals(mealsPerDay: number): SlotDef[] {
  switch (mealsPerDay) {
    case 4:
      return [
        { mealType: "FRUEHSTUECK", share: 0.25 },
        { mealType: "MITTAG", share: 0.35 },
        { mealType: "ABEND", share: 0.3 },
        { mealType: "SNACK", share: 0.1 },
      ];
    case 5:
      return [
        { mealType: "FRUEHSTUECK", share: 0.22 },
        { mealType: "SNACK", share: 0.1 },
        { mealType: "MITTAG", share: 0.3 },
        { mealType: "SNACK", share: 0.1 },
        { mealType: "ABEND", share: 0.28 },
      ];
    default:
      return [
        { mealType: "FRUEHSTUECK", share: 0.3 },
        { mealType: "MITTAG", share: 0.4 },
        { mealType: "ABEND", share: 0.3 },
      ];
  }
}

/** Deterministischer Zufallsgenerator (mulberry32). */
export function createRng(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

interface RecipeStats {
  kcal: number;
  protein: number;
  cost: number;
  ingredientIds: string[];
  allergens: Set<string>;
}

export function recipeStats(recipe: PlannerRecipe, ingredients: Map<string, PlannerIngredient>): RecipeStats {
  let kcal = 0;
  let protein = 0;
  let cost = 0;
  const allergens = new Set<string>();
  for (const ri of recipe.ingredients) {
    const ing = ingredients.get(ri.ingredientId);
    if (!ing) continue;
    const f = ri.grams / 100;
    kcal += ing.kcal * f;
    protein += ing.protein * f;
    cost += ing.price * f;
    ing.allergens.forEach((a) => allergens.add(a));
  }
  const s = Math.max(1, recipe.servings);
  return {
    kcal: kcal / s,
    protein: protein / s,
    cost: cost / s,
    ingredientIds: recipe.ingredients.map((i) => i.ingredientId),
    allergens,
  };
}

export function servingFactorFor(slotKcal: number, kcalPerServing: number): number {
  if (kcalPerServing <= 0) return 1;
  const raw = slotKcal / kcalPerServing;
  const rounded = Math.round(raw * 4) / 4;
  return Math.min(2.5, Math.max(0.5, rounded));
}

class PlannerContext {
  readonly stats = new Map<string, RecipeStats>();
  readonly rng: () => number;
  readonly slots: SlotDef[];
  readonly budgetPerKcal: number;

  constructor(readonly input: PlannerInput) {
    this.rng = createRng(input.seed);
    this.slots = slotsForMeals(input.mealsPerDay);
    const days = input.days ?? 7;
    this.budgetPerKcal = input.budgetCents / Math.max(1, input.targetKcal * days);
    for (const r of input.recipes) this.stats.set(r.id, recipeStats(r, input.ingredients));
  }

  allowed(recipe: PlannerRecipe): boolean {
    const st = this.stats.get(recipe.id)!;
    if (st.kcal <= 0) return false;
    for (const a of st.allergens) if (this.input.allergies.has(a)) return false;
    for (const id of st.ingredientIds) if (this.input.dislikedIds.has(id)) return false;
    return true;
  }

  score(
    recipe: PlannerRecipe,
    slotKcal: number,
    usage: Map<string, number>,
    usedIngredients: Set<string>,
  ): number {
    const st = this.stats.get(recipe.id)!;
    const { goal, favoriteIds, preferredBases } = this.input;
    let score = 0;

    const favCount = st.ingredientIds.filter((id) => favoriteIds.has(id)).length;
    score += (favCount / Math.max(1, st.ingredientIds.length)) * 1.5;

    const proteinShare = (st.protein * 4) / st.kcal;
    const proteinWeight = goal === "MUSKELAUFBAU" || goal === "ABNEHMEN" ? 4 : 1.5;
    score += proteinShare * proteinWeight;

    if (goal === "ZUNEHMEN") score += Math.min(1, st.kcal / 700) * 0.8;
    if (goal === "ABNEHMEN") score += Math.max(0, 1 - st.kcal / 700) * 0.4;

    const costPerKcal = st.cost / st.kcal;
    const costRatio = costPerKcal / Math.max(0.0001, this.budgetPerKcal);
    score -= Math.max(0, costRatio - 0.6) * 1.2;

    const reuse = st.ingredientIds.filter((id) => usedIngredients.has(id)).length / Math.max(1, st.ingredientIds.length);
    score += reuse * 0.6;

    const factor = slotKcal / st.kcal;
    if (factor > 2.5 || factor < 0.5) score -= 1;

    if (preferredBases.size > 0 && preferredBases.has(recipe.baseType)) score += 0.8;

    score -= (usage.get(recipe.id) ?? 0) * 0.9;
    score += this.rng() * 0.7;
    return score;
  }

  candidates(mealType: MealType): PlannerRecipe[] {
    const isMain = (t: MealType) => t === "MITTAG" || t === "ABEND";
    const list = this.input.recipes.filter(
      (r) => (r.mealType === mealType || (isMain(mealType) && isMain(r.mealType))) && this.allowed(r),
    );
    if (list.length > 0 || mealType !== "SNACK") return list;
    return this.input.recipes.filter((r) => r.mealType === "FRUEHSTUECK" && this.allowed(r));
  }
}

function aggregateCost(entries: PlanEntry[], ctx: PlannerContext): number {
  let cost = 0;
  for (const e of entries) cost += ctx.stats.get(e.recipeId)!.cost * e.servingFactor;
  return cost;
}

export function generatePlan(input: PlannerInput): PlanResult {
  const ctx = new PlannerContext(input);
  const days = input.days ?? 7;
  const usage = new Map<string, number>();
  const usedIngredients = new Set<string>();
  const entries: PlanEntry[] = [];
  const locked = new Map((input.locked ?? []).map((e) => [`${e.dayIndex}-${e.slot}`, e]));

  for (const e of locked.values()) usage.set(e.recipeId, (usage.get(e.recipeId) ?? 0) + 1);

  for (let day = 0; day < days; day++) {
    const basesToday = new Set<string>();
    ctx.slots.forEach((slot, slotIndex) => {
      const lockedEntry = locked.get(`${day}-${slotIndex}`);
      if (lockedEntry) {
        entries.push({ ...lockedEntry, locked: true });
        return;
      }
      const slotKcal = input.targetKcal * slot.share;
      const pool = ctx.candidates(slot.mealType).filter((r) => (usage.get(r.id) ?? 0) < 2);
      const varied = pool.filter(
        (r) => slot.mealType === "SNACK" || r.baseType === "SONSTIGES" || !basesToday.has(r.baseType),
      );
      const options = varied.length > 0 ? varied : pool.length > 0 ? pool : ctx.candidates(slot.mealType);
      if (options.length === 0) return;

      let best = options[0];
      let bestScore = -Infinity;
      for (const r of options) {
        const s = ctx.score(r, slotKcal, usage, usedIngredients);
        if (s > bestScore) {
          bestScore = s;
          best = r;
        }
      }
      const st = ctx.stats.get(best.id)!;
      usage.set(best.id, (usage.get(best.id) ?? 0) + 1);
      st.ingredientIds.forEach((id) => usedIngredients.add(id));
      basesToday.add(best.baseType);
      entries.push({
        dayIndex: day,
        slot: slotIndex,
        mealType: slot.mealType,
        recipeId: best.id,
        servingFactor: servingFactorFor(slotKcal, st.kcal),
      });
    });
  }

  // Budget-Schleife: teuerste Einträge (Kosten pro kcal) gegen günstigere Alternativen tauschen.
  let cost = aggregateCost(entries, ctx);
  const tried = new Set<number>();
  for (let iter = 0; iter < 60 && cost > input.budgetCents; iter++) {
    let worstIdx = -1;
    let worstCpk = -Infinity;
    entries.forEach((e, idx) => {
      if (e.locked || tried.has(idx)) return;
      const st = ctx.stats.get(e.recipeId)!;
      const cpk = st.cost / st.kcal;
      if (cpk > worstCpk) {
        worstCpk = cpk;
        worstIdx = idx;
      }
    });
    if (worstIdx < 0) break;
    tried.add(worstIdx);
    const target = entries[worstIdx];
    const slotKcal = input.targetKcal * ctx.slots[target.slot].share;
    const counts = new Map<string, number>();
    entries.forEach((e) => counts.set(e.recipeId, (counts.get(e.recipeId) ?? 0) + 1));
    const cheaper = ctx
      .candidates(target.mealType)
      .filter((r) => r.id !== target.recipeId && (counts.get(r.id) ?? 0) < 3)
      .map((r) => ({ r, st: ctx.stats.get(r.id)! }))
      .filter(({ st }) => st.cost / st.kcal < worstCpk * 0.9)
      .sort((a, b) => a.st.cost / a.st.kcal - b.st.cost / b.st.kcal);
    if (cheaper.length === 0) continue;
    const pick = cheaper[Math.floor(ctx.rng() * Math.min(3, cheaper.length))];
    entries[worstIdx] = {
      ...target,
      recipeId: pick.r.id,
      servingFactor: servingFactorFor(slotKcal, pick.st.kcal),
    };
    cost = aggregateCost(entries, ctx);
  }

  const dailyKcal = Array.from({ length: days }, () => 0);
  for (const e of entries) dailyKcal[e.dayIndex] += ctx.stats.get(e.recipeId)!.kcal * e.servingFactor;

  return {
    entries,
    costCents: Math.round(cost),
    overBudget: cost > input.budgetCents,
    dailyKcal: dailyKcal.map(Math.round),
  };
}

/** Alternative für einen einzelnen Slot vorschlagen (Tauschen-Button). */
export function suggestReplacement(
  input: PlannerInput,
  current: PlanEntry[],
  target: PlanEntry,
): PlanEntry | null {
  const ctx = new PlannerContext(input);
  const usage = new Map<string, number>();
  const usedIngredients = new Set<string>();
  for (const e of current) {
    usage.set(e.recipeId, (usage.get(e.recipeId) ?? 0) + 1);
    ctx.stats.get(e.recipeId)?.ingredientIds.forEach((id) => usedIngredients.add(id));
  }
  const slotKcal = input.targetKcal * (ctx.slots[target.slot]?.share ?? 0.3);
  const options = ctx.candidates(target.mealType).filter((r) => r.id !== target.recipeId);
  if (options.length === 0) return null;
  let best = options[0];
  let bestScore = -Infinity;
  for (const r of options) {
    const s = ctx.score(r, slotKcal, usage, usedIngredients);
    if (s > bestScore) {
      bestScore = s;
      best = r;
    }
  }
  return {
    ...target,
    recipeId: best.id,
    servingFactor: servingFactorFor(slotKcal, ctx.stats.get(best.id)!.kcal),
    locked: false,
  };
}
