import { cn } from "@/lib/cn";

export function LogoMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 40 40" className={cn("h-9 w-9", className)} aria-hidden>
      <rect width="40" height="40" rx="12" className="fill-mint-200" />
      <path
        d="M11 27c0-9 6.5-15.5 18-16-0.4 11.6-6.8 18-16 18"
        className="fill-leaf-400"
      />
      <path d="M11.5 28.5c3.5-5 7.5-8.5 12.5-11" className="stroke-leaf-700" strokeWidth="2" strokeLinecap="round" fill="none" />
    </svg>
  );
}

export function Logo({ className }: { className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-2.5", className)}>
      <LogoMark />
      <span className="text-xl font-extrabold tracking-tight text-leaf-800">EatMe</span>
    </span>
  );
}
