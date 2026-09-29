export interface ShoppingIngredient {
  id: string;
  price: number;
  packageGrams: number;
}

export interface ShoppingRecipe {
  id: string;
  servings: number;
  ingredients: { ingredientId: string; grams: number }[];
}

export interface ShoppingLine {
  ingredientId: string;
  grams: number;
  packages: number;
  costCents: number;
}

/**
 * Summiert alle Zutaten eines Plans. costCents ist der Verbrauchswert (Grammgenau),
 * packages die Anzahl benötigter Packungen als Einkaufshilfe.
 */
export function buildShoppingList(
  entries: { recipeId: string; servingFactor: number }[],
  recipes: Map<string, ShoppingRecipe>,
  ingredients: Map<string, ShoppingIngredient>,
): ShoppingLine[] {
  const grams = new Map<string, number>();
  for (const e of entries) {
    const r = recipes.get(e.recipeId);
    if (!r) continue;
    const perServing = e.servingFactor / Math.max(1, r.servings);
    for (const ri of r.ingredients) {
      grams.set(ri.ingredientId, (grams.get(ri.ingredientId) ?? 0) + ri.grams * perServing);
    }
  }
  const lines: ShoppingLine[] = [];
  for (const [ingredientId, g] of grams) {
    const ing = ingredients.get(ingredientId);
    if (!ing) continue;
    lines.push({
      ingredientId,
      grams: Math.round(g),
      packages: Math.max(1, Math.ceil(g / Math.max(1, ing.packageGrams))),
      costCents: Math.round((ing.price * g) / 100),
    });
  }
  return lines;
}
