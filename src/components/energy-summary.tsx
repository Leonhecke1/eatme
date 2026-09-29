import { ACTIVITY_FACTORS, GOALS, type DailyActivity, type EnergyResult, type Goal } from "@/lib/nutrition/energy";
import { formatNumber } from "@/lib/labels";

export function EnergySummary({
  energy,
  goal,
  activity,
  compact = false,
}: {
  energy: EnergyResult;
  goal: Goal;
  activity: DailyActivity;
  compact?: boolean;
}) {
  const adjust = GOALS[goal].adjust;
  return (
    <div>
      <div className="rounded-3xl bg-gradient-to-br from-mint-100 to-mint-50 p-5 text-center">
        <p className="text-sm font-bold text-leaf-700">Dein Tagesziel</p>
        <p className="text-4xl font-extrabold tabular-nums text-ink">{formatNumber(energy.target)} kcal</p>
        <p className="mt-1 text-sm text-muted">{GOALS[goal].label}</p>
        <div className="mt-4 grid grid-cols-3 gap-2">
          <MacroPill label="Protein" value={energy.protein} className="bg-leaf-400/30" />
          <MacroPill label="Kohlenhydrate" value={energy.carbs} className="bg-sky-100" />
          <MacroPill label="Fett" value={energy.fat} className="bg-butter-100" />
        </div>
      </div>
      {!compact ? (
        <dl className="mt-4 space-y-2 text-sm">
          <Row label={`Grundumsatz (${energy.bmrFormula})`} value={`${formatNumber(energy.bmr)} kcal`} />
          <Row
            label={`Alltag: ${ACTIVITY_FACTORS[activity].label} (x ${ACTIVITY_FACTORS[activity].factor})`}
            value={`${formatNumber(energy.everyday)} kcal`}
          />
          <Row label="Sport (Durchschnitt pro Tag)" value={`+ ${formatNumber(energy.sportPerDay)} kcal`} />
          <Row label="Gesamtverbrauch" value={`${formatNumber(energy.tdee)} kcal`} strong />
          <Row
            label={`Zielanpassung ${adjust === 0 ? "" : adjust > 0 ? `(+${adjust * 100} %)` : `(${adjust * 100} %)`}`}
            value={`${formatNumber(energy.target)} kcal`}
            strong
          />
          <Row label="Ballaststoffe (Empfehlung)" value={`mind. ${energy.fiber} g`} />
        </dl>
      ) : null}
    </div>
  );
}

function MacroPill({ label, value, className }: { label: string; value: number; className: string }) {
  return (
    <div className={`rounded-2xl px-2 py-2 ${className}`}>
      <div className="text-lg font-extrabold tabular-nums text-ink">{value} g</div>
      <div className="text-[11px] font-bold text-muted">{label}</div>
    </div>
  );
}

function Row({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className="flex items-baseline justify-between gap-3 border-b border-line/70 pb-2 last:border-0">
      <dt className={strong ? "font-bold text-ink" : "text-muted"}>{label}</dt>
      <dd className="shrink-0 font-bold tabular-nums text-ink">{value}</dd>
    </div>
  );
}
