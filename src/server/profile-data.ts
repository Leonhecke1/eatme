import "server-only";
import { db } from "@/lib/db";
import { isoFromDate } from "@/lib/dates";
import type { ProfileInput } from "@/lib/validators/profile";

export async function loadProfileEditorData(userId: string) {
  const [profile, sports, favorites, supermarkets, ingredients] = await Promise.all([
    db.profile.findUnique({ where: { userId } }),
    db.sportActivity.findMany({ where: { userId } }),
    db.favoriteIngredient.findMany({ where: { userId } }),
    db.supermarket.findMany({ orderBy: { priceFactor: "asc" } }),
    db.ingredient.findMany({ select: { id: true, name: true, category: true }, orderBy: [{ category: "asc" }, { name: "asc" }] }),
  ]);

  const initial: ProfileInput = profile
    ? {
        sex: profile.sex,
        birthDate: isoFromDate(profile.birthDate),
        heightCm: profile.heightCm,
        weightKg: profile.weightKg,
        bodyFatPct: profile.bodyFatPct,
        dailyActivity: profile.dailyActivity,
        goal: profile.goal,
        mealsPerDay: profile.mealsPerDay,
        sports: sports.map((s) => ({ type: s.type, minutesPerSession: s.minutesPerSession, sessionsPerWeek: s.sessionsPerWeek })),
        favoriteIds: favorites.map((f) => f.ingredientId),
        dislikedIds: profile.dislikedIds,
        allergies: profile.allergies,
        preferredBases: profile.preferredBases,
        supermarketId: profile.supermarketId,
        weeklyBudgetEuro: profile.weeklyBudgetCents / 100,
      }
    : {
        sex: "WEIBLICH",
        birthDate: "",
        heightCm: 170,
        weightKg: 70,
        bodyFatPct: null,
        dailyActivity: "SITZEND",
        goal: "HALTEN",
        mealsPerDay: 3,
        sports: [],
        favoriteIds: [],
        dislikedIds: [],
        allergies: [],
        preferredBases: [],
        supermarketId: supermarkets[0]?.id ?? null,
        weeklyBudgetEuro: 50,
      };

  return {
    initial,
    supermarkets: supermarkets.map((s) => ({ id: s.id, name: s.name, priceFactor: s.priceFactor })),
    ingredients,
  };
}
