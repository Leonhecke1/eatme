"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Check, Minus, Plus, RotateCcw, Trash2, Undo2, X } from "lucide-react";
import { IngredientPicker, type PickerIngredient } from "@/components/ingredient-picker";
import { NutritionPanel } from "@/components/nutrition-panel";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/chip";
import { Input, Textarea } from "@/components/ui/form";
import { cn } from "@/lib/cn";
import { formatGrams } from "@/lib/labels";
import { roundMacros, scaleMacros, sumIngredients, type NutrientSource } from "@/lib/nutrition/calc";
import { formatEuro } from "@/lib/pricing";
import {
  addIngredientAction,
  deleteAddedItemAction,
  resetChecksAction,
  toggleCheckedAction,
  toggleRemovedAction,
  updateGramsAction,
  updateSavedMetaAction,
} from "@/server/actions/recipes";

export interface EditorIngredient extends PickerIngredient, NutrientSource {
  price: number;
  unitName: string | null;
  gramsPerUnit: number | null;
}

export interface EditorItem {
  id: string;
  ingredientId: string;
  grams: number;
  isAdded: boolean;
  isRemoved: boolean;
  isChecked: boolean;
}

export function SavedRecipeEditor({
  savedId,
  initialItems,
  initialServings,
  initialNote,
  ingredients,
}: {
  savedId: string;
  initialItems: EditorItem[];
  initialServings: number;
  initialNote: string;
  ingredients: EditorIngredient[];
}) {
  const router = useRouter();
  const [items, setItems] = useState(initialItems);
  const [servings, setServings] = useState(initialServings);
  const [note, setNote] = useState(initialNote);
  const [picked, setPicked] = useState<PickerIngredient | null>(null);
  const [grams, setGrams] = useState("100");
  const [pickerKey, setPickerKey] = useState(0);
  const [, startTransition] = useTransition();
  const byId = useMemo(() => new Map(ingredients.map((i) => [i.id, i])), [ingredients]);

  const run = (fn: () => Promise<unknown>) =>
    startTransition(async () => {
      try {
        await fn();
      } catch {
        router.refresh();
      }
    });

  const patch = (id: string, p: Partial<EditorItem>) => setItems((list) => list.map((it) => (it.id === id ? { ...it, ...p } : it)));

  const active = items.filter((i) => !i.isRemoved);
  const checkedCount = active.filter((i) => i.isChecked).length;
  const summary = useMemo(() => {
    const rows = active.map((i) => ({ grams: i.grams, ingredient: byId.get(i.ingredientId)! })).filter((r) => r.ingredient);
    const total = sumIngredients(rows);
    const cost = rows.reduce((s, r) => s + (r.ingredient.price * r.grams) / 100, 0);
    return { perServing: roundMacros(scaleMacros(total, 1 / servings)), costPerServing: Math.round(cost / servings), cost: Math.round(cost) };
  }, [active, byId, servings]);

  const addItem = () => {
    const g = Number(grams.replace(",", "."));
    if (!picked || !(g > 0)) return;
    const tempId = `tmp-${Date.now()}`;
    const ingredientId = picked.id;
    setItems((list) => [...list, { id: tempId, ingredientId, grams: g, isAdded: true, isRemoved: false, isChecked: false }]);
    setPicked(null);
    setGrams("100");
    setPickerKey((k) => k + 1);
    run(async () => {
      const id = await addIngredientAction(savedId, ingredientId, g);
      if (id) patch(tempId, { id });
      else setItems((list) => list.filter((i) => i.id !== tempId));
    });
  };

  return (
    <div className="grid gap-5 lg:grid-cols-[1fr_360px]">
      <div className="space-y-5">
        <Card>
          <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-lg font-extrabold">Zutaten</h2>
            <div className="flex items-center rounded-2xl border border-line">
              <Button
                variant="ghost"
                size="icon-sm"
                aria-label="Weniger Portionen"
                onClick={() => {
                  const s = Math.max(1, servings - 1);
                  setServings(s);
                  run(() => updateSavedMetaAction(savedId, { servings: s }));
                }}
              >
                <Minus className="h-4 w-4" aria-hidden />
              </Button>
              <span className="min-w-24 text-center text-sm font-bold tabular-nums">{servings} Portionen</span>
              <Button
                variant="ghost"
                size="icon-sm"
                aria-label="Mehr Portionen"
                onClick={() => {
                  const s = Math.min(12, servings + 1);
                  setServings(s);
                  run(() => updateSavedMetaAction(savedId, { servings: s }));
                }}
              >
                <Plus className="h-4 w-4" aria-hidden />
              </Button>
            </div>
          </div>
          <p className="mb-3 text-xs text-muted">
            Die Portionenzahl legt fest, wie die Mengen aufgeteilt werden. Mengen änderst du direkt an der Zutat.
          </p>

          <div className="mb-4">
            <div className="mb-1.5 flex justify-between text-sm">
              <span className="font-bold">Beim Kochen verwendet</span>
              <span className="tabular-nums text-muted">
                {checkedCount} von {active.length}
              </span>
            </div>
            <div className="h-2.5 rounded-full bg-mint-100">
              <div
                className="h-full rounded-full bg-leaf-400 transition-all"
                style={{ width: `${active.length ? (checkedCount / active.length) * 100 : 0}%` }}
              />
            </div>
          </div>

          <ul className="divide-y divide-line">
            {items.map((it) => {
              const ing = byId.get(it.ingredientId);
              if (!ing) return null;
              return (
                <li key={it.id} className="flex items-center gap-3 py-2.5">
                  <button
                    type="button"
                    role="checkbox"
                    aria-checked={it.isChecked}
                    aria-label={`${ing.name} als verwendet markieren`}
                    disabled={it.isRemoved}
                    onClick={() => {
                      patch(it.id, { isChecked: !it.isChecked });
                      run(() => toggleCheckedAction(it.id));
                    }}
                    className={cn(
                      "flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 transition-colors",
                      it.isChecked ? "border-leaf-600 bg-leaf-600 text-white" : "border-mint-300 bg-surface hover:border-leaf-500",
                      it.isRemoved && "opacity-30",
                    )}
                  >
                    {it.isChecked ? <Check className="h-4 w-4" aria-hidden /> : null}
                  </button>
                  <div className="min-w-0 flex-1">
                    <p
                      className={cn(
                        "truncate font-semibold",
                        it.isRemoved && "text-muted line-through decoration-2",
                        it.isChecked && !it.isRemoved && "text-muted",
                      )}
                    >
                      {ing.name}
                      {it.isAdded ? (
                        <Badge tone="butter" className="ml-2 align-middle no-underline">
                          ergänzt
                        </Badge>
                      ) : null}
                    </p>
                    {ing.unitName && ing.gramsPerUnit && !it.isRemoved ? (
                      <p className="text-xs text-muted">
                        ca. {(Math.round((it.grams / ing.gramsPerUnit) * 2) / 2 || 0.5).toLocaleString("de-DE")} {ing.unitName}
                      </p>
                    ) : null}
                  </div>
                  <GramsInput
                    value={it.grams}
                    disabled={it.isRemoved}
                    onCommit={(g) => {
                      patch(it.id, { grams: g });
                      run(() => updateGramsAction(it.id, g));
                    }}
                  />
                  {it.isAdded ? (
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      aria-label={`${ing.name} löschen`}
                      onClick={() => {
                        setItems((list) => list.filter((x) => x.id !== it.id));
                        run(() => deleteAddedItemAction(it.id));
                      }}
                    >
                      <Trash2 className="h-4 w-4" aria-hidden />
                    </Button>
                  ) : (
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      aria-label={it.isRemoved ? `${ing.name} wiederherstellen` : `${ing.name} streichen`}
                      title={it.isRemoved ? "Wiederherstellen" : "Streichen"}
                      onClick={() => {
                        patch(it.id, { isRemoved: !it.isRemoved, isChecked: false });
                        run(() => toggleRemovedAction(it.id));
                      }}
                    >
                      {it.isRemoved ? <Undo2 className="h-4 w-4" aria-hidden /> : <X className="h-4 w-4" aria-hidden />}
                    </Button>
                  )}
                </li>
              );
            })}
          </ul>

          <div className="mt-4 rounded-2xl bg-mint-50 p-3">
            <p className="mb-2 text-sm font-bold">Zutat ergänzen</p>
            <div className="grid gap-2 sm:grid-cols-[1fr_110px_auto]">
              <IngredientPicker key={pickerKey} ingredients={ingredients} value={picked} onChange={setPicked} />
              <Input
                type="number"
                inputMode="decimal"
                aria-label="Menge in Gramm"
                value={grams}
                onChange={(e) => setGrams(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && addItem()}
              />
              <Button onClick={addItem} disabled={!picked}>
                <Plus className="h-5 w-5" aria-hidden /> Hinzufügen
              </Button>
            </div>
          </div>

          {checkedCount > 0 ? (
            <Button
              variant="ghost"
              size="sm"
              className="mt-3"
              onClick={() => {
                setItems((list) => list.map((i) => ({ ...i, isChecked: false })));
                run(() => resetChecksAction(savedId));
              }}
            >
              <RotateCcw className="h-4 w-4" aria-hidden /> Häkchen zurücksetzen
            </Button>
          ) : null}
        </Card>

        <Card>
          <label htmlFor="note" className="mb-2 block text-lg font-extrabold">
            Eigene Notiz
          </label>
          <Textarea
            id="note"
            value={note}
            placeholder="z. B. mehr Chili, statt Brokkoli auch Blumenkohl"
            onChange={(e) => setNote(e.target.value)}
            onBlur={() => run(() => updateSavedMetaAction(savedId, { note }))}
          />
        </Card>
      </div>

      <div className="lg:sticky lg:top-8 lg:self-start">
        <Card>
          <NutritionPanel perServing={summary.perServing} costPerServing={summary.costPerServing} label="Deine Version pro Portion" />
          <p className="mt-3 text-sm text-muted">Gesamt ca. {formatEuro(summary.cost)} für {servings} Portionen.</p>
        </Card>
      </div>
    </div>
  );
}

function GramsInput({ value, disabled, onCommit }: { value: number; disabled?: boolean; onCommit: (g: number) => void }) {
  const [draft, setDraft] = useState<string | null>(null);
  const commit = () => {
    if (draft === null) return;
    const g = Math.round(Number(draft.replace(",", ".")) * 10) / 10;
    setDraft(null);
    if (g > 0 && g <= 5000 && g !== value) onCommit(g);
  };
  if (disabled) return <span className="w-20 text-right text-sm tabular-nums text-muted line-through">{formatGrams(value)}</span>;
  return (
    <div className="flex w-24 items-center rounded-xl border border-line bg-surface focus-within:border-leaf-400">
      <input
        type="number"
        inputMode="decimal"
        aria-label="Menge in Gramm"
        className="h-9 w-full min-w-0 rounded-xl bg-transparent pl-2.5 text-right text-sm font-bold tabular-nums focus:outline-none"
        value={draft ?? String(value)}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key === "Enter") (e.target as HTMLInputElement).blur();
        }}
      />
      <span className="pr-2.5 text-sm text-muted">g</span>
    </div>
  );
}
