export const MEAL_TYPES = ["FRUEHSTUECK", "MITTAG", "ABEND", "SNACK"] as const;
export type MealTypeKey = (typeof MEAL_TYPES)[number];

export const MEAL_LABELS: Record<MealTypeKey, string> = {
  FRUEHSTUECK: "Frühstück",
  MITTAG: "Mittagessen",
  ABEND: "Abendessen",
  SNACK: "Snack",
};

export const BASE_TYPES = [
  "REIS",
  "NUDELN",
  "KARTOFFELN",
  "BROT",
  "HUELSENFRUECHTE",
  "HAFER",
  "BOWL",
  "SUPPE",
  "SALAT",
  "SONSTIGES",
] as const;
export type BaseTypeKey = (typeof BASE_TYPES)[number];

export const BASE_LABELS: Record<BaseTypeKey, string> = {
  REIS: "Reis",
  NUDELN: "Nudeln",
  KARTOFFELN: "Kartoffeln",
  BROT: "Brot & Wraps",
  HUELSENFRUECHTE: "Hülsenfrüchte",
  HAFER: "Hafer & Müsli",
  BOWL: "Bowls",
  SUPPE: "Suppen",
  SALAT: "Salate",
  SONSTIGES: "Sonstiges",
};

export const ALLERGENS = ["GLUTEN", "SOJA", "NUESSE", "ERDNUESSE", "SESAM"] as const;
export type AllergenKey = (typeof ALLERGENS)[number];

export const ALLERGEN_LABELS: Record<AllergenKey, string> = {
  GLUTEN: "Gluten",
  SOJA: "Soja",
  NUESSE: "Nüsse",
  ERDNUESSE: "Erdnüsse",
  SESAM: "Sesam",
};

export const TAG_LABELS: Record<string, string> = {
  proteinreich: "Proteinreich",
  schnell: "Schnell",
  günstig: "Günstig",
  "meal-prep": "Meal Prep",
};

export function formatGrams(g: number): string {
  if (g >= 1000) return `${(g / 1000).toLocaleString("de-DE", { maximumFractionDigits: 2 })} kg`;
  return `${Math.round(g)} g`;
}

export function formatNumber(n: number, digits = 0): string {
  return n.toLocaleString("de-DE", { maximumFractionDigits: digits, minimumFractionDigits: 0 });
}

/** Kategorien, die man meist vorraetig hat (nicht in den Kassenbon einrechnen). */
export const PANTRY_CATEGORIES = new Set(["Gewürze & Saucen", "Öle & Fette"]);
