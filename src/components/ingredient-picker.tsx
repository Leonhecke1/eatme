"use client";

import { useId, useMemo, useState } from "react";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/form";
import { cn } from "@/lib/cn";

export interface PickerIngredient {
  id: string;
  name: string;
  category: string;
  kcal: number;
}

/** Suchfeld mit Vorschlagsliste (Combobox) fuer Zutaten. */
export function IngredientPicker({
  ingredients,
  value,
  onChange,
  placeholder = "Zutat suchen",
}: {
  ingredients: PickerIngredient[];
  value: PickerIngredient | null;
  onChange: (i: PickerIngredient | null) => void;
  placeholder?: string;
}) {
  const [query, setQuery] = useState(value?.name ?? "");
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const listId = useId();

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return ingredients.slice(0, 8);
    const starts = ingredients.filter((i) => i.name.toLowerCase().startsWith(q));
    const contains = ingredients.filter((i) => !i.name.toLowerCase().startsWith(q) && i.name.toLowerCase().includes(q));
    return [...starts, ...contains].slice(0, 8);
  }, [ingredients, query]);

  const pick = (i: PickerIngredient) => {
    onChange(i);
    setQuery(i.name);
    setOpen(false);
  };

  return (
    <div className="relative">
      <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" aria-hidden />
      <Input
        role="combobox"
        aria-expanded={open}
        aria-controls={listId}
        aria-autocomplete="list"
        value={query}
        placeholder={placeholder}
        className="pl-10"
        onFocus={() => setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
        onChange={(e) => {
          setQuery(e.target.value);
          setOpen(true);
          setActive(0);
          if (value) onChange(null);
        }}
        onKeyDown={(e) => {
          if (e.key === "ArrowDown") {
            e.preventDefault();
            setActive((a) => Math.min(results.length - 1, a + 1));
          } else if (e.key === "ArrowUp") {
            e.preventDefault();
            setActive((a) => Math.max(0, a - 1));
          } else if (e.key === "Enter" && open && results[active]) {
            e.preventDefault();
            pick(results[active]);
          } else if (e.key === "Escape") {
            setOpen(false);
          }
        }}
      />
      {open && results.length > 0 ? (
        <ul
          id={listId}
          role="listbox"
          className="absolute inset-x-0 top-full z-20 mt-1 max-h-72 overflow-y-auto rounded-2xl border border-line bg-surface p-1 shadow-lift"
        >
          {results.map((i, idx) => (
            <li
              key={i.id}
              role="option"
              aria-selected={idx === active}
              onMouseDown={(e) => {
                e.preventDefault();
                pick(i);
              }}
              onMouseEnter={() => setActive(idx)}
              className={cn(
                "flex cursor-pointer items-center justify-between rounded-xl px-3 py-2.5",
                idx === active && "bg-mint-100",
              )}
            >
              <span className="font-semibold">{i.name}</span>
              <span className="text-xs text-muted">
                {i.category} · {Math.round(i.kcal)} kcal/100 g
              </span>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
