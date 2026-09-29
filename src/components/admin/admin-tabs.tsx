"use client";

import { usePathname } from "next/navigation";
import { ChipLink } from "@/components/ui/chip";

const TABS = [
  { href: "/admin", label: "Übersicht" },
  { href: "/admin/rezepte", label: "Rezepte" },
  { href: "/admin/zutaten", label: "Zutaten & Preise" },
  { href: "/admin/supermaerkte", label: "Supermärkte" },
];

export function AdminTabs() {
  const pathname = usePathname();
  return (
    <nav aria-label="Verwaltung" className="flex flex-wrap gap-2">
      {TABS.map((t) => (
        <ChipLink
          key={t.href}
          href={t.href}
          active={t.href === "/admin" ? pathname === "/admin" : pathname.startsWith(t.href)}
        >
          {t.label}
        </ChipLink>
      ))}
    </nav>
  );
}
