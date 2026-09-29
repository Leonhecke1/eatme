import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { MEAL_LABELS, MEAL_TYPES, formatNumber } from "@/lib/labels";
import { deleteLogEntryAction } from "@/server/actions/log";

export interface LogEntryView {
  id: string;
  mealType: (typeof MEAL_TYPES)[number];
  title: string;
  amount: number;
  amountUnit: string;
  kcal: number;
  protein: number;
}

export function LogList({ entries, emptyText }: { entries: LogEntryView[]; emptyText: string }) {
  if (entries.length === 0) return <p className="rounded-2xl bg-mint-50 px-4 py-3 text-sm text-muted">{emptyText}</p>;
  return (
    <div className="space-y-4">
      {MEAL_TYPES.map((m) => {
        const list = entries.filter((e) => e.mealType === m);
        if (list.length === 0) return null;
        const kcal = list.reduce((s, e) => s + e.kcal, 0);
        return (
          <section key={m}>
            <div className="mb-1.5 flex items-baseline justify-between px-1">
              <h3 className="text-sm font-extrabold">{MEAL_LABELS[m]}</h3>
              <span className="text-xs font-bold tabular-nums text-muted">{formatNumber(kcal)} kcal</span>
            </div>
            <ul className="divide-y divide-line rounded-2xl border border-line">
              {list.map((e) => (
                <li key={e.id} className="flex items-center gap-3 px-3 py-2">
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-semibold">{e.title}</p>
                    <p className="text-xs tabular-nums text-muted">
                      {formatNumber(e.amount, 2)} {e.amountUnit} · {formatNumber(e.kcal)} kcal · {formatNumber(e.protein)} g Protein
                    </p>
                  </div>
                  <form action={deleteLogEntryAction}>
                    <input type="hidden" name="id" value={e.id} />
                    <Button type="submit" variant="ghost" size="icon-sm" aria-label={`${e.title} löschen`}>
                      <Trash2 className="h-4 w-4" aria-hidden />
                    </Button>
                  </form>
                </li>
              ))}
            </ul>
          </section>
        );
      })}
    </div>
  );
}
