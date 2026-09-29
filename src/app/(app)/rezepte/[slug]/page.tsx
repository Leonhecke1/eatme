import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft, BookmarkPlus, Clock, Users } from "lucide-react";
import { LogRecipeForm } from "@/components/log-recipe-form";
import { NutritionPanel } from "@/components/nutrition-panel";
import { RecipeVisual } from "@/components/recipe-visual";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/chip";
import { db } from "@/lib/db";
import { todayISO } from "@/lib/dates";
import { ALLERGEN_LABELS, BASE_LABELS, MEAL_LABELS, TAG_LABELS, formatGrams, type AllergenKey } from "@/lib/labels";
import { formatEuro } from "@/lib/pricing";
import { saveRecipeAction } from "@/server/actions/recipes";
import { requireProfileUser } from "@/server/auth";
import { loadUserContext } from "@/server/context";
import { getRecipeBySlug, summarize } from "@/server/recipes";

export async function generateMetadata({ params }: PageProps<"/rezepte/[slug]">): Promise<Metadata> {
  const recipe = await getRecipeBySlug((await params).slug);
  return { title: recipe?.title ?? "Rezept" };
}

export default async function RecipePage({ params }: PageProps<"/rezepte/[slug]">) {
  const user = await requireProfileUser();
  const recipe = await getRecipeBySlug((await params).slug);
  if (!recipe || !recipe.published) notFound();
  const saved = await db.savedRecipe.findUnique({ where: { userId_recipeId: { userId: user.id, recipeId: recipe.id } } });
  if (saved) redirect(`/gespeichert/${saved.id}`);

  const ctx = await loadUserContext(user.id);
  const summary = summarize(recipe.ingredients, recipe.servings, ctx);
  const conflicts = summary.allergens.filter((a) => ctx.profile.allergies.includes(a));

  return (
    <>
      <Link href="/rezepte" className="mb-4 inline-flex items-center gap-1.5 text-sm font-bold text-muted hover:text-leaf-700">
        <ArrowLeft className="h-4 w-4" aria-hidden /> Alle Rezepte
      </Link>
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[1fr_380px]">
        <div className="space-y-5">
          <Card className="overflow-hidden p-0 sm:p-0">
            <RecipeVisual baseType={recipe.baseType} className="h-36 sm:h-44" iconClassName="h-14 w-14" />
            <div className="p-5">
              <div className="mb-2 flex flex-wrap gap-1.5">
                <Badge>{MEAL_LABELS[recipe.mealType]}</Badge>
                <Badge tone="sky">{BASE_LABELS[recipe.baseType]}</Badge>
                {recipe.tags.map((t) => (
                  <Badge key={t} tone="butter">
                    {TAG_LABELS[t] ?? t}
                  </Badge>
                ))}
              </div>
              <h1 className="text-2xl font-extrabold sm:text-3xl">{recipe.title}</h1>
              <p className="mt-2 text-muted">{recipe.description}</p>
              <div className="mt-3 flex flex-wrap gap-4 text-sm font-bold text-muted">
                <span className="inline-flex items-center gap-1.5">
                  <Clock className="h-4 w-4" aria-hidden /> {recipe.prepMinutes} Minuten
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <Users className="h-4 w-4" aria-hidden /> {recipe.servings} Portionen
                </span>
              </div>
              {conflicts.length > 0 ? (
                <p className="mt-3 rounded-2xl bg-peach-100 px-4 py-3 text-sm font-bold text-peach-700">
                  Achtung: enthält {conflicts.map((a) => ALLERGEN_LABELS[a as AllergenKey]).join(", ")}.
                </p>
              ) : null}
            </div>
          </Card>

          <Card>
            <h2 className="mb-3 text-lg font-extrabold">Zutaten für {recipe.servings} Portionen</h2>
            <ul className="divide-y divide-line">
              {recipe.ingredients.map((ri) => (
                <li key={ri.id} className="flex items-center justify-between gap-3 py-2.5">
                  <span className="font-semibold">{ri.ingredient.name}</span>
                  <span className="shrink-0 text-sm tabular-nums text-muted">
                    {formatGrams(ri.grams)}
                    {ri.ingredient.unitName && ri.ingredient.gramsPerUnit
                      ? ` (ca. ${Math.max(0.5, Math.round((ri.grams / ri.ingredient.gramsPerUnit) * 2) / 2).toLocaleString("de-DE")} ${ri.ingredient.unitName})`
                      : ""}
                  </span>
                </li>
              ))}
            </ul>
            <p className="mt-3 text-sm text-muted">Gesamtkosten ca. {formatEuro(summary.costTotal)}</p>
          </Card>

          <Card>
            <h2 className="mb-3 text-lg font-extrabold">Zubereitung</h2>
            <ol className="space-y-3">
              {recipe.steps.map((s, i) => (
                <li key={i} className="flex gap-3">
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-mint-100 text-sm font-extrabold text-leaf-700">
                    {i + 1}
                  </span>
                  <p className="pt-0.5">{s}</p>
                </li>
              ))}
            </ol>
          </Card>
        </div>

        <div className="space-y-5 lg:sticky lg:top-8 lg:self-start">
          <Card>
            <NutritionPanel perServing={summary.perServing} costPerServing={summary.costPerServing} />
          </Card>
          <Card>
            <h2 className="mb-1 font-extrabold">Anpassen und speichern</h2>
            <p className="mb-3 text-sm text-muted">
              Speichere das Rezept in deinem Profil, um Zutaten zu ergänzen, zu streichen oder beim Kochen abzuhaken.
            </p>
            <form action={saveRecipeAction}>
              <input type="hidden" name="recipeId" value={recipe.id} />
              <Button type="submit" className="w-full">
                <BookmarkPlus className="h-5 w-5" aria-hidden /> Rezept speichern
              </Button>
            </form>
          </Card>
          <Card>
            <h2 className="mb-3 font-extrabold">Gegessen?</h2>
            <LogRecipeForm source="RECIPE" refId={recipe.id} defaultMealType={recipe.mealType} date={todayISO()} />
          </Card>
        </div>
      </div>
    </>
  );
}
