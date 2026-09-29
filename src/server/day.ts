import "server-only";
import { db } from "@/lib/db";
import { dateFromISO } from "@/lib/dates";

export async function loadDayLog(userId: string, date: string) {
  const entries = await db.foodLogEntry.findMany({
    where: { userId, date: dateFromISO(date) },
    orderBy: { createdAt: "asc" },
  });
  const totals = entries.reduce(
    (acc, e) => ({ kcal: acc.kcal + e.kcal, protein: acc.protein + e.protein, carbs: acc.carbs + e.carbs, fat: acc.fat + e.fat }),
    { kcal: 0, protein: 0, carbs: 0, fat: 0 },
  );
  return { entries, totals };
}

export async function ingredientsForQuickAdd() {
  return db.ingredient.findMany({ select: { id: true, name: true, category: true, kcal: true }, orderBy: { name: "asc" } });
}
