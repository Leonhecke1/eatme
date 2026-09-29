import type { Metadata } from "next";
import Link from "next/link";
import { CalendarPlus, ChevronRight, Scale } from "lucide-react";
import { DaySummary } from "@/components/day-summary";
import { LogList } from "@/components/log-list";
import { PlanEntryCard } from "@/components/plan-entry-card";
import { QuickAdd } from "@/components/quick-add";
import { Button } from "@/components/ui/button";
import { Card, SectionTitle } from "@/components/ui/card";
import { Stat } from "@/components/ui/page";
import { berlinHour, dayIndexInWeek, formatDateLong, mealTypeForNow, todayISO, weekStartISO } from "@/lib/dates";
import { formatNumber } from "@/lib/labels";
import { GOALS } from "@/lib/nutrition/energy";
import { generatePlanAction } from "@/server/actions/plan";
import { requireProfileUser } from "@/server/auth";
import { loadUserContext } from "@/server/context";
import { ingredientsForQuickAdd, loadDayLog } from "@/server/day";
import { loadPlanView } from "@/server/plan-view";

export const metadata: Metadata = { title: "Heute" };

function greeting() {
  const h = berlinHour();
  if (h < 11) return "Guten Morgen";
  if (h < 17) return "Hallo";
  return "Guten Abend";
}

export default async function TodayPage() {
  const user = await requireProfileUser();
  const today = todayISO();
  const [ctx, day, plan, ingredients] = await Promise.all([
    loadUserContext(user.id),
    loadDayLog(user.id, today),
    loadPlanView(user.id, weekStartISO(today)),
    ingredientsForQuickAdd(),
  ]);
  const todayEntries = plan?.entries.filter((e) => e.dayIndex === dayIndexInWeek(today)) ?? [];
  const openPlanned = todayEntries.filter((e) => !e.eaten);
  const plannedKcal = openPlanned.reduce((s, e) => s + e.macros.kcal, 0);

  return (
    <>
      <header className="mb-5">
        <p className="text-sm font-bold text-leaf-600">{formatDateLong(today)}</p>
        <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl">
          {greeting()}, {user.name}
        </h1>
      </header>

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-[1fr_360px]">
        <div className="space-y-5">
          <Card>
            <DaySummary
              eaten={day.totals}
              target={{ kcal: ctx.energy.target, protein: ctx.energy.protein, carbs: ctx.energy.carbs, fat: ctx.energy.fat }}
            />
          </Card>

          <Card>
            <div className="mb-3 flex items-center justify-between">
              <SectionTitle className="mb-0">Heute geplant</SectionTitle>
              <Link href="/plan" className="inline-flex items-center gap-1 text-sm font-bold text-leaf-700 hover:underline">
                Wochenplan <ChevronRight className="h-4 w-4" aria-hidden />
              </Link>
            </div>
            {plan ? (
              <>
                <div className="space-y-3">
                  {todayEntries.map((e) => (
                    <PlanEntryCard key={e.id} entry={e} showActions={false} />
                  ))}
                </div>
                {openPlanned.length > 0 ? (
                  <p className="mt-3 text-sm text-muted">
                    Noch offen: {openPlanned.length} Mahlzeit{openPlanned.length === 1 ? "" : "en"} mit ca. {formatNumber(plannedKcal)} kcal.
                    Tippe auf den Kreis, wenn du gegessen hast.
                  </p>
                ) : (
                  <p className="mt-3 text-sm font-bold text-leaf-700">Alle geplanten Mahlzeiten für heute erledigt.</p>
                )}
              </>
            ) : (
              <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-mint-50 p-4">
                <p className="text-sm text-muted">Für diese Woche gibt es noch keinen Plan.</p>
                <form action={generatePlanAction}>
                  <input type="hidden" name="weekStart" value={weekStartISO(today)} />
                  <Button type="submit" size="sm">
                    <CalendarPlus className="h-4 w-4" aria-hidden /> Plan erstellen
                  </Button>
                </form>
              </div>
            )}
          </Card>

          <Card>
            <div className="mb-3 flex items-center justify-between">
              <SectionTitle className="mb-0">Gegessen</SectionTitle>
              <Link href="/tagebuch" className="inline-flex items-center gap-1 text-sm font-bold text-leaf-700 hover:underline">
                Tagebuch <ChevronRight className="h-4 w-4" aria-hidden />
              </Link>
            </div>
            <LogList entries={day.entries} emptyText="Noch nichts eingetragen. Hake Mahlzeiten im Plan ab oder trage etwas ein." />
          </Card>
        </div>

        <div className="space-y-5 xl:sticky xl:top-8 xl:self-start">
          <Card>
            <SectionTitle>Schnell eintragen</SectionTitle>
            <QuickAdd ingredients={ingredients} date={today} defaultMealType={mealTypeForNow()} />
          </Card>
          <Card className="grid grid-cols-2 gap-2">
            <Stat label="Ziel" value={GOALS[ctx.profile.goal].label} />
            <Stat
              label="Gewicht"
              value={
                <span className="inline-flex items-center gap-1.5">
                  <Scale className="h-4 w-4 text-leaf-600" aria-hidden />
                  {formatNumber(ctx.profile.weightKg, 1)} kg
                </span>
              }
              hint={
                <Link href="/profil" className="font-bold text-leaf-700 hover:underline">
                  Aktualisieren
                </Link>
              }
            />
          </Card>
        </div>
      </div>
    </>
  );
}
