"use client";

import Link from "next/link";
import { useFormStatus } from "react-dom";
import { Check, Lock, LockOpen, Minus, Plus, Shuffle } from "lucide-react";
import { RecipeVisual } from "@/components/recipe-visual";
import { cn } from "@/lib/cn";
import { MEAL_LABELS, type BaseTypeKey } from "@/lib/labels";
import { formatEuro } from "@/lib/pricing";
import { togglePlanEntryEatenAction } from "@/server/actions/log";
import { changeServingAction, swapEntryAction, toggleLockAction } from "@/server/actions/plan";
import type { PlanEntryView } from "@/server/plan-view";

/** Eine Mahlzeit im Plan als breite Zeile: Abhaken, Rezept, Naehrwerte, Aktionen. */
export function PlanEntryCard({ entry, showActions = true }: { entry: PlanEntryView; showActions?: boolean }) {
  const href = entry.savedRecipeId ? `/gespeichert/${entry.savedRecipeId}` : `/rezepte/${entry.slug}`;
  return (
    <div
      className={cn(
        "group flex flex-wrap items-center gap-x-4 gap-y-3 rounded-3xl border bg-surface p-3 pr-4 transition-colors sm:flex-nowrap",
        entry.eaten ? "border-mint-200 bg-mint-50/70" : "border-transparent shadow-soft",
      )}
    >
      <div className="flex min-w-0 flex-1 items-center gap-3">
        <form action={togglePlanEntryEatenAction}>
          <input type="hidden" name="entryId" value={entry.id} />
          <input type="hidden" name="date" value={entry.date} />
          <EatenButton eaten={entry.eaten} title={entry.title} />
        </form>

        <Link href={href} className="flex min-w-0 flex-1 items-center gap-3">
          <RecipeVisual
            baseType={entry.baseType as BaseTypeKey}
            className={cn("h-14 w-14 shrink-0 rounded-2xl", entry.eaten && "opacity-60")}
            iconClassName="h-6 w-6"
          />
          <div className="min-w-0">
            <p className="flex items-center gap-1.5 text-xs font-bold text-muted">
              {MEAL_LABELS[entry.mealType]}
              {entry.locked ? (
                <span className="inline-flex items-center gap-0.5 rounded-full bg-mint-100 px-1.5 py-0.5 text-[10px] text-leaf-700">
                  <Lock className="h-2.5 w-2.5" aria-hidden /> fest
                </span>
              ) : null}
            </p>
            <p
              className={cn(
                "truncate text-[15px] font-extrabold text-ink group-hover:text-leaf-700",
                entry.eaten && "text-muted line-through decoration-mint-300",
              )}
            >
              {entry.title}
            </p>
            <p className="mt-0.5 flex flex-wrap gap-x-3 text-xs font-semibold tabular-nums text-muted">
              <span>
                <span className="font-extrabold text-ink">{Math.round(entry.macros.kcal)}</span> kcal
              </span>
              <span>
                <span className="font-extrabold text-ink">{Math.round(entry.macros.protein)} g</span> Protein
              </span>
              <span>{formatEuro(entry.costCents)}</span>
            </p>
          </div>
        </Link>
      </div>

      {showActions ? (
        <div className="flex w-full items-center justify-between gap-2 border-t border-line pt-2 sm:w-auto sm:border-0 sm:pt-0">
          <div className="flex items-center rounded-full bg-mint-50" role="group" aria-label="Portionen">
            <form action={changeServingAction}>
              <input type="hidden" name="entryId" value={entry.id} />
              <input type="hidden" name="delta" value="-0.25" />
              <IconSubmit label="Portion verkleinern" disabled={entry.servingFactor <= 0.25}>
                <Minus className="h-3.5 w-3.5" aria-hidden />
              </IconSubmit>
            </form>
            <span className="min-w-12 text-center text-sm font-extrabold tabular-nums" title="Portionen">
              {entry.servingFactor.toLocaleString("de-DE")}x
            </span>
            <form action={changeServingAction}>
              <input type="hidden" name="entryId" value={entry.id} />
              <input type="hidden" name="delta" value="0.25" />
              <IconSubmit label="Portion vergrößern">
                <Plus className="h-3.5 w-3.5" aria-hidden />
              </IconSubmit>
            </form>
          </div>
          <div className="flex items-center gap-1">
            <form action={swapEntryAction}>
              <input type="hidden" name="entryId" value={entry.id} />
              <IconSubmit label="Anderes Rezept vorschlagen" disabled={entry.locked}>
                <Shuffle className="h-4 w-4" aria-hidden />
              </IconSubmit>
            </form>
            <form action={toggleLockAction}>
              <input type="hidden" name="entryId" value={entry.id} />
              <IconSubmit
                label={entry.locked ? "Entsperren" : "Festhalten (bleibt beim Neu-Erstellen erhalten)"}
                active={entry.locked}
              >
                {entry.locked ? <Lock className="h-4 w-4" aria-hidden /> : <LockOpen className="h-4 w-4" aria-hidden />}
              </IconSubmit>
            </form>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function EatenButton({ eaten, title }: { eaten: boolean; title: string }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      role="checkbox"
      aria-checked={eaten}
      aria-label={eaten ? `${title}: nicht gegessen` : `${title} als gegessen markieren`}
      title={eaten ? "Gegessen" : "Als gegessen markieren"}
      disabled={pending}
      className={cn(
        "flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 transition-colors",
        eaten ? "border-leaf-600 bg-leaf-600 text-white" : "border-mint-300 bg-surface hover:border-leaf-500",
        pending && "animate-pulse",
      )}
    >
      {eaten ? <Check className="h-4 w-4" aria-hidden /> : null}
    </button>
  );
}

function IconSubmit({
  label,
  disabled,
  active,
  children,
}: {
  label: string;
  disabled?: boolean;
  active?: boolean;
  children: React.ReactNode;
}) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      aria-label={label}
      title={label}
      disabled={disabled || pending}
      className={cn(
        "flex h-9 w-9 items-center justify-center rounded-full text-leaf-700 transition-colors hover:bg-mint-100 disabled:opacity-40",
        active && "bg-mint-100",
        pending && "animate-pulse",
      )}
    >
      {children}
    </button>
  );
}
