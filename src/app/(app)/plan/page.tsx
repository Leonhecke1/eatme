import type { Metadata } from "next";
import { CalendarPlus, ChevronLeft, ChevronRight, PartyPopper, RefreshCw, ShoppingBasket } from "lucide-react";
import { WeekPlanner, type PlannerDay } from "@/components/week-planner";
import { Button, ButtonLink } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/page";
import { cn } from "@/lib/cn";
import {
  WEEKDAYS,
  WEEKDAYS_SHORT,
  addDays,
  dayIndexInWeek,
  formatDateShort,
  isISODate,
  todayISO,
  weekStartISO,
} from "@/lib/dates";
import { formatNumber } from "@/lib/labels";
import { formatEuro } from "@/lib/pricing";
import { generatePlanAction } from "@/server/actions/plan";
import { requireProfileUser } from "@/server/auth";
import { loadUserContext } from "@/server/context";
import { loadPlanView } from "@/server/plan-view";

export const metadata: Metadata = { title: "Wochenplan" };

export default async function PlanPage({ searchParams }: PageProps<"/plan">) {
  const user = await requireProfileUser();
  const sp = await searchParams;
  const woche = typeof sp.woche === "string" && isISODate(sp.woche) ? sp.woche : todayISO();
  const weekStart = weekStartISO(woche);
  const today = todayISO();
  const isCurrentWeek = weekStart === weekStartISO(today);
  const view = await loadPlanView(user.id, weekStart);
  const ctx = view?.ctx ?? (await loadUserContext(user.id));

  const weekLabel = `${formatDateShort(weekStart)} bis ${formatDateShort(addDays(weekStart, 6))}`;

  const header = (
    <header className="mb-6 flex flex-wrap items-center justify-between gap-3">
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl">Wochenplan</h1>
        <div className="mt-1 flex items-center gap-1">
          <ButtonLink href={`/plan?woche=${addDays(weekStart, -7)}`} variant="ghost" size="icon-sm" aria-label="Vorherige Woche">
            <ChevronLeft className="h-5 w-5" aria-hidden />
          </ButtonLink>
          <span className="min-w-40 text-center text-sm font-bold text-muted">
            {isCurrentWeek ? `Diese Woche · ${weekLabel}` : weekLabel}
          </span>
          <ButtonLink href={`/plan?woche=${addDays(weekStart, 7)}`} variant="ghost" size="icon-sm" aria-label="Nächste Woche">
            <ChevronRight className="h-5 w-5" aria-hidden />
          </ButtonLink>
        </div>
      </div>
      {view ? (
        <div className="flex flex-wrap gap-2">
          <ButtonLink href={`/plan/einkaufsliste?woche=${weekStart}`} variant="secondary">
            <ShoppingBasket className="h-5 w-5" aria-hidden /> Einkaufsliste
          </ButtonLink>
          <form action={generatePlanAction}>
            <input type="hidden" name="weekStart" value={weekStart} />
            <input type="hidden" name="keepLocked" value="1" />
            <Button type="submit" variant="soft" title="Festgehaltene Mahlzeiten bleiben erhalten">
              <RefreshCw className="h-5 w-5" aria-hidden /> Neu erstellen
            </Button>
          </form>
        </div>
      ) : null}
    </header>
  );

  if (!view) {
    return (
      <>
        {header}
        <EmptyState
          icon={CalendarPlus}
          title="Für diese Woche gibt es noch keinen Plan"
          text={`Wir planen ${ctx.profile.mealsPerDay} Mahlzeiten pro Tag mit ca. ${formatNumber(ctx.energy.target)} kcal und einem Budget von ${formatEuro(ctx.profile.weeklyBudgetCents)}.`}
          action={
            <form action={generatePlanAction}>
              <input type="hidden" name="weekStart" value={weekStart} />
              <Button type="submit" size="lg">
                Plan erstellen
              </Button>
            </form>
          }
        />
      </>
    );
  }

  const days: PlannerDay[] = Array.from({ length: 7 }, (_, i) => {
    const date = addDays(weekStart, i);
    const entries = view.entries.filter((e) => e.dayIndex === i);
    const sum = (key: "kcal" | "protein" | "carbs" | "fat") => entries.reduce((s, e) => s + e.macros[key], 0);
    return {
      date,
      weekday: WEEKDAYS[i],
      short: WEEKDAYS_SHORT[i],
      dateLabel: formatDateShort(date),
      isToday: date === today,
      entries,
      kcal: sum("kcal"),
      protein: sum("protein"),
      carbs: sum("carbs"),
      fat: sum("fat"),
      costCents: entries.reduce((s, e) => s + e.costCents, 0),
    };
  });

  const targets = { kcal: ctx.energy.target, protein: ctx.energy.protein, carbs: ctx.energy.carbs, fat: ctx.energy.fat };
  const budget = ctx.profile.weeklyBudgetCents;
  const weekCost = days.reduce((s, d) => s + d.costCents, 0);
  const avgKcal = days.reduce((s, d) => s + d.kcal, 0) / 7;
  const avgProtein = days.reduce((s, d) => s + d.protein, 0) / 7;
  const eaten = view.entries.filter((e) => e.eaten).length;

  return (
    <>
      {header}

      {sp.neu === "1" ? (
        <div className="mb-6 flex items-start gap-3 rounded-3xl bg-mint-100 p-4">
          <PartyPopper className="mt-0.5 h-6 w-6 shrink-0 text-leaf-600" aria-hidden />
          <div>
            <p className="font-extrabold">Dein erster Plan ist fertig.</p>
            <p className="text-sm text-muted">
              Wähle oben einen Tag. Du kannst Mahlzeiten tauschen, Portionen anpassen oder festhalten, damit sie beim Neu-Erstellen bleiben.
            </p>
          </div>
        </div>
      ) : null}

      <div className="mb-6 grid grid-cols-2 gap-px overflow-hidden rounded-3xl bg-line shadow-soft lg:grid-cols-4">
        <SummaryStat
          label="Kalorien pro Tag"
          value={formatNumber(avgKcal)}
          unit={`/ ${formatNumber(targets.kcal)} kcal`}
          ratio={avgKcal / targets.kcal}
        />
        <SummaryStat
          label="Protein pro Tag"
          value={`${formatNumber(avgProtein)} g`}
          unit={`/ ${targets.protein} g`}
          ratio={avgProtein / targets.protein}
        />
        <SummaryStat
          label="Kosten der Woche"
          value={formatEuro(weekCost)}
          unit={`/ ${formatEuro(budget)}`}
          ratio={weekCost / budget}
          warn={weekCost > budget}
          hint={weekCost > budget ? `${formatEuro(weekCost - budget)} über Budget` : `${formatEuro(budget - weekCost)} Puffer`}
        />
        <SummaryStat
          label="Gegessen"
          value={String(eaten)}
          unit={`/ ${view.entries.length} Mahlzeiten`}
          ratio={eaten / Math.max(1, view.entries.length)}
        />
      </div>

      <WeekPlanner days={days} targets={targets} initial={isCurrentWeek ? dayIndexInWeek(today) : 0} />
    </>
  );
}

function SummaryStat({
  label,
  value,
  unit,
  ratio,
  warn,
  hint,
}: {
  label: string;
  value: string;
  unit: string;
  ratio: number;
  warn?: boolean;
  hint?: string;
}) {
  return (
    <div className="bg-surface p-4 sm:p-5">
      <p className="text-xs font-bold uppercase tracking-wide text-muted">{label}</p>
      <p className="mt-1 text-xl font-extrabold tabular-nums sm:text-2xl">{value}</p>
      <p className="text-xs font-bold tabular-nums text-muted">{unit}</p>
      <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-mint-100">
        <div
          className={cn("h-full rounded-full", warn ? "bg-peach-200" : "bg-leaf-400")}
          style={{ width: `${Math.min(100, Math.max(0, ratio * 100))}%` }}
        />
      </div>
      {hint ? <p className={cn("mt-1.5 text-xs font-bold", warn ? "text-peach-700" : "text-leaf-600")}>{hint}</p> : null}
    </div>
  );
}
