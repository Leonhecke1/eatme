import { ProgressRing, MacroBar } from "@/components/ui/progress";
import { formatNumber } from "@/lib/labels";

export function DaySummary({
  eaten,
  target,
}: {
  eaten: { kcal: number; protein: number; carbs: number; fat: number };
  target: { kcal: number; protein: number; carbs: number; fat: number };
}) {
  const left = target.kcal - eaten.kcal;
  return (
    <div className="flex flex-col items-center gap-6 sm:flex-row sm:items-center">
      <ProgressRing value={eaten.kcal} max={target.kcal}>
        <span className="text-3xl font-extrabold tabular-nums">{formatNumber(eaten.kcal)}</span>
        <span className="text-xs font-bold text-muted">von {formatNumber(target.kcal)} kcal</span>
        <span className={`mt-1 text-xs font-bold ${left >= 0 ? "text-leaf-600" : "text-peach-700"}`}>
          {left >= 0 ? `noch ${formatNumber(left)}` : `${formatNumber(-left)} darüber`}
        </span>
      </ProgressRing>
      <div className="w-full flex-1 space-y-3">
        <MacroBar label="Protein" value={eaten.protein} max={target.protein} tone="leaf" />
        <MacroBar label="Kohlenhydrate" value={eaten.carbs} max={target.carbs} tone="sky" />
        <MacroBar label="Fett" value={eaten.fat} max={target.fat} tone="butter" />
      </div>
    </div>
  );
}
