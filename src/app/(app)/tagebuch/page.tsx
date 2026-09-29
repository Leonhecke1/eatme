import type { Metadata } from "next";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { DaySummary } from "@/components/day-summary";
import { LogList } from "@/components/log-list";
import { QuickAdd } from "@/components/quick-add";
import { ButtonLink } from "@/components/ui/button";
import { Card, SectionTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page";
import { addDays, formatDateLong, isISODate, mealTypeForNow, todayISO } from "@/lib/dates";
import { requireProfileUser } from "@/server/auth";
import { loadUserContext } from "@/server/context";
import { ingredientsForQuickAdd, loadDayLog } from "@/server/day";

export const metadata: Metadata = { title: "Tagebuch" };

export default async function DiaryPage({ searchParams }: PageProps<"/tagebuch">) {
  const user = await requireProfileUser();
  const sp = await searchParams;
  const today = todayISO();
  const date = typeof sp.datum === "string" && isISODate(sp.datum) && sp.datum <= today ? sp.datum : today;
  const [ctx, day, ingredients] = await Promise.all([loadUserContext(user.id), loadDayLog(user.id, date), ingredientsForQuickAdd()]);
  const isToday = date === today;

  return (
    <>
      <PageHeader
        title="Tagebuch"
        subtitle={isToday ? `Heute, ${formatDateLong(date)}` : formatDateLong(date)}
        actions={
          <div className="flex items-center gap-1 rounded-2xl bg-surface p-1 shadow-soft">
            <ButtonLink href={`/tagebuch?datum=${addDays(date, -1)}`} variant="ghost" size="icon-sm" aria-label="Vorheriger Tag">
              <ChevronLeft className="h-5 w-5" aria-hidden />
            </ButtonLink>
            <ButtonLink href="/tagebuch" variant="ghost" size="sm" aria-disabled={isToday}>
              Heute
            </ButtonLink>
            {isToday ? (
              <span className="flex h-9 w-9 items-center justify-center text-mint-300" aria-hidden>
                <ChevronRight className="h-5 w-5" />
              </span>
            ) : (
              <ButtonLink href={`/tagebuch?datum=${addDays(date, 1)}`} variant="ghost" size="icon-sm" aria-label="Nächster Tag">
                <ChevronRight className="h-5 w-5" aria-hidden />
              </ButtonLink>
            )}
          </div>
        }
      />
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[1fr_360px]">
        <div className="space-y-5">
          <Card>
            <DaySummary
              eaten={day.totals}
              target={{ kcal: ctx.energy.target, protein: ctx.energy.protein, carbs: ctx.energy.carbs, fat: ctx.energy.fat }}
            />
          </Card>
          <Card>
            <SectionTitle>Einträge</SectionTitle>
            <LogList entries={day.entries} emptyText="Für diesen Tag gibt es keine Einträge." />
          </Card>
        </div>
        <div className="lg:sticky lg:top-8 lg:self-start">
          <Card>
            <SectionTitle>Lebensmittel eintragen</SectionTitle>
            <QuickAdd ingredients={ingredients} date={date} defaultMealType={isToday ? mealTypeForNow() : "MITTAG"} />
            <p className="mt-3 text-xs text-muted">Ganze Rezepte trägst du direkt auf der Rezeptseite oder über den Wochenplan ein.</p>
          </Card>
        </div>
      </div>
    </>
  );
}
