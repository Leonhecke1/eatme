export interface Macros {
  kcal: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
}

export interface NutrientSource {
  kcal: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
}

export const ZERO_MACROS: Macros = { kcal: 0, protein: 0, carbs: 0, fat: 0, fiber: 0 };

export function macrosForGrams(src: NutrientSource, grams: number): Macros {
  const f = grams / 100;
  return {
    kcal: src.kcal * f,
    protein: src.protein * f,
    carbs: src.carbs * f,
    fat: src.fat * f,
    fiber: src.fiber * f,
  };
}

export function addMacros(a: Macros, b: Macros): Macros {
  return {
    kcal: a.kcal + b.kcal,
    protein: a.protein + b.protein,
    carbs: a.carbs + b.carbs,
    fat: a.fat + b.fat,
    fiber: a.fiber + b.fiber,
  };
}

export function scaleMacros(m: Macros, factor: number): Macros {
  return {
    kcal: m.kcal * factor,
    protein: m.protein * factor,
    carbs: m.carbs * factor,
    fat: m.fat * factor,
    fiber: m.fiber * factor,
  };
}

export function sumIngredients(items: { grams: number; ingredient: NutrientSource }[]): Macros {
  return items.reduce((acc, it) => addMacros(acc, macrosForGrams(it.ingredient, it.grams)), ZERO_MACROS);
}

export function roundMacros(m: Macros): Macros {
  return {
    kcal: Math.round(m.kcal),
    protein: Math.round(m.protein * 10) / 10,
    carbs: Math.round(m.carbs * 10) / 10,
    fat: Math.round(m.fat * 10) / 10,
    fiber: Math.round(m.fiber * 10) / 10,
  };
}
