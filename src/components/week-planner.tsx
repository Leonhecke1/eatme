"use client";

import { useRef, useState } from "react";
import { Check } from "lucide-react";
import { PlanEntryCard } from "@/components/plan-entry-card";
import { MacroBar } from "@/components/ui/progress";
import { cn } from "@/lib/cn";
import { MEAL_LABELS, formatNumber } from "@/lib/labels";
import { formatEuro } from "@/lib/pricing";
import type { PlanEntryView } from "@/server/plan-view";

export interface PlannerDay {
  date: string;
  weekday: string;
  short: string;
  dateLabel: string;
  isToday: boolean;
  entries: PlanEntryView[];
  kcal: number;
  protein: number;
  carbs: number;
  fat: number;
  costCents: number;
}

export interface PlannerTargets {
  kcal: number;
  protein: number;
  carbs: number;
  fat: number;
}

export function WeekPlanner({ days, targets, initial }: { days: PlannerDay[]; targets: PlannerTargets; initial: number }) {
  const [active, setActive] = useState(initial);
  const detailRef = useRef<HTMLDivElement>(null);
  const day = days[active];
  const slotCount = Math.max(...days.map((d) => d.entries.length));
  const slotLabels = Array.from({ length: slotCount }, (_, slot) => {
    const e = days.find((d) => d.entries[slot])?.entries[slot];
    return e ? MEAL_LABELS[e.mealType] : "";
  });

  const select = (i: number, scroll = false) => {
    setActive(i);
    if (scroll) detailRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <div className="space-y-6">
      {/* Wochenleiste */}
      <div
        role="tablist"
        aria-label="Wochentage"
        className="grid grid-cols-7 gap-1.5 sm:gap-2"
      >
        {days.map((d, i) => {
          const selected = i === active;
          const eaten = d.entries.filter((e) => e.eaten).length;
          const ratio = targets.kcal > 0 ? Math.min(1, d.kcal / targets.kcal) : 0;
          return (
            <button
              key={d.date}
              type="button"
              role="tab"
              aria-selected={selected}
              onClick={() => select(i)}
              className={cn(
                "relative flex min-w-0 flex-col items-center rounded-2xl px-0.5 pb-2.5 pt-2 transition-all sm:rounded-3xl sm:px-2 sm:pb-3 sm:pt-2.5",
                selected ? "bg-leaf-600 text-white shadow-lift" : "bg-surface text-ink shadow-soft hover:bg-mint-50",
              )}
            >
              <span className={cn("text-xs font-bold", selected ? "text-white/80" : "text-muted")}>{d.short}</span>
              <span className="text-lg font-extrabold leading-tight">{d.dateLabel.slice(0, 2)}</span>
              <span className={cn("mt-0.5 hidden text-[11px] font-bold tabular-nums sm:block", selected ? "text-white/80" : "text-muted")}>
                {formatNumber(d.kcal)} kcal
              </span>
              <span className={cn("mt-1.5 h-1.5 w-6 overflow-hidden rounded-full sm:mt-2 sm:w-10", selected ? "bg-white/25" : "bg-mint-100")}>
                <span
                  className={cn("block h-full rounded-full", selected ? "bg-white" : "bg-leaf-400")}
                  style={{ width: `${ratio * 100}%` }}
                />
              </span>
              {d.isToday ? (
                <span
                  className={cn(
                    "absolute right-1.5 top-1.5 h-1.5 w-1.5 rounded-full sm:right-2.5 sm:top-2.5 sm:h-2 sm:w-2",
                    selected ? "bg-white" : "bg-leaf-500",
                  )}
                  aria-label="Heute"
                />
              ) : null}
              {eaten > 0 ? (
                <span
                  className={cn("mt-1 inline-flex items-center gap-0.5 text-[10px] font-bold sm:mt-1.5 sm:text-[11px]", selected ? "text-white/90" : "text-leaf-600")}
                  title={`${eaten} von ${d.entries.length} gegessen`}
                >
                  <Check className="h-3 w-3" aria-hidden />
                  {eaten}/{d.entries.length}
                </span>
              ) : null}
            </button>
          );
        })}
      </div>

      {/* Ausgewaehlter Tag */}
      <div ref={detailRef} className="grid scroll-mt-24 grid-cols-1 gap-5 lg:grid-cols-[1fr_320px]">
        <section aria-label={day.weekday}>
          <div className="mb-3 flex items-baseline gap-2 px-1">
            <h2 className="text-xl font-extrabold">
              {day.weekday}, {day.dateLabel}
            </h2>
            {day.isToday ? <span className="rounded-full bg-mint-100 px-2.5 py-0.5 text-xs font-bold text-leaf-700">Heute</span> : null}
          </div>
          <div className="space-y-3">
            {day.entries.map((e) => (
              <PlanEntryCard key={e.id} entry={e} />
            ))}
          </div>
        </section>

        <aside className="lg:sticky lg:top-8 lg:self-start">
          <div className="rounded-3xl bg-surface p-5 shadow-soft">
            <p className="text-sm font-bold text-muted">Tagesbilanz</p>
            <p className="mt-1 text-3xl font-extrabold tabular-nums">
              {formatNumber(day.kcal)}
              <span className="text-base font-bold text-muted"> / {formatNumber(targets.kcal)} kcal</span>
            </p>
            <p
              className={cn(
                "mb-4 text-sm font-bold",
                Math.abs(day.kcal - targets.kcal) <= targets.kcal * 0.05 ? "text-leaf-600" : "text-peach-700",
              )}
            >
              {Math.abs(day.kcal - targets.kcal) <= targets.kcal * 0.05
                ? "Passt zu deinem Ziel"
                : day.kcal > targets.kcal
                  ? `${formatNumber(day.kcal - targets.kcal)} kcal über dem Ziel`
                  : `${formatNumber(targets.kcal - day.kcal)} kcal unter dem Ziel`}
            </p>
            <div className="space-y-3">
              <MacroBar label="Protein" value={day.protein} max={targets.protein} tone="leaf" />
              <MacroBar label="Kohlenhydrate" value={day.carbs} max={targets.carbs} tone="sky" />
              <MacroBar label="Fett" value={day.fat} max={targets.fat} tone="butter" />
            </div>
            <div className="mt-4 flex items-center justify-between rounded-2xl bg-mint-50 px-4 py-3 text-sm">
              <span className="font-bold text-muted">Kosten des Tages</span>
              <span className="font-extrabold tabular-nums">{formatEuro(day.costCents)}</span>
            </div>
          </div>
        </aside>
      </div>

      {/* Woche auf einen Blick (ab Tablet) */}
      <section aria-label="Woche auf einen Blick" className="hidden md:block">
        <h2 className="mb-3 px-1 text-lg font-extrabold">Woche auf einen Blick</h2>
        <div className="overflow-hidden rounded-3xl bg-surface shadow-soft">
          <table className="w-full table-fixed border-collapse text-left">
            <thead>
              <tr>
                <th className="w-28 p-3" />
                {days.map((d, i) => (
                  <th
                    key={d.date}
                    className={cn("p-3 text-center text-xs font-bold", i === active ? "bg-mint-100 text-leaf-800" : "text-muted")}
                  >
                    {d.short} <span className="font-semibold">{d.dateLabel}</span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {slotLabels.map((label, slot) => (
                <tr key={slot} className="border-t border-line">
                  <th scope="row" className="p-3 align-top text-xs font-bold uppercase tracking-wide text-muted">
                    {label}
                  </th>
                  {days.map((d, i) => {
                    const e = d.entries[slot];
                    return (
                      <td key={d.date} className={cn("p-1.5 align-top", i === active && "bg-mint-50")}>
                        {e ? (
                          <button
                            type="button"
                            onClick={() => select(i, true)}
                            className="flex w-full flex-col rounded-2xl px-2 py-1.5 text-left transition-colors hover:bg-mint-100"
                          >
                            <span
                              className={cn(
                                "line-clamp-2 text-[13px] font-bold leading-snug",
                                e.eaten ? "text-muted" : "text-ink",
                              )}
                            >
                              {e.title}
                            </span>
                            <span className="mt-0.5 flex items-center gap-1 text-[11px] font-semibold tabular-nums text-muted">
                              {e.eaten ? <Check className="h-3 w-3 text-leaf-600" aria-label="gegessen" /> : null}
                              {Math.round(e.macros.kcal)} kcal
                            </span>
                          </button>
                        ) : null}
                      </td>
                    );
                  })}
                </tr>
              ))}
              <tr className="border-t border-line bg-mint-50/50">
                <th scope="row" className="p-3 text-xs font-bold uppercase tracking-wide text-muted">
                  Summe
                </th>
                {days.map((d, i) => (
                  <td
                    key={d.date}
                    className={cn("p-3 text-center text-xs font-extrabold tabular-nums", i === active && "bg-mint-100")}
                  >
                    {formatNumber(d.kcal)} kcal
                    <span className="block font-semibold text-muted">{formatEuro(d.costCents)}</span>
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
