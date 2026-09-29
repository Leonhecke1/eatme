import type { Macros } from "@/lib/nutrition/calc";
import { formatEuro } from "@/lib/pricing";

export function NutritionPanel({ perServing, costPerServing, label = "Pro Portion" }: { perServing: Macros; costPerServing: number; label?: string }) {
  const items = [
    { label: "kcal", value: Math.round(perServing.kcal).toString(), tone: "bg-mint-100" },
    { label: "Protein", value: `${Math.round(perServing.protein)} g`, tone: "bg-leaf-400/25" },
    { label: "Kohlenhydrate", value: `${Math.round(perServing.carbs)} g`, tone: "bg-sky-100" },
    { label: "Fett", value: `${Math.round(perServing.fat)} g`, tone: "bg-butter-100" },
    { label: "Ballaststoffe", value: `${Math.round(perServing.fiber)} g`, tone: "bg-mint-50" },
    { label: "Kosten", value: formatEuro(costPerServing), tone: "bg-peach-100" },
  ];
  return (
    <div>
      <p className="mb-2 text-xs font-bold uppercase tracking-wide text-muted">{label}</p>
      <div className="grid grid-cols-3 gap-2">
        {items.map((i) => (
          <div key={i.label} className={`rounded-2xl px-2 py-2.5 text-center ${i.tone}`}>
            <div className="text-lg font-extrabold tabular-nums text-ink">{i.value}</div>
            <div className="text-[11px] font-bold text-muted">{i.label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
