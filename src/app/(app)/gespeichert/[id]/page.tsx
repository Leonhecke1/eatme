import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, BookmarkX, Clock, RotateCcw } from "lucide-react";
import { LogRecipeForm } from "@/components/log-recipe-form";
import { SavedRecipeEditor } from "@/components/saved-recipe-editor";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/chip";
import { todayISO } from "@/lib/dates";
import { BASE_LABELS, MEAL_LABELS } from "@/lib/labels";
import { resetToOriginalAction, unsaveRecipeAction } from "@/server/actions/recipes";
import { requireProfileUser } from "@/server/auth";
import { loadUserContext } from "@/server/context";
import { allIngredientsForPicker, getSavedRecipe } from "@/server/recipes";

export async function generateMetadata({ params }: PageProps<"/gespeichert/[id]">): Promise<Metadata> {
  const user = await requireProfileUser();
  const saved = await getSavedRecipe(user.id, (await params).id);
  return { title: saved?.recipe.title ?? "Rezept" };
}

export default async function SavedRecipePage({ params }: PageProps<"/gespeichert/[id]">) {
  const user = await requireProfileUser();
  const saved = await getSavedRecipe(user.id, (await params).id);
  if (!saved) notFound();
  const [ctx, all] = await Promise.all([loadUserContext(user.id), allIngredientsForPicker()]);

  const ingredients = all.map((i) => ({
    id: i.id,
    name: i.name,
    category: i.category,
    kcal: i.kcal,
    protein: i.protein,
    carbs: i.carbs,
    fat: i.fat,
    fiber: i.fiber,
    price: ctx.priceOf(i),
    unitName: i.unitName,
    gramsPerUnit: i.gramsPerUnit,
  }));

  return (
    <>
      <Link href="/gespeichert" className="mb-4 inline-flex items-center gap-1.5 text-sm font-bold text-muted hover:text-leaf-700">
        <ArrowLeft className="h-4 w-4" aria-hidden /> Gespeicherte Rezepte
      </Link>
      <header className="mb-5">
        <div className="mb-2 flex flex-wrap gap-1.5">
          <Badge>{MEAL_LABELS[saved.recipe.mealType]}</Badge>
          <Badge tone="sky">{BASE_LABELS[saved.recipe.baseType]}</Badge>
          <Badge tone="butter">
            <Clock className="h-3 w-3" aria-hidden /> {saved.recipe.prepMinutes} Min.
          </Badge>
        </div>
        <h1 className="text-2xl font-extrabold sm:text-3xl">{saved.recipe.title}</h1>
        <p className="mt-1 text-muted">{saved.recipe.description}</p>
      </header>

      <SavedRecipeEditor
        key={`${saved.servings}-${saved.ingredients.map((i) => i.id).join(",")}`}
        savedId={saved.id}
        initialServings={saved.servings}
        initialNote={saved.note ?? ""}
        initialItems={saved.ingredients.map((i) => ({
          id: i.id,
          ingredientId: i.ingredientId,
          grams: i.grams,
          isAdded: i.isAdded,
          isRemoved: i.isRemoved,
          isChecked: i.isChecked,
        }))}
        ingredients={ingredients}
      />

      <div className="mt-5 grid grid-cols-1 gap-5 lg:grid-cols-[1fr_360px]">
        <Card>
          <h2 className="mb-3 text-lg font-extrabold">Zubereitung</h2>
          <ol className="space-y-3">
            {saved.recipe.steps.map((s, i) => (
              <li key={i} className="flex gap-3">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-mint-100 text-sm font-extrabold text-leaf-700">
                  {i + 1}
                </span>
                <p className="pt-0.5">{s}</p>
              </li>
            ))}
          </ol>
        </Card>
        <div className="space-y-5">
          <Card>
            <h2 className="mb-3 font-extrabold">Gegessen?</h2>
            <LogRecipeForm source="SAVED_RECIPE" refId={saved.id} defaultMealType={saved.recipe.mealType} date={todayISO()} />
          </Card>
          <Card className="space-y-2">
            <form action={resetToOriginalAction}>
              <input type="hidden" name="savedRecipeId" value={saved.id} />
              <Button type="submit" variant="secondary" className="w-full">
                <RotateCcw className="h-4 w-4" aria-hidden /> Auf Original zurücksetzen
              </Button>
            </form>
            <form action={unsaveRecipeAction}>
              <input type="hidden" name="savedRecipeId" value={saved.id} />
              <input type="hidden" name="redirect" value="1" />
              <Button type="submit" variant="danger" className="w-full">
                <BookmarkX className="h-4 w-4" aria-hidden /> Aus Gespeichert entfernen
              </Button>
            </form>
          </Card>
        </div>
      </div>
    </>
  );
}
