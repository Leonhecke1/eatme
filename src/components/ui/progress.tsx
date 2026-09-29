import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

export function ProgressRing({
  value,
  max,
  size = 168,
  stroke = 14,
  children,
}: {
  value: number;
  max: number;
  size?: number;
  stroke?: number;
  children?: ReactNode;
}) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const ratio = max > 0 ? Math.min(1, value / max) : 0;
  const over = max > 0 && value > max * 1.05;
  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90" aria-hidden>
        <circle cx={size / 2} cy={size / 2} r={r} strokeWidth={stroke} className="fill-none stroke-mint-100" />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c * (1 - ratio)}
          className={cn("fill-none transition-all duration-500", over ? "stroke-peach-200" : "stroke-leaf-400")}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center">{children}</div>
    </div>
  );
}

const barTones = {
  leaf: "bg-leaf-400",
  sky: "bg-sky-400",
  butter: "bg-butter-400",
  peach: "bg-peach-200",
};

export function MacroBar({
  label,
  value,
  max,
  unit = "g",
  tone = "leaf",
}: {
  label: string;
  value: number;
  max: number;
  unit?: string;
  tone?: keyof typeof barTones;
}) {
  const pct = max > 0 ? Math.min(100, (value / max) * 100) : 0;
  return (
    <div>
      <div className="mb-1 flex items-baseline justify-between text-sm">
        <span className="font-bold text-ink">{label}</span>
        <span className="tabular-nums text-muted">
          <span className="font-bold text-ink">{Math.round(value)}</span> / {Math.round(max)} {unit}
        </span>
      </div>
      <div
        className="h-2.5 overflow-hidden rounded-full bg-mint-100"
        role="progressbar"
        aria-valuenow={Math.round(value)}
        aria-valuemax={Math.round(max)}
        aria-label={label}
      >
        <div className={cn("h-full rounded-full transition-all duration-500", barTones[tone])} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}
