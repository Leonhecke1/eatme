"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BookOpen,
  Bookmark,
  CalendarDays,
  LogOut,
  NotebookPen,
  Settings,
  Shield,
  ShoppingBasket,
  Sun,
  UserRound,
} from "lucide-react";
import { Logo } from "@/components/logo";
import { cn } from "@/lib/cn";
import { logoutAction } from "@/server/actions/auth";

const MAIN = [
  { href: "/heute", label: "Heute", icon: Sun },
  { href: "/plan", label: "Plan", icon: CalendarDays },
  { href: "/rezepte", label: "Rezepte", icon: BookOpen },
  { href: "/gespeichert", label: "Gespeichert", icon: Bookmark },
  { href: "/profil", label: "Profil", icon: UserRound },
];

const SECONDARY = [
  { href: "/tagebuch", label: "Tagebuch", icon: NotebookPen },
  { href: "/plan/einkaufsliste", label: "Einkaufsliste", icon: ShoppingBasket },
  { href: "/einstellungen", label: "Einstellungen", icon: Settings },
];

function isActive(pathname: string, href: string) {
  if (href === "/plan") return pathname === "/plan";
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function Sidebar({ name, isAdmin }: { name: string; isAdmin: boolean }) {
  const pathname = usePathname();
  const items = [...SECONDARY, ...(isAdmin ? [{ href: "/admin", label: "Verwaltung", icon: Shield }] : [])];
  return (
    <aside className="sticky top-0 hidden h-dvh w-64 shrink-0 flex-col border-r border-line bg-surface/70 px-4 py-6 backdrop-blur md:flex lg:w-72">
      <Link href="/heute" className="mb-8 px-2">
        <Logo />
      </Link>
      <nav className="flex flex-col gap-1" aria-label="Hauptnavigation">
        {MAIN.map((item) => (
          <NavLink key={item.href} {...item} active={isActive(pathname, item.href)} />
        ))}
        <div className="my-3 h-px bg-line" />
        {items.map((item) => (
          <NavLink key={item.href} {...item} active={isActive(pathname, item.href)} />
        ))}
      </nav>
      <div className="mt-auto rounded-2xl bg-mint-50 p-3">
        <p className="truncate px-1 text-sm font-bold text-ink">{name}</p>
        <form action={logoutAction}>
          <button
            type="submit"
            className="mt-2 flex w-full items-center gap-2 rounded-xl px-2 py-2 text-sm font-bold text-muted hover:bg-mint-100 hover:text-leaf-700"
          >
            <LogOut className="h-4 w-4" aria-hidden />
            Abmelden
          </button>
        </form>
      </div>
    </aside>
  );
}

function NavLink({
  href,
  label,
  icon: Icon,
  active,
}: {
  href: string;
  label: string;
  icon: typeof Sun;
  active: boolean;
}) {
  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={cn(
        "flex items-center gap-3 rounded-2xl px-3 py-2.5 text-[15px] font-bold transition-colors",
        active ? "bg-mint-100 text-leaf-700" : "text-muted hover:bg-mint-50 hover:text-ink",
      )}
    >
      <Icon className="h-5 w-5" aria-hidden />
      {label}
    </Link>
  );
}

export function BottomNav() {
  const pathname = usePathname();
  return (
    <nav
      aria-label="Hauptnavigation"
      className="pb-safe fixed inset-x-0 bottom-0 z-40 border-t border-line bg-surface/95 backdrop-blur md:hidden"
    >
      <ul className="mx-auto grid max-w-lg grid-cols-5">
        {MAIN.map(({ href, label, icon: Icon }) => {
          const active = isActive(pathname, href);
          return (
            <li key={href}>
              <Link
                href={href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex h-16 flex-col items-center justify-center gap-1 text-[11px] font-bold",
                  active ? "text-leaf-700" : "text-muted",
                )}
              >
                <span
                  className={cn(
                    "flex h-8 w-14 items-center justify-center rounded-full transition-colors",
                    active && "bg-mint-100",
                  )}
                >
                  <Icon className="h-5 w-5" aria-hidden />
                </span>
                {label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

export function MobileTopBar({ isAdmin }: { isAdmin: boolean }) {
  return (
    <div className="sticky top-0 z-30 flex items-center justify-between border-b border-line bg-canvas/90 px-4 py-2.5 backdrop-blur md:hidden">
      <Link href="/heute" aria-label="Startseite">
        <Logo />
      </Link>
      <div className="flex items-center gap-1">
        <TopIcon href="/tagebuch" label="Tagebuch" icon={NotebookPen} />
        <TopIcon href="/plan/einkaufsliste" label="Einkaufsliste" icon={ShoppingBasket} />
        {isAdmin ? <TopIcon href="/admin" label="Verwaltung" icon={Shield} /> : null}
        <TopIcon href="/einstellungen" label="Einstellungen" icon={Settings} />
      </div>
    </div>
  );
}

function TopIcon({ href, label, icon: Icon }: { href: string; label: string; icon: typeof Sun }) {
  const pathname = usePathname();
  const active = isActive(pathname, href);
  return (
    <Link
      href={href}
      aria-label={label}
      title={label}
      className={cn(
        "flex h-10 w-10 items-center justify-center rounded-xl",
        active ? "bg-mint-100 text-leaf-700" : "text-muted hover:bg-mint-50",
      )}
    >
      <Icon className="h-5 w-5" aria-hidden />
    </Link>
  );
}
