import type { Metadata } from "next";
import { Search } from "lucide-react";
import { AdminIngredientForm } from "@/components/admin/ingredient-form";
import { Card, SectionTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/form";
import { db } from "@/lib/db";

export const metadata: Metadata = { title: "Zutaten verwalten" };

export default async function AdminIngredientsPage({ searchParams }: PageProps<"/admin/zutaten">) {
  const sp = await searchParams;
  const q = typeof sp.q === "string" ? sp.q.slice(0, 60) : "";
  const [ingredients, categories] = await Promise.all([
    db.ingredient.findMany({
      where: q ? { name: { contains: q, mode: "insensitive" } } : undefined,
      orderBy: [{ category: "asc" }, { name: "asc" }],
    }),
    db.ingredient.findMany({ distinct: ["category"], select: { category: true }, orderBy: { category: "asc" } }),
  ]);
  const cats = categories.map((c) => c.category);

  return (
    <div className="space-y-5">
      <Card>
        <SectionTitle>Neue Zutat</SectionTitle>
        <AdminIngredientForm
          categories={cats}
          ingredient={{
            name: "",
            category: "",
            kcal: 0,
            protein: 0,
            carbs: 0,
            fat: 0,
            fiber: 0,
            pricePer100gCents: 0,
            packageGrams: 500,
            unitName: null,
            gramsPerUnit: null,
            allergens: [],
          }}
        />
      </Card>

      <form action="/admin/zutaten" className="relative">
        <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" aria-hidden />
        <Input name="q" defaultValue={q} placeholder="Zutat suchen" className="pl-10" aria-label="Zutat suchen" />
      </form>

      <p className="text-sm text-muted">
        {ingredients.length} Zutaten. Preise sind Richtpreise (Faktor 1,0), die mit dem Supermarkt-Faktor der Nutzer multipliziert werden.
      </p>
      <div className="space-y-2">
        {ingredients.map((i) => (
          <details key={i.id} className="group rounded-2xl bg-surface shadow-soft">
            <summary className="flex cursor-pointer list-none items-center gap-3 px-4 py-3">
              <span className="min-w-0 flex-1 truncate font-bold">{i.name}</span>
              <span className="hidden text-xs text-muted sm:inline">{i.category}</span>
              <span className="text-xs tabular-nums text-muted">
                {Math.round(i.kcal)} kcal · {i.protein} g P · {(i.pricePer100gCents / 100).toFixed(2).replace(".", ",")} Euro/100 g
              </span>
            </summary>
            <div className="border-t border-line p-4">
              <AdminIngredientForm ingredient={i} categories={cats} />
            </div>
          </details>
        ))}
      </div>
    </div>
  );
}
