export interface PriceSource {
  id: string;
  pricePer100gCents: number;
}

/** Effektiver Preis pro 100 g: Nutzer-Override hat Vorrang, sonst Richtpreis x Supermarkt-Faktor. */
export function effectivePricePer100g(
  ingredient: PriceSource,
  supermarketFactor: number,
  overrides?: Map<string, number>,
): number {
  const override = overrides?.get(ingredient.id);
  if (override != null) return override;
  return ingredient.pricePer100gCents * supermarketFactor;
}

export function costForGrams(pricePer100gCents: number, grams: number): number {
  return (pricePer100gCents * grams) / 100;
}

export function formatEuro(cents: number): string {
  return new Intl.NumberFormat("de-DE", { style: "currency", currency: "EUR" }).format(cents / 100);
}
