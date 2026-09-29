import type { Metadata } from "next";
import { Card } from "@/components/ui/card";
import { Stat } from "@/components/ui/page";
import { db } from "@/lib/db";
import { formatNumber } from "@/lib/labels";

export const metadata: Metadata = { title: "Verwaltung" };

export default async function AdminPage() {
  const [users, recipes, hidden, ingredients, plans, logs] = await Promise.all([
    db.user.count(),
    db.recipe.count({ where: { published: true } }),
    db.recipe.count({ where: { published: false } }),
    db.ingredient.count(),
    db.mealPlan.count(),
    db.foodLogEntry.count(),
  ]);
  return (
    <Card className="grid grid-cols-2 gap-3 sm:grid-cols-3">
      <Stat label="Nutzer" value={formatNumber(users)} />
      <Stat label="Rezepte" value={formatNumber(recipes)} hint={hidden ? `${hidden} versteckt` : undefined} />
      <Stat label="Zutaten" value={formatNumber(ingredients)} />
      <Stat label="Wochenpläne" value={formatNumber(plans)} />
      <Stat label="Tagebuch-Einträge" value={formatNumber(logs)} />
    </Card>
  );
}
