import type { Metadata } from "next";
import Link from "next/link";
import { Bookmark, ListChecks } from "lucide-react";
import { RecipeVisual } from "@/components/recipe-visual";
import { ButtonLink } from "@/components/ui/button";
import { Badge } from "@/components/ui/chip";
import { EmptyState, PageHeader } from "@/components/ui/page";
import { db } from "@/lib/db";
import { MEAL_LABELS } from "@/lib/labels";
import { formatEuro } from "@/lib/pricing";
import { requireProfileUser } from "@/server/auth";
import { loadUserContext } from "@/server/context";
import { summarize } from "@/server/recipes";

export const metadata: Metadata = { title: "Gespeichert" };

export default async function SavedPage() {
  const user = await requireProfileUser();
  const ctx = await loadUserContext(user.id);
  const saved = await db.savedRecipe.findMany({
    where: { userId: user.id },
    orderBy: { updatedAt: "desc" },
    include: { recipe: true, ingredients: { include: { ingredient: true } } },
  });

  return (
    <>
      <PageHeader title="Gespeicherte Rezepte" subtitle="Deine eigenen Versionen, mit ergänzten und gestrichenen Zutaten." />
      {saved.length === 0 ? (
        <EmptyState
          icon={Bookmark}
          title="Noch nichts gespeichert"
          text="Speichere Rezepte, um sie anzupassen und beim Kochen Zutaten abzuhaken."
          action={<ButtonLink href="/rezepte">Rezepte entdecken</ButtonLink>}
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {saved.map((s) => {
            const active = s.ingredients.filter((i) => !i.isRemoved);
            const sum = summarize(active, s.servings, ctx);
            const added = s.ingredients.filter((i) => i.isAdded).length;
            const removed = s.ingredients.filter((i) => i.isRemoved).length;
            const checked = active.filter((i) => i.isChecked).length;
            return (
              <Link
                key={s.id}
                href={`/gespeichert/${s.id}`}
                className="group flex overflow-hidden rounded-3xl bg-surface shadow-soft transition-shadow hover:shadow-lift"
              >
                <RecipeVisual baseType={s.recipe.baseType} className="w-24 shrink-0" iconClassName="h-8 w-8" />
                <div className="min-w-0 flex-1 p-4">
                  <p className="text-xs font-bold text-muted">{MEAL_LABELS[s.recipe.mealType]}</p>
                  <h3 className="font-extrabold leading-snug group-hover:text-leaf-700">{s.recipe.title}</h3>
                  <p className="mt-1 text-sm tabular-nums text-muted">
                    {Math.round(sum.perServing.kcal)} kcal · {Math.round(sum.perServing.protein)} g Protein ·{" "}
                    {formatEuro(sum.costPerServing)}
                  </p>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {added > 0 ? <Badge tone="butter">{added} ergänzt</Badge> : null}
                    {removed > 0 ? <Badge tone="peach">{removed} gestrichen</Badge> : null}
                    {checked > 0 ? (
                      <Badge>
                        <ListChecks className="h-3 w-3" aria-hidden /> {checked}/{active.length}
                      </Badge>
                    ) : null}
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </>
  );
}
