"use client";

import { useMemo, useState, useTransition } from "react";
import { ArrowDown, ArrowUp, Plus, Trash2 } from "lucide-react";
import { IngredientPicker, type PickerIngredient } from "@/components/ingredient-picker";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Chip } from "@/components/ui/chip";
import { Field, FormError, Input, Select, Textarea } from "@/components/ui/form";
import { BASE_LABELS, BASE_TYPES, MEAL_LABELS, MEAL_TYPES, TAG_LABELS } from "@/lib/labels";
import { saveRecipeAdminAction, type AdminRecipeInput } from "@/server/actions/admin";

type Ing = PickerIngredient & { protein: number };

export function AdminRecipeForm({ initial, ingredients }: { initial: AdminRecipeInput; ingredients: Ing[] }) {
  const [data, setData] = useState(initial);
  const [stepsText, setStepsText] = useState(initial.steps.join("\n"));
  const [picked, setPicked] = useState<PickerIngredient | null>(null);
  const [grams, setGrams] = useState("100");
  const [pickerKey, setPickerKey] = useState(0);
  const [error, setError] = useState<string>();
  const [pending, startTransition] = useTransition();
  const byId = useMemo(() => new Map(ingredients.map((i) => [i.id, i])), [ingredients]);

  const set = <K extends keyof AdminRecipeInput>(k: K, v: AdminRecipeInput[K]) => setData((d) => ({ ...d, [k]: v }));
  const perServing = useMemo(() => {
    let kcal = 0;
    let protein = 0;
    for (const ri of data.ingredients) {
      const i = byId.get(ri.ingredientId);
      if (!i) continue;
      kcal += (i.kcal * ri.grams) / 100;
      protein += (i.protein * ri.grams) / 100;
    }
    return { kcal: Math.round(kcal / data.servings), protein: Math.round(protein / data.servings) };
  }, [data.ingredients, data.servings, byId]);

  const move = (idx: number, dir: -1 | 1) => {
    const list = [...data.ingredients];
    const j = idx + dir;
    if (j < 0 || j >= list.length) return;
    [list[idx], list[j]] = [list[j], list[idx]];
    set("ingredients", list);
  };

  const submit = () => {
    setError(undefined);
    const steps = stepsText.split("\n").map((s) => s.trim()).filter(Boolean);
    startTransition(async () => {
      const res = await saveRecipeAdminAction({ ...data, steps });
      if (res?.error) setError(res.error);
    });
  };

  return (
    <div className="grid gap-5 lg:grid-cols-[1fr_320px]">
      <div className="space-y-5">
        <Card className="grid gap-4 sm:grid-cols-2">
          <Field label="Titel" className="sm:col-span-2">
            <Input value={data.title} onChange={(e) => set("title", e.target.value)} />
          </Field>
          <Field label="Beschreibung" className="sm:col-span-2">
            <Textarea value={data.description} onChange={(e) => set("description", e.target.value)} />
          </Field>
          <Field label="Mahlzeit">
            <Select value={data.mealType} onChange={(e) => set("mealType", e.target.value as AdminRecipeInput["mealType"])}>
              {MEAL_TYPES.map((m) => (
                <option key={m} value={m}>
                  {MEAL_LABELS[m]}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Beilage / Kategorie">
            <Select value={data.baseType} onChange={(e) => set("baseType", e.target.value as AdminRecipeInput["baseType"])}>
              {BASE_TYPES.map((b) => (
                <option key={b} value={b}>
                  {BASE_LABELS[b]}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Portionen">
            <Input type="number" min={1} max={12} value={data.servings} onChange={(e) => set("servings", Number(e.target.value) || 1)} />
          </Field>
          <Field label="Zubereitungszeit (Min.)">
            <Input type="number" min={1} value={data.prepMinutes} onChange={(e) => set("prepMinutes", Number(e.target.value) || 1)} />
          </Field>
          <Field label="Tags" className="sm:col-span-2">
            <div className="flex flex-wrap gap-2">
              {Object.entries(TAG_LABELS).map(([t, l]) => (
                <Chip
                  key={t}
                  active={data.tags.includes(t)}
                  onClick={() => set("tags", data.tags.includes(t) ? data.tags.filter((x) => x !== t) : [...data.tags, t])}
                >
                  {l}
                </Chip>
              ))}
            </div>
          </Field>
        </Card>

        <Card>
          <h2 className="mb-3 text-lg font-extrabold">Zutaten (für alle Portionen)</h2>
          <ul className="divide-y divide-line">
            {data.ingredients.map((ri, idx) => (
              <li key={`${ri.ingredientId}-${idx}`} className="flex items-center gap-2 py-2">
                <span className="min-w-0 flex-1 truncate font-semibold">{byId.get(ri.ingredientId)?.name ?? "Unbekannt"}</span>
                <Input
                  type="number"
                  className="h-10 w-24"
                  aria-label="Gramm"
                  value={ri.grams}
                  onChange={(e) =>
                    set(
                      "ingredients",
                      data.ingredients.map((x, i) => (i === idx ? { ...x, grams: Number(e.target.value) || 0 } : x)),
                    )
                  }
                />
                <span className="text-sm text-muted">g</span>
                <Button variant="ghost" size="icon-sm" aria-label="Nach oben" onClick={() => move(idx, -1)}>
                  <ArrowUp className="h-4 w-4" aria-hidden />
                </Button>
                <Button variant="ghost" size="icon-sm" aria-label="Nach unten" onClick={() => move(idx, 1)}>
                  <ArrowDown className="h-4 w-4" aria-hidden />
                </Button>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  aria-label="Entfernen"
                  onClick={() => set("ingredients", data.ingredients.filter((_, i) => i !== idx))}
                >
                  <Trash2 className="h-4 w-4" aria-hidden />
                </Button>
              </li>
            ))}
          </ul>
          <div className="mt-3 grid gap-2 sm:grid-cols-[1fr_100px_auto]">
            <IngredientPicker key={pickerKey} ingredients={ingredients} value={picked} onChange={setPicked} />
            <Input type="number" aria-label="Gramm" value={grams} onChange={(e) => setGrams(e.target.value)} />
            <Button
              variant="soft"
              disabled={!picked}
              onClick={() => {
                if (!picked) return;
                set("ingredients", [...data.ingredients, { ingredientId: picked.id, grams: Number(grams) || 100 }]);
                setPicked(null);
                setPickerKey((k) => k + 1);
              }}
            >
              <Plus className="h-4 w-4" aria-hidden /> Zutat
            </Button>
          </div>
        </Card>

        <Card>
          <Field label="Zubereitungsschritte (ein Schritt pro Zeile)">
            <Textarea className="min-h-48" value={stepsText} onChange={(e) => setStepsText(e.target.value)} />
          </Field>
        </Card>
      </div>

      <div className="lg:sticky lg:top-8 lg:self-start">
        <Card className="space-y-4">
          <div className="rounded-2xl bg-mint-50 p-4 text-center">
            <p className="text-3xl font-extrabold tabular-nums">{perServing.kcal} kcal</p>
            <p className="text-sm text-muted">{perServing.protein} g Protein pro Portion</p>
          </div>
          <label className="flex items-center gap-3 text-sm font-bold">
            <input
              type="checkbox"
              className="h-5 w-5 accent-leaf-600"
              checked={data.published}
              onChange={(e) => set("published", e.target.checked)}
            />
            Veröffentlicht
          </label>
          <FormError message={error} />
          <Button size="lg" className="w-full" onClick={submit} disabled={pending}>
            {pending ? "Speichern ..." : "Rezept speichern"}
          </Button>
        </Card>
      </div>
    </div>
  );
}
