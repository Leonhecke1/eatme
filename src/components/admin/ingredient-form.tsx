"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { FormError, Input } from "@/components/ui/form";
import { ALLERGENS, ALLERGEN_LABELS } from "@/lib/labels";
import { saveIngredientAdminAction, type AdminState } from "@/server/actions/admin";

export interface AdminIngredient {
  id?: string;
  name: string;
  category: string;
  kcal: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
  pricePer100gCents: number;
  packageGrams: number;
  unitName: string | null;
  gramsPerUnit: number | null;
  allergens: string[];
}

const FIELDS: [keyof AdminIngredient, string][] = [
  ["kcal", "kcal / 100 g"],
  ["protein", "Protein g"],
  ["carbs", "KH g"],
  ["fat", "Fett g"],
  ["fiber", "Ballastst. g"],
  ["pricePer100gCents", "Cent / 100 g"],
  ["packageGrams", "Packung g"],
  ["gramsPerUnit", "g / Einheit"],
];

export function AdminIngredientForm({ ingredient, categories }: { ingredient: AdminIngredient; categories: string[] }) {
  const [state, action, pending] = useActionState<AdminState, FormData>(saveIngredientAdminAction, {});
  const listId = `cats-${ingredient.id ?? "new"}`;
  return (
    <form action={action} className="space-y-3">
      {ingredient.id ? <input type="hidden" name="id" value={ingredient.id} /> : null}
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
        <label className="text-xs font-bold text-muted">
          Name
          <Input name="name" defaultValue={ingredient.name} required className="mt-1 h-10" />
        </label>
        <label className="text-xs font-bold text-muted">
          Kategorie
          <Input name="category" defaultValue={ingredient.category} list={listId} required className="mt-1 h-10" />
          <datalist id={listId}>
            {categories.map((c) => (
              <option key={c} value={c} />
            ))}
          </datalist>
        </label>
        <label className="text-xs font-bold text-muted">
          Einheit (optional)
          <Input name="unitName" defaultValue={ingredient.unitName ?? ""} placeholder="z. B. Stück" className="mt-1 h-10" />
        </label>
      </div>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-8">
        {FIELDS.map(([key, label]) => (
          <label key={key} className="text-xs font-bold text-muted">
            {label}
            <Input
              name={key}
              inputMode="decimal"
              defaultValue={(ingredient[key] as number | null) ?? ""}
              className="mt-1 h-10"
              required={key !== "gramsPerUnit" && key !== "fiber"}
            />
          </label>
        ))}
      </div>
      <div className="flex flex-wrap gap-3">
        {ALLERGENS.map((a) => (
          <label key={a} className="flex items-center gap-2 text-sm font-bold">
            <input type="checkbox" name="allergens" value={a} defaultChecked={ingredient.allergens.includes(a)} className="h-4 w-4 accent-leaf-600" />
            {ALLERGEN_LABELS[a]}
          </label>
        ))}
      </div>
      <FormError message={state.error} />
      {state.ok ? <p className="text-sm font-bold text-leaf-700">{state.ok}</p> : null}
      <Button type="submit" size="sm" disabled={pending}>
        {ingredient.id ? "Speichern" : "Zutat anlegen"}
      </Button>
    </form>
  );
}
