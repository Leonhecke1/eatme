import type { Metadata } from "next";
import Link from "next/link";
import { CalendarPlus, ChevronLeft, ChevronRight, PartyPopper, RefreshCw, ShoppingBasket } from "lucide-react";
import { DayTabs } from "@/components/day-tabs";
import { PlanEntryCard } from "@/components/plan-entry-card";
import { Button, ButtonLink } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState, PageHeader } from "@/components/ui/page";
import { MacroBar } from "@/components/ui/progress";
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
  const nav = (
    <div className="flex items-center gap-1 rounded-2xl bg-surface p-1 shadow-soft">
      <ButtonLink href={`/plan?woche=${addDays(weekStart, -7)}`} variant="ghost" size="icon-sm" aria-label="Vorherige Woche">
        <ChevronLeft className="h-5 w-5" aria-hidden />
      </ButtonLink>
      <span className="min-w-36 text-center text-sm font-bold">{isCurrentWeek ? "Diese Woche" : weekLabel}</span>
      <ButtonLink href={`/plan?woche=${addDays(weekStart, 7)}`} variant="ghost" size="icon-sm" aria-label="Nächste Woche">
        <ChevronRight className="h-5 w-5" aria-hidden />
      </ButtonLink>
    </div>
  );

  if (!view) {
    return (
      <>
        <PageHeader title="Wochenplan" subtitle={weekLabel} actions={nav} />
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

  const { plan, entries } = view;
  const days = Array.from({ length: 7 }, (_, i) => {
    const list = entries.filter((e) => e.dayIndex === i);
    return {
      date: addDays(weekStart, i),
      entries: list,
      kcal: list.reduce((s, e) => s + e.macros.kcal, 0),
      protein: list.reduce((s, e) => s + e.macros.protein, 0),
    };
  });
  const avgKcal = days.reduce((s, d) => s + d.kcal, 0) / 7;
  const avgProtein = days.reduce((s, d) => s + d.protein, 0) / 7;
  const overBudget = plan.estimatedCostCents > plan.budgetCents;

  return (
    <>
      <PageHeader
        title="Wochenplan"
        subtitle={isCurrentWeek ? weekLabel : undefined}
        actions={
          <>
            {nav}
            <ButtonLink href={`/plan/einkaufsliste?woche=${weekStart}`} variant="secondary">
              <ShoppingBasket className="h-5 w-5" aria-hidden /> Einkaufsliste
            </ButtonLink>
            <form action={generatePlanAction}>
              <input type="hidden" name="weekStart" value={weekStart} />
              <input type="hidden" name="keepLocked" value="1" />
              <Button type="submit" variant="soft" title="Gesperrte Mahlzeiten bleiben erhalten">
                <RefreshCw className="h-5 w-5" aria-hidden /> Neu erstellen
              </Button>
            </form>
          </>
        }
      />

      {sp.neu === "1" ? (
        <div className="mb-5 flex items-start gap-3 rounded-3xl bg-mint-100 p-4">
          <PartyPopper className="mt-0.5 h-6 w-6 shrink-0 text-leaf-600" aria-hidden />
          <div>
            <p className="font-extrabold">Dein erster Plan ist fertig.</p>
            <p className="text-sm text-muted">
              Tausche einzelne Mahlzeiten, passe Portionen an oder sperre Favoriten, damit sie beim Neu-Erstellen erhalten bleiben.
            </p>
          </div>
        </div>
      ) : null}

      <div className="mb-5 grid gap-3 sm:grid-cols-3">
        <Card className="p-4">
          <MacroBar label="Kalorien pro Tag (Durchschnitt)" value={avgKcal} max={plan.targetKcal} unit="kcal" />
        </Card>
        <Card className="p-4">
          <MacroBar label="Protein pro Tag (Durchschnitt)" value={avgProtein} max={plan.targetProtein} />
        </Card>
        <Card className="p-4">
          <MacroBar label="Kosten der Woche" value={plan.estimatedCostCents / 100} max={plan.budgetCents / 100} unit="Euro" tone={overBudget ? "peach" : "leaf"} />
          {overBudget ? (
            <p className="mt-2 text-xs font-bold text-peach-700">
              {formatEuro(plan.estimatedCostCents - plan.budgetCents)} über Budget. Tausche teure Gerichte oder erhöhe das Budget im Profil.
            </p>
          ) : null}
        </Card>
      </div>

      <DayTabs
        initial={isCurrentWeek ? dayIndexInWeek(today) : 0}
        days={days.map((d, i) => ({ short: WEEKDAYS_SHORT[i], date: formatDateShort(d.date), kcal: d.kcal }))}
      >
        {days.map((d, i) => (
          <section key={d.date} aria-label={WEEKDAYS[i]}>
            <div className="mb-2 flex items-baseline justify-between px-1">
              <h2 className={cn("font-extrabold", d.date === today && "text-leaf-700")}>
                <span className="xl:hidden">{WEEKDAYS[i]}</span>
                <span className="hidden xl:inline">{WEEKDAYS_SHORT[i]}</span>
                {d.date === today ? <span className="ml-2 text-xs font-bold text-leaf-600">Heute</span> : null}
              </h2>
              <span className="text-xs font-bold tabular-nums text-muted">{formatNumber(d.kcal)} kcal</span>
            </div>
            <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-1">
              {d.entries.map((e) => (
                <PlanEntryCard key={e.id} entry={e} />
              ))}
            </div>
          </section>
        ))}
      </DayTabs>

      <p className="mt-6 text-center text-sm text-muted">
        Tipp: Rezepte, die du speicherst und anpasst, verwendet der Plan automatisch in deiner Version.{" "}
        <Link href="/rezepte" className="font-bold text-leaf-700 hover:underline">
          Zu den Rezepten
        </Link>
      </p>
    </>
  );
}
