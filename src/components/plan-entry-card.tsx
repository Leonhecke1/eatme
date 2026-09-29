import Link from "next/link";
import { Check, Lock, LockOpen, Minus, Plus, Shuffle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/cn";
import { MEAL_LABELS } from "@/lib/labels";
import { formatEuro } from "@/lib/pricing";
import { changeServingAction, swapEntryAction, toggleLockAction } from "@/server/actions/plan";
import { togglePlanEntryEatenAction } from "@/server/actions/log";
import type { PlanEntryView } from "@/server/plan-view";

export function PlanEntryCard({ entry, showActions = true }: { entry: PlanEntryView; showActions?: boolean }) {
  const href = entry.savedRecipeId ? `/gespeichert/${entry.savedRecipeId}` : `/rezepte/${entry.slug}`;
  return (
    <div
      className={cn(
        "rounded-2xl border bg-surface p-3 transition-colors",
        entry.eaten ? "border-mint-300 bg-mint-50" : "border-line",
        entry.locked && "ring-2 ring-mint-300",
      )}
    >
      <div className="flex items-start gap-2.5">
        <form action={togglePlanEntryEatenAction}>
          <input type="hidden" name="entryId" value={entry.id} />
          <input type="hidden" name="date" value={entry.date} />
          <button
            type="submit"
            role="checkbox"
            aria-checked={entry.eaten}
            aria-label={entry.eaten ? `${entry.title}: nicht gegessen` : `${entry.title} als gegessen markieren`}
            className={cn(
              "mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full border-2 transition-colors",
              entry.eaten ? "border-leaf-600 bg-leaf-600 text-white" : "border-mint-300 hover:border-leaf-500",
            )}
          >
            {entry.eaten ? <Check className="h-4 w-4" aria-hidden /> : null}
          </button>
        </form>
        <div className="min-w-0 flex-1">
          <p className="text-[11px] font-bold uppercase tracking-wide text-muted">{MEAL_LABELS[entry.mealType]}</p>
          <Link href={href} className={cn("block font-extrabold leading-snug hover:text-leaf-700", "text-[15px] xl:text-sm", entry.eaten && "text-muted")}>
            {entry.title}
          </Link>
          <p className="mt-0.5 text-xs tabular-nums text-muted">
            {Math.round(entry.macros.kcal)} kcal · {Math.round(entry.macros.protein)} g P · {formatEuro(entry.costCents)}
          </p>
        </div>
      </div>
      {showActions ? (
        <div className="mt-2 flex flex-wrap items-center justify-between gap-1">
          <div className="flex items-center rounded-xl bg-mint-50">
            <form action={changeServingAction}>
              <input type="hidden" name="entryId" value={entry.id} />
              <input type="hidden" name="delta" value="-0.25" />
              <Button type="submit" variant="ghost" size="icon-sm" aria-label="Portion verkleinern" disabled={entry.servingFactor <= 0.25}>
                <Minus className="h-3.5 w-3.5" aria-hidden />
              </Button>
            </form>
            <span className="min-w-10 text-center text-xs font-bold tabular-nums" title="Portionen">
              {entry.servingFactor.toLocaleString("de-DE")}x
            </span>
            <form action={changeServingAction}>
              <input type="hidden" name="entryId" value={entry.id} />
              <input type="hidden" name="delta" value="0.25" />
              <Button type="submit" variant="ghost" size="icon-sm" aria-label="Portion vergrößern">
                <Plus className="h-3.5 w-3.5" aria-hidden />
              </Button>
            </form>
          </div>
          <div className="flex items-center">
            <form action={swapEntryAction}>
              <input type="hidden" name="entryId" value={entry.id} />
              <Button type="submit" variant="ghost" size="icon-sm" aria-label="Anderes Rezept vorschlagen" title="Tauschen" disabled={entry.locked}>
                <Shuffle className="h-4 w-4" aria-hidden />
              </Button>
            </form>
            <form action={toggleLockAction}>
              <input type="hidden" name="entryId" value={entry.id} />
              <Button
                type="submit"
                variant="ghost"
                size="icon-sm"
                aria-label={entry.locked ? "Entsperren" : "Sperren (bleibt beim Neu-Erstellen erhalten)"}
                title={entry.locked ? "Gesperrt" : "Sperren"}
                className={entry.locked ? "bg-mint-100" : undefined}
              >
                {entry.locked ? <Lock className="h-4 w-4" aria-hidden /> : <LockOpen className="h-4 w-4" aria-hidden />}
              </Button>
            </form>
          </div>
        </div>
      ) : null}
    </div>
  );
}
