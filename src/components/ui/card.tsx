import type { ComponentProps } from "react";
import { cn } from "@/lib/cn";

export function Card({ className, ...props }: ComponentProps<"div">) {
  return <div className={cn("rounded-3xl bg-surface p-4 shadow-soft sm:p-5", className)} {...props} />;
}

export function CardTitle({ className, ...props }: ComponentProps<"h2">) {
  return <h2 className={cn("text-base font-extrabold text-ink", className)} {...props} />;
}

export function SectionTitle({ className, ...props }: ComponentProps<"h2">) {
  return <h2 className={cn("mb-3 text-lg font-extrabold text-ink", className)} {...props} />;
}
