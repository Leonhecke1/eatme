"use client";

import { useActionState, useState } from "react";
import { Check, Minus, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FormError, Select } from "@/components/ui/form";
import { MEAL_LABELS, MEAL_TYPES, type MealTypeKey } from "@/lib/labels";
import { logRecipeAction, type LogResult } from "@/server/actions/log";

export function LogRecipeForm({
  source,
  refId,
  defaultMealType,
  date,
}: {
  source: "RECIPE" | "SAVED_RECIPE";
  refId: string;
  defaultMealType: MealTypeKey;
  date: string;
}) {
  const [state, action, pending] = useActionState<LogResult, FormData>(logRecipeAction, {});
  const [servings, setServings] = useState(1);
  return (
    <form action={action} className="space-y-3">
      <input type="hidden" name="source" value={source} />
      <input type="hidden" name="refId" value={refId} />
      <input type="hidden" name="date" value={date} />
      <input type="hidden" name="servings" value={servings} />
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center rounded-2xl border border-line bg-surface">
          <Button variant="ghost" size="icon" aria-label="Weniger" onClick={() => setServings(Math.max(0.5, servings - 0.5))}>
            <Minus className="h-4 w-4" aria-hidden />
          </Button>
          <span className="min-w-20 text-center text-sm font-bold tabular-nums">
            {servings.toLocaleString("de-DE")} {servings === 1 ? "Portion" : "Portionen"}
          </span>
          <Button variant="ghost" size="icon" aria-label="Mehr" onClick={() => setServings(Math.min(6, servings + 0.5))}>
            <Plus className="h-4 w-4" aria-hidden />
          </Button>
        </div>
        <Select name="mealType" defaultValue={defaultMealType} className="w-auto min-w-40" aria-label="Mahlzeit">
          {MEAL_TYPES.map((m) => (
            <option key={m} value={m}>
              {MEAL_LABELS[m]}
            </option>
          ))}
        </Select>
      </div>
      <FormError message={state.error} />
      <Button type="submit" disabled={pending} className="w-full sm:w-auto">
        {state.ok ? <Check className="h-5 w-5" aria-hidden /> : null}
        {pending ? "Wird eingetragen ..." : state.ok ? "Eingetragen, nochmal?" : "Als gegessen eintragen"}
      </Button>
    </form>
  );
}
