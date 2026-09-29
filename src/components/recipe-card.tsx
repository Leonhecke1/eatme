import Link from "next/link";
import { BookmarkCheck, Clock } from "lucide-react";
import { RecipeVisual } from "@/components/recipe-visual";
import { Badge } from "@/components/ui/chip";
import { ALLERGEN_LABELS, BASE_LABELS, MEAL_LABELS, type AllergenKey } from "@/lib/labels";
import { formatEuro } from "@/lib/pricing";
import type { RecipeSummary } from "@/server/recipes";

export function RecipeCard({ recipe, userAllergies }: { recipe: RecipeSummary; userAllergies: string[] }) {
  const conflicts = recipe.allergens.filter((a) => userAllergies.includes(a));
  const href = recipe.savedId ? `/gespeichert/${recipe.savedId}` : `/rezepte/${recipe.slug}`;
  return (
    <Link
      href={href}
      className="group flex flex-col overflow-hidden rounded-3xl bg-surface shadow-soft transition-shadow hover:shadow-lift"
    >
      <div className="relative">
        <RecipeVisual baseType={recipe.baseType} className="h-28" />
        {recipe.savedId ? (
          <span className="absolute right-3 top-3 flex items-center gap-1 rounded-full bg-surface/90 px-2.5 py-1 text-xs font-bold text-leaf-700">
            <BookmarkCheck className="h-3.5 w-3.5" aria-hidden /> Gespeichert
          </span>
        ) : null}
        <span className="absolute bottom-3 left-3 rounded-full bg-surface/90 px-2.5 py-1 text-xs font-bold text-ink">
          {MEAL_LABELS[recipe.mealType]}
        </span>
      </div>
      <div className="flex flex-1 flex-col p-4">
        <h3 className="font-extrabold leading-snug text-ink group-hover:text-leaf-700">{recipe.title}</h3>
        <p className="mt-1 line-clamp-2 text-sm text-muted">{recipe.description}</p>
        <div className="mt-3 grid grid-cols-3 gap-1.5 text-center">
          <Mini label="kcal" value={recipe.perServing.kcal} />
          <Mini label="Protein" value={`${Math.round(recipe.perServing.protein)} g`} />
          <Mini label="Portion" value={formatEuro(recipe.costPerServing)} />
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-1.5">
          <Badge tone="sky">
            <Clock className="h-3 w-3" aria-hidden /> {recipe.prepMinutes} Min.
          </Badge>
          <Badge>{BASE_LABELS[recipe.baseType]}</Badge>
          {recipe.tags.includes("proteinreich") ? <Badge tone="butter">Proteinreich</Badge> : null}
          {conflicts.map((a) => (
            <Badge key={a} tone="peach">
              Enthält {ALLERGEN_LABELS[a as AllergenKey]}
            </Badge>
          ))}
        </div>
      </div>
    </Link>
  );
}

function Mini({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-xl bg-mint-50 px-1 py-1.5">
      <div className="text-sm font-extrabold tabular-nums text-ink">{value}</div>
      <div className="text-[10px] font-bold uppercase tracking-wide text-muted">{label}</div>
    </div>
  );
}
