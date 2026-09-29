"use client";

import { useState, useTransition } from "react";
import { Plus } from "lucide-react";
import { IngredientPicker, type PickerIngredient } from "@/components/ingredient-picker";
import { Button } from "@/components/ui/button";
import { FormError, Input, Select } from "@/components/ui/form";
import { MEAL_LABELS, MEAL_TYPES, type MealTypeKey } from "@/lib/labels";
import { logIngredientAction, type LogResult } from "@/server/actions/log";

export function QuickAdd({
  ingredients,
  date,
  defaultMealType,
}: {
  ingredients: PickerIngredient[];
  date: string;
  defaultMealType: MealTypeKey;
}) {
  const [state, setState] = useState<LogResult>({});
  const [pending, startTransition] = useTransition();
  const [picked, setPicked] = useState<PickerIngredient | null>(null);
  const [resetKey, setResetKey] = useState(0);
  const [meal, setMeal] = useState<MealTypeKey>(defaultMealType);

  const action = (formData: FormData) =>
    startTransition(async () => {
      const result = await logIngredientAction({}, formData);
      setState(result);
      if (result.ok) {
        setPicked(null);
        setResetKey((k) => k + 1);
      }
    });

  const kcal = picked ? picked.kcal : null;

  return (
    <form action={action} className="space-y-3">
      <input type="hidden" name="date" value={date} />
      <input type="hidden" name="ingredientId" value={picked?.id ?? ""} />
      <IngredientPicker key={resetKey} ingredients={ingredients} value={picked} onChange={setPicked} placeholder="Lebensmittel suchen, z. B. Banane" />
      <div className="grid grid-cols-[1fr_1fr] gap-2 sm:grid-cols-[120px_1fr_auto]">
        <div className="relative">
          <Input key={resetKey} name="grams" type="number" inputMode="decimal" defaultValue={100} aria-label="Menge in Gramm" className="pr-8" />
          <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-sm text-muted">g</span>
        </div>
        <Select name="mealType" value={meal} onChange={(e) => setMeal(e.target.value as MealTypeKey)} aria-label="Mahlzeit">
          {MEAL_TYPES.map((m) => (
            <option key={m} value={m}>
              {MEAL_LABELS[m]}
            </option>
          ))}
        </Select>
        <Button type="submit" disabled={!picked || pending} className="col-span-2 sm:col-span-1">
          <Plus className="h-5 w-5" aria-hidden /> Eintragen
        </Button>
      </div>
      {kcal != null ? <p className="text-xs text-muted">{Math.round(kcal)} kcal pro 100 g</p> : null}
      <FormError message={state.error} />
    </form>
  );
}
