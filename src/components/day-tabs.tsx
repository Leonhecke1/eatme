"use client";

import { useState, type ReactNode } from "react";
import { cn } from "@/lib/cn";

/**
 * Mobil/Tablet: ein Tag mit Tabs. Ab xl: alle Tage nebeneinander (Tabs ausgeblendet).
 */
export function DayTabs({
  days,
  initial,
  children,
}: {
  days: { short: string; date: string; kcal: number }[];
  initial: number;
  children: ReactNode[];
}) {
  const [active, setActive] = useState(initial);
  return (
    <div>
      <div role="tablist" aria-label="Wochentage" className="scrollbar-none -mx-4 mb-4 flex gap-2 overflow-x-auto px-4 sm:mx-0 sm:px-0 xl:hidden">
        {days.map((d, i) => (
          <button
            key={d.date}
            role="tab"
            type="button"
            aria-selected={active === i}
            onClick={() => setActive(i)}
            className={cn(
              "flex min-w-16 flex-1 flex-col items-center rounded-2xl border px-2 py-2 transition-colors",
              active === i ? "border-leaf-600 bg-leaf-600 text-white" : "border-line bg-surface hover:bg-mint-50",
            )}
          >
            <span className="text-sm font-extrabold">{d.short}</span>
            <span className={cn("text-[11px] font-bold", active === i ? "text-white/80" : "text-muted")}>{d.date}</span>
          </button>
        ))}
      </div>
      <div className="xl:grid xl:grid-cols-7 xl:gap-3">
        {children.map((child, i) => (
          <div key={days[i].date} role="tabpanel" className={cn(active === i ? "block" : "hidden", "xl:block")}>
            {child}
          </div>
        ))}
      </div>
    </div>
  );
}
