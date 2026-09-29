import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Trash2 } from "lucide-react";
import { AdminRecipeForm } from "@/components/admin/recipe-form";
import { Button } from "@/components/ui/button";
import { db } from "@/lib/db";
import { deleteRecipeAdminAction, type AdminRecipeInput } from "@/server/actions/admin";

export const metadata: Metadata = { title: "Rezept bearbeiten" };

export default async function AdminRecipeEditPage({ params }: PageProps<"/admin/rezepte/[id]">) {
  const { id } = await params;
  const ingredients = await db.ingredient.findMany({
    select: { id: true, name: true, category: true, kcal: true, protein: true },
    orderBy: { name: "asc" },
  });

  let initial: AdminRecipeInput;
  if (id === "neu") {
    initial = {
      title: "",
      description: "",
      mealType: "MITTAG",
      baseType: "REIS",
      servings: 2,
      prepMinutes: 30,
      tags: [],
      steps: [],
      published: true,
      ingredients: [],
    };
  } else {
    const r = await db.recipe.findUnique({ where: { id }, include: { ingredients: { orderBy: { position: "asc" } } } });
    if (!r) notFound();
    initial = {
      id: r.id,
      title: r.title,
      description: r.description,
      mealType: r.mealType,
      baseType: r.baseType,
      servings: r.servings,
      prepMinutes: r.prepMinutes,
      tags: r.tags,
      steps: r.steps,
      published: r.published,
      ingredients: r.ingredients.map((i) => ({ ingredientId: i.ingredientId, grams: i.grams })),
    };
  }

  return (
    <>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <Link href="/admin/rezepte" className="inline-flex items-center gap-1.5 text-sm font-bold text-muted hover:text-leaf-700">
          <ArrowLeft className="h-4 w-4" aria-hidden /> Alle Rezepte
        </Link>
        {initial.id ? (
          <form action={deleteRecipeAdminAction}>
            <input type="hidden" name="id" value={initial.id} />
            <Button type="submit" variant="danger" size="sm">
              <Trash2 className="h-4 w-4" aria-hidden /> Löschen
            </Button>
          </form>
        ) : null}
      </div>
      <AdminRecipeForm initial={initial} ingredients={ingredients} />
    </>
  );
}
