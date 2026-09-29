import Link from "next/link";
import type { ComponentProps } from "react";
import { cn } from "@/lib/cn";

export function chipClass(active: boolean, className?: string) {
  return cn(
    "inline-flex h-10 shrink-0 items-center gap-1.5 rounded-full border px-4 text-sm font-bold transition-colors",
    active
      ? "border-leaf-600 bg-leaf-600 text-white"
      : "border-line bg-surface text-ink hover:border-leaf-400 hover:bg-mint-50",
    className,
  );
}

export function Chip({
  active = false,
  className,
  type = "button",
  ...props
}: ComponentProps<"button"> & { active?: boolean }) {
  return <button type={type} aria-pressed={active} className={chipClass(active, className)} {...props} />;
}

export function ChipLink({ active = false, className, ...props }: ComponentProps<typeof Link> & { active?: boolean }) {
  return <Link aria-current={active ? "true" : undefined} className={chipClass(active, className)} {...props} />;
}

const tones = {
  mint: "bg-mint-100 text-leaf-700",
  peach: "bg-peach-100 text-peach-700",
  sky: "bg-sky-100 text-ink",
  butter: "bg-butter-100 text-ink",
};

export function Badge({
  className,
  tone = "mint",
  ...props
}: ComponentProps<"span"> & { tone?: keyof typeof tones }) {
  return (
    <span
      className={cn("inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-bold", tones[tone], className)}
      {...props}
    />
  );
}
