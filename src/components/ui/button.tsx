import Link from "next/link";
import type { ComponentProps } from "react";
import { cn } from "@/lib/cn";

type Variant = "primary" | "secondary" | "ghost" | "danger" | "soft";
type Size = "sm" | "md" | "lg" | "icon" | "icon-sm";

const base =
  "inline-flex items-center justify-center gap-2 rounded-2xl font-bold transition-colors disabled:opacity-50 disabled:pointer-events-none select-none";

const variants: Record<Variant, string> = {
  primary: "bg-leaf-600 text-white hover:bg-leaf-700 active:bg-leaf-800 shadow-soft",
  secondary: "bg-surface text-leaf-700 border border-line hover:bg-mint-50 active:bg-mint-100",
  soft: "bg-mint-100 text-leaf-700 hover:bg-mint-200 active:bg-mint-300",
  ghost: "text-leaf-700 hover:bg-mint-100 active:bg-mint-200",
  danger: "bg-rose-100 text-rose-600 hover:bg-rose-600 hover:text-white",
};

const sizes: Record<Size, string> = {
  sm: "h-9 px-3 text-sm",
  md: "h-11 px-4 text-[15px]",
  lg: "h-13 px-6 text-base",
  icon: "h-11 w-11",
  "icon-sm": "h-9 w-9 rounded-xl",
};

export function buttonClass(variant: Variant = "primary", size: Size = "md", className?: string) {
  return cn(base, variants[variant], sizes[size], className);
}

export function Button({
  variant = "primary",
  size = "md",
  className,
  type = "button",
  ...props
}: ComponentProps<"button"> & { variant?: Variant; size?: Size }) {
  return <button type={type} className={buttonClass(variant, size, className)} {...props} />;
}

export function ButtonLink({
  variant = "primary",
  size = "md",
  className,
  ...props
}: ComponentProps<typeof Link> & { variant?: Variant; size?: Size }) {
  return <Link className={buttonClass(variant, size, className)} {...props} />;
}
