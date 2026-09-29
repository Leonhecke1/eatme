"use client";

import { useState, type ReactNode } from "react";
import { ChevronDown, SlidersHorizontal } from "lucide-react";
import { cn } from "@/lib/cn";

/** Mobil zugeklappte Filter (mit Zaehler), ab sm immer sichtbar. */
export function CollapsibleFilters({ activeCount, children }: { activeCount: number; children: ReactNode }) {
  const [open, setOpen] = useState(activeCount > 0);
  return (
    <div>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        aria-expanded={open}
        className="flex h-10 items-center gap-2 rounded-full border border-line bg-surface px-4 text-sm font-bold sm:hidden"
      >
        <SlidersHorizontal className="h-4 w-4 text-leaf-600" aria-hidden />
        Filter
        {activeCount > 0 ? (
          <span className="rounded-full bg-leaf-600 px-2 py-0.5 text-xs text-white">{activeCount}</span>
        ) : null}
        <ChevronDown className={cn("h-4 w-4 transition-transform", open && "rotate-180")} aria-hidden />
      </button>
      <div className={cn("mt-3 space-y-3 sm:mt-0 sm:block", open ? "block" : "hidden")}>{children}</div>
    </div>
  );
}
