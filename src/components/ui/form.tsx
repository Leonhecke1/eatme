import type { ComponentProps, ReactNode } from "react";
import { cn } from "@/lib/cn";

const fieldBase =
  "w-full rounded-2xl border border-line bg-surface px-4 text-[15px] text-ink placeholder:text-muted/70 focus:border-leaf-400 focus:outline-none focus:ring-4 focus:ring-mint-200 disabled:bg-mint-50";

export function Input({ className, ...props }: ComponentProps<"input">) {
  return <input className={cn(fieldBase, "h-12", className)} {...props} />;
}

export function Select({ className, ...props }: ComponentProps<"select">) {
  return <select className={cn(fieldBase, "h-12 pr-8", className)} {...props} />;
}

export function Textarea({ className, ...props }: ComponentProps<"textarea">) {
  return <textarea className={cn(fieldBase, "min-h-24 py-3", className)} {...props} />;
}

export function Field({
  label,
  htmlFor,
  error,
  hint,
  children,
  className,
}: {
  label: string;
  htmlFor?: string;
  error?: string;
  hint?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      <label htmlFor={htmlFor} className="text-sm font-bold text-ink">
        {label}
      </label>
      {children}
      {error ? (
        <p className="text-sm font-semibold text-rose-600">{error}</p>
      ) : hint ? (
        <p className="text-xs text-muted">{hint}</p>
      ) : null}
    </div>
  );
}

export function FormError({ message }: { message?: string }) {
  if (!message) return null;
  return (
    <p role="alert" className="rounded-2xl bg-rose-100 px-4 py-3 text-sm font-semibold text-rose-600">
      {message}
    </p>
  );
}
