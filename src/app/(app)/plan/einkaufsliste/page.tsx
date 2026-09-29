import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, ShoppingBasket } from "lucide-react";
import { ShoppingList } from "@/components/shopping-list";
import { Button, ButtonLink } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState, PageHeader, Stat } from "@/components/ui/page";
import { db } from "@/lib/db";
import { addDays, dateFromISO, formatDateShort, isISODate, todayISO, weekStartISO } from "@/lib/dates";
import { PANTRY_CATEGORIES } from "@/lib/labels";
import { formatEuro } from "@/lib/pricing";
import { uncheckAllShoppingAction } from "@/server/actions/plan";
import { requireProfileUser } from "@/server/auth";
import { loadUserContext } from "@/server/context";

export const metadata: Metadata = { title: "Einkaufsliste" };

export default async function ShoppingPage({ searchParams }: PageProps<"/plan/einkaufsliste">) {
  const user = await requireProfileUser();
  const sp = await searchParams;
  const weekStart = weekStartISO(typeof sp.woche === "string" && isISODate(sp.woche) ? sp.woche : todayISO());
  const ctx = await loadUserContext(user.id);
  const plan = await db.mealPlan.findUnique({
    where: { userId_weekStart: { userId: user.id, weekStart: dateFromISO(weekStart) } },
    include: { shoppingItems: { include: { ingredient: true } } },
  });

  const label = `${formatDateShort(weekStart)} bis ${formatDateShort(addDays(weekStart, 6))}`;
  const back = (
    <Link href={`/plan?woche=${weekStart}`} className="mb-4 inline-flex items-center gap-1.5 text-sm font-bold text-muted hover:text-leaf-700">
      <ArrowLeft className="h-4 w-4" aria-hidden /> Zum Wochenplan
    </Link>
  );

  if (!plan || plan.shoppingItems.length === 0) {
    return (
      <>
        {back}
        <PageHeader title="Einkaufsliste" subtitle={label} />
        <EmptyState
          icon={ShoppingBasket}
          title="Noch keine Einkaufsliste"
          text="Erstelle zuerst einen Wochenplan, die Liste wird automatisch daraus berechnet."
          action={<ButtonLink href={`/plan?woche=${weekStart}`}>Zum Wochenplan</ButtonLink>}
        />
      </>
    );
  }

  const items = plan.shoppingItems
    .map((s) => {
      const price100 = ctx.priceOf(s.ingredient);
      return {
        id: s.id,
        ingredientId: s.ingredientId,
        name: s.ingredient.name,
        category: s.ingredient.category,
        grams: s.grams,
        packages: s.packages,
        packageGrams: s.ingredient.packageGrams,
        costCents: s.costCents,
        packagePriceCents: Math.round((price100 * s.ingredient.packageGrams) / 100),
        hasOverride: ctx.overrideMap.has(s.ingredientId),
        checked: s.checked,
      };
    })
    .sort((a, b) => a.category.localeCompare(b.category, "de") || a.name.localeCompare(b.name, "de"));
  const packageTotal = items.filter((i) => !PANTRY_CATEGORIES.has(i.category)).reduce((s, i) => s + i.packages * i.packagePriceCents, 0);
  const pantryTotal = items.filter((i) => PANTRY_CATEGORIES.has(i.category)).reduce((s, i) => s + i.packages * i.packagePriceCents, 0);

  return (
    <>
      {back}
      <PageHeader
        title="Einkaufsliste"
        subtitle={`${label} · ${ctx.profile.supermarket?.name ?? "Durchschnittspreise"}`}
        actions={
          <form action={uncheckAllShoppingAction}>
            <input type="hidden" name="planId" value={plan.id} />
            <Button type="submit" variant="ghost" size="sm">
              Alle Häkchen entfernen
            </Button>
          </form>
        }
      />
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[1fr_320px]">
        <ShoppingList key={items.map((i) => `${i.id}${i.costCents}`).join()} items={items} />
        <div className="lg:sticky lg:top-8 lg:self-start">
          <Card className="space-y-3">
            <Stat label="Verbrauch diese Woche" value={formatEuro(plan.estimatedCostCents)} hint={`Budget: ${formatEuro(plan.budgetCents)}`} />
            <Stat label="Einkauf (ganze Packungen)" value={formatEuro(packageTotal)} hint="Ohne Vorrat. Reste reichen oft für die nächste Woche." />
            {pantryTotal > 0 ? <Stat label="Vorrat, falls nicht zu Hause" value={formatEuro(pantryTotal)} hint="Gewürze, Saucen und Öle" /> : null}
            <p className="text-xs text-muted">
              Preise sind Richtwerte, angepasst an deinen Supermarkt. Tippe auf den Stift, um einen eigenen Preis zu hinterlegen.
            </p>
          </Card>
        </div>
      </div>
    </>
  );
}
