import type { Metadata } from "next";
import Link from "next/link";
import { Plus } from "lucide-react";
import { ButtonLink } from "@/components/ui/button";
import { Badge } from "@/components/ui/chip";
import { db } from "@/lib/db";
import { BASE_LABELS, MEAL_LABELS } from "@/lib/labels";

export const metadata: Metadata = { title: "Rezepte verwalten" };

export default async function AdminRecipesPage({ searchParams }: PageProps<"/admin/rezepte">) {
  const sp = await searchParams;
  const recipes = await db.recipe.findMany({
    orderBy: [{ published: "desc" }, { title: "asc" }],
    include: { _count: { select: { saved: true, ingredients: true } } },
  });
  return (
    <>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted">{recipes.length} Rezepte</p>
        <ButtonLink href="/admin/rezepte/neu">
          <Plus className="h-5 w-5" aria-hidden /> Neues Rezept
        </ButtonLink>
      </div>
      {sp.gespeichert ? (
        <p className="mb-4 rounded-2xl bg-mint-100 px-4 py-3 text-sm font-bold text-leaf-700">Rezept gespeichert.</p>
      ) : null}
      <ul className="divide-y divide-line overflow-hidden rounded-3xl bg-surface shadow-soft">
        {recipes.map((r) => (
          <li key={r.id}>
            <Link href={`/admin/rezepte/${r.id}`} className="flex flex-wrap items-center gap-2 px-4 py-3 hover:bg-mint-50">
              <span className="min-w-0 flex-1 font-bold">{r.title}</span>
              <Badge>{MEAL_LABELS[r.mealType]}</Badge>
              <Badge tone="sky">{BASE_LABELS[r.baseType]}</Badge>
              <span className="text-xs text-muted">
                {r._count.ingredients} Zutaten · {r._count.saved}x gespeichert
              </span>
              {!r.published ? <Badge tone="peach">Versteckt</Badge> : null}
            </Link>
          </li>
        ))}
      </ul>
    </>
  );
}
