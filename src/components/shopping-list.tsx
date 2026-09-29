"use client";

import { useState, useTransition } from "react";
import { Check, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/form";
import { cn } from "@/lib/cn";
import { formatGrams } from "@/lib/labels";
import { formatEuro } from "@/lib/pricing";
import { resetPriceOverrideAction, setPriceOverrideAction, toggleShoppingItemAction } from "@/server/actions/plan";

export interface ShoppingItemView {
  id: string;
  ingredientId: string;
  name: string;
  category: string;
  grams: number;
  packages: number;
  packageGrams: number;
  costCents: number;
  packagePriceCents: number;
  hasOverride: boolean;
  checked: boolean;
}

export function ShoppingList({ items }: { items: ShoppingItemView[] }) {
  const [checked, setChecked] = useState(() => new Set(items.filter((i) => i.checked).map((i) => i.id)));
  const [editing, setEditing] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  const groups = new Map<string, ShoppingItemView[]>();
  for (const it of items) groups.set(it.category, [...(groups.get(it.category) ?? []), it]);

  const toggle = (id: string) => {
    setChecked((s) => {
      const n = new Set(s);
      if (n.has(id)) n.delete(id);
      else n.add(id);
      return n;
    });
    startTransition(() => toggleShoppingItemAction(id));
  };

  return (
    <div className="space-y-5">
      <div className="rounded-2xl bg-mint-50 px-4 py-3 text-sm font-bold">
        {checked.size} von {items.length} im Einkaufswagen
      </div>
      {[...groups.entries()].map(([category, list]) => (
        <section key={category}>
          <h2 className="mb-2 px-1 text-xs font-bold uppercase tracking-wide text-muted">{category}</h2>
          <ul className="divide-y divide-line overflow-hidden rounded-3xl bg-surface shadow-soft">
            {list.map((it) => {
              const done = checked.has(it.id);
              return (
                <li key={it.id} className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      role="checkbox"
                      aria-checked={done}
                      aria-label={`${it.name} abhaken`}
                      onClick={() => toggle(it.id)}
                      className={cn(
                        "flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 transition-colors",
                        done ? "border-leaf-600 bg-leaf-600 text-white" : "border-mint-300 hover:border-leaf-500",
                      )}
                    >
                      {done ? <Check className="h-4 w-4" aria-hidden /> : null}
                    </button>
                    <button type="button" onClick={() => toggle(it.id)} className="min-w-0 flex-1 text-left">
                      <span className={cn("block truncate font-bold", done && "text-muted line-through")}>{it.name}</span>
                      <span className="block text-xs text-muted">
                        {formatGrams(it.grams)} benötigt · {it.packages} x {formatGrams(it.packageGrams)} à {formatEuro(it.packagePriceCents)}
                        {it.hasOverride ? " (eigener Preis)" : ""}
                      </span>
                    </button>
                    <span className="shrink-0 text-sm font-extrabold tabular-nums">{formatEuro(it.costCents)}</span>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      aria-label={`Preis für ${it.name} anpassen`}
                      aria-expanded={editing === it.id}
                      onClick={() => setEditing(editing === it.id ? null : it.id)}
                    >
                      <Pencil className="h-4 w-4" aria-hidden />
                    </Button>
                  </div>
                  {editing === it.id ? (
                    <div className="mt-3 flex flex-wrap items-center gap-2 rounded-2xl bg-mint-50 p-3">
                      <form action={setPriceOverrideAction} className="flex flex-wrap items-center gap-2" onSubmit={() => setEditing(null)}>
                        <input type="hidden" name="ingredientId" value={it.ingredientId} />
                        <label className="text-sm font-bold" htmlFor={`price-${it.id}`}>
                          Dein Preis für {formatGrams(it.packageGrams)} (Euro)
                        </label>
                        <Input
                          id={`price-${it.id}`}
                          name="packagePrice"
                          inputMode="decimal"
                          defaultValue={(it.packagePriceCents / 100).toFixed(2).replace(".", ",")}
                          className="h-10 w-24"
                        />
                        <Button type="submit" size="sm">
                          Speichern
                        </Button>
                      </form>
                      {it.hasOverride ? (
                        <form action={resetPriceOverrideAction} onSubmit={() => setEditing(null)}>
                          <input type="hidden" name="ingredientId" value={it.ingredientId} />
                          <Button type="submit" size="sm" variant="ghost">
                            Richtpreis verwenden
                          </Button>
                        </form>
                      ) : null}
                    </div>
                  ) : null}
                </li>
              );
            })}
          </ul>
        </section>
      ))}
    </div>
  );
}
