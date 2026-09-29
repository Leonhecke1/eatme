"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { db } from "@/lib/db";
import { dateFromISO, todayISO, weekStartISO } from "@/lib/dates";
import { profileSchema, type ProfileInput } from "@/lib/validators/profile";
import { requireUser } from "@/server/auth";
import { generateWeekPlan, rebuildShoppingList } from "@/server/plan";

export interface ProfileResult {
  ok?: boolean;
  error?: string;
}

export async function saveProfileAction(raw: ProfileInput, mode: "onboarding" | "edit"): Promise<ProfileResult> {
  const user = await requireUser();
  const parsed = profileSchema.safeParse(raw);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Ungültige Eingaben." };
  const p = parsed.data;

  const validIds = new Set(
    (await db.ingredient.findMany({ where: { id: { in: [...p.favoriteIds, ...p.dislikedIds] } }, select: { id: true } })).map(
      (i) => i.id,
    ),
  );
  const favoriteIds = p.favoriteIds.filter((id) => validIds.has(id));
  const dislikedIds = p.dislikedIds.filter((id) => validIds.has(id) && !favoriteIds.includes(id));
  const supermarketId =
    p.supermarketId && (await db.supermarket.findUnique({ where: { id: p.supermarketId } })) ? p.supermarketId : null;

  const previous = await db.profile.findUnique({ where: { userId: user.id }, select: { weightKg: true } });
  const data = {
    sex: p.sex,
    birthDate: dateFromISO(p.birthDate),
    heightCm: p.heightCm,
    weightKg: p.weightKg,
    bodyFatPct: p.bodyFatPct,
    dailyActivity: p.dailyActivity,
    goal: p.goal,
    mealsPerDay: p.mealsPerDay,
    supermarketId,
    weeklyBudgetCents: Math.round(p.weeklyBudgetEuro * 100),
    allergies: p.allergies,
    dislikedIds,
    preferredBases: p.preferredBases,
  };
  const today = dateFromISO(todayISO());

  await db.$transaction([
    db.profile.upsert({ where: { userId: user.id }, update: data, create: { userId: user.id, ...data } }),
    db.sportActivity.deleteMany({ where: { userId: user.id } }),
    db.sportActivity.createMany({ data: p.sports.map((s) => ({ ...s, userId: user.id })) }),
    db.favoriteIngredient.deleteMany({ where: { userId: user.id } }),
    db.favoriteIngredient.createMany({ data: favoriteIds.map((ingredientId) => ({ userId: user.id, ingredientId })) }),
    ...(previous?.weightKg !== p.weightKg
      ? [
          db.weightLog.upsert({
            where: { userId_date: { userId: user.id, date: today } },
            update: { weightKg: p.weightKg },
            create: { userId: user.id, date: today, weightKg: p.weightKg },
          }),
        ]
      : []),
  ]);

  if (mode === "onboarding") {
    await generateWeekPlan(user.id, weekStartISO(todayISO()));
    redirect("/plan?neu=1");
  }

  // Preise koennen sich durch einen anderen Supermarkt geaendert haben.
  const current = await db.mealPlan.findUnique({
    where: { userId_weekStart: { userId: user.id, weekStart: dateFromISO(weekStartISO(todayISO())) } },
    select: { id: true },
  });
  if (current) await rebuildShoppingList(user.id, current.id);
  revalidatePath("/", "layout");
  return { ok: true };
}

const weightSchema = z.object({
  weightKg: z.coerce.number().min(35).max(300),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
});

export async function logWeightAction(formData: FormData) {
  const user = await requireUser();
  const parsed = weightSchema.safeParse({ weightKg: formData.get("weightKg"), date: formData.get("date") || todayISO() });
  if (!parsed.success) return;
  const date = dateFromISO(parsed.data.date);
  await db.weightLog.upsert({
    where: { userId_date: { userId: user.id, date } },
    update: { weightKg: parsed.data.weightKg },
    create: { userId: user.id, date, weightKg: parsed.data.weightKg },
  });
  const latest = await db.weightLog.findFirst({ where: { userId: user.id }, orderBy: { date: "desc" } });
  if (latest) await db.profile.update({ where: { userId: user.id }, data: { weightKg: latest.weightKg } });
  revalidatePath("/profil");
  revalidatePath("/heute");
}

export async function deleteWeightAction(formData: FormData) {
  const user = await requireUser();
  const id = String(formData.get("id") ?? "");
  await db.weightLog.deleteMany({ where: { id, userId: user.id } });
  revalidatePath("/profil");
}
