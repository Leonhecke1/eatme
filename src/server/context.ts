import "server-only";
import { cache } from "react";
import { db } from "@/lib/db";
import { ageFromBirthDate, calculateEnergy } from "@/lib/nutrition/energy";
import { effectivePricePer100g } from "@/lib/pricing";

/** Alles, was die meisten Seiten ueber den Nutzer brauchen: Profil, Bedarf, Preise. */
export const loadUserContext = cache(async (userId: string) => {
  const [profile, sports, favorites, overrides] = await Promise.all([
    db.profile.findUnique({ where: { userId }, include: { supermarket: true } }),
    db.sportActivity.findMany({ where: { userId } }),
    db.favoriteIngredient.findMany({ where: { userId }, select: { ingredientId: true } }),
    db.userIngredientPrice.findMany({ where: { userId } }),
  ]);
  if (!profile) throw new Error("Profil fehlt");

  const energy = calculateEnergy({
    sex: profile.sex,
    age: ageFromBirthDate(profile.birthDate),
    heightCm: profile.heightCm,
    weightKg: profile.weightKg,
    bodyFatPct: profile.bodyFatPct,
    dailyActivity: profile.dailyActivity,
    goal: profile.goal,
    sports,
  });

  const priceFactor = profile.supermarket?.priceFactor ?? 1;
  const overrideMap = new Map(overrides.map((o) => [o.ingredientId, o.pricePer100gCents]));
  const priceOf = (ingredient: { id: string; pricePer100gCents: number }) =>
    effectivePricePer100g(ingredient, priceFactor, overrideMap);

  return {
    profile,
    sports,
    energy,
    favoriteIds: new Set(favorites.map((f) => f.ingredientId)),
    priceFactor,
    overrideMap,
    priceOf,
  };
});

export type UserContext = Awaited<ReturnType<typeof loadUserContext>>;
