import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/cn";

export function PageHeader({
  title,
  subtitle,
  actions,
  className,
}: {
  title: string;
  subtitle?: ReactNode;
  actions?: ReactNode;
  className?: string;
}) {
  return (
    <header className={cn("mb-5 flex flex-wrap items-end justify-between gap-3", className)}>
      <div className="min-w-0">
        <h1 className="text-2xl font-extrabold tracking-tight text-ink sm:text-3xl">{title}</h1>
        {subtitle ? <p className="mt-1 text-sm text-muted sm:text-base">{subtitle}</p> : null}
      </div>
      {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
    </header>
  );
}

export function EmptyState({
  icon: Icon,
  title,
  text,
  action,
}: {
  icon: LucideIcon;
  title: string;
  text?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center rounded-3xl border-2 border-dashed border-mint-200 bg-mint-50/60 px-6 py-10 text-center">
      <span className="mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-mint-100 text-leaf-600">
        <Icon className="h-7 w-7" aria-hidden />
      </span>
      <h3 className="text-lg font-extrabold text-ink">{title}</h3>
      {text ? <p className="mt-1 max-w-sm text-sm text-muted">{text}</p> : null}
      {action ? <div className="mt-5">{action}</div> : null}
    </div>
  );
}

export function Stat({ label, value, hint }: { label: string; value: ReactNode; hint?: ReactNode }) {
  return (
    <div className="rounded-2xl bg-mint-50 px-4 py-3">
      <div className="text-xs font-bold uppercase tracking-wide text-muted">{label}</div>
      <div className="mt-0.5 text-xl font-extrabold tabular-nums text-ink">{value}</div>
      {hint ? <div className="text-xs text-muted">{hint}</div> : null}
    </div>
  );
}
