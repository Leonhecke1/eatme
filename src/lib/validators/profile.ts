import { z } from "zod";
import { ALLERGENS, BASE_TYPES } from "@/lib/labels";
import { SPORTS } from "@/lib/nutrition/energy";

export const sportSchema = z.object({
  type: z.string().refine((t) => t in SPORTS, "Unbekannte Sportart"),
  minutesPerSession: z.coerce.number().int().min(5).max(600),
  sessionsPerWeek: z.coerce.number().int().min(1).max(21),
});

export const profileSchema = z.object({
  sex: z.enum(["MAENNLICH", "WEIBLICH"]),
  birthDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Bitte gib ein gültiges Datum ein.")
    .refine((v) => {
      const d = new Date(v);
      const age = (Date.now() - d.getTime()) / (365.25 * 24 * 3600 * 1000);
      return age >= 14 && age <= 110;
    }, "Du musst mindestens 14 Jahre alt sein."),
  heightCm: z.coerce.number().int().min(120, "Mindestens 120 cm").max(230, "Höchstens 230 cm"),
  weightKg: z.coerce.number().min(35, "Mindestens 35 kg").max(300, "Höchstens 300 kg"),
  bodyFatPct: z.coerce.number().min(3).max(60).nullable(),
  dailyActivity: z.enum(["SITZEND", "LEICHT", "MITTEL", "STARK"]),
  goal: z.enum(["ABNEHMEN", "HALTEN", "MUSKELAUFBAU", "ZUNEHMEN"]),
  mealsPerDay: z.coerce.number().int().min(3).max(5),
  sports: z.array(sportSchema).max(10),
  favoriteIds: z.array(z.string()).max(200),
  dislikedIds: z.array(z.string()).max(200),
  allergies: z.array(z.enum(ALLERGENS)),
  preferredBases: z.array(z.enum(BASE_TYPES)),
  supermarketId: z.string().nullable(),
  weeklyBudgetEuro: z.coerce.number().min(10, "Mindestens 10 Euro").max(500, "Höchstens 500 Euro"),
});

export type ProfileInput = z.infer<typeof profileSchema>;
