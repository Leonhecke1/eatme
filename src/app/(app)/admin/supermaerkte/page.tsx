import type { Metadata } from "next";
import { Button } from "@/components/ui/button";
import { Card, SectionTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/form";
import { db } from "@/lib/db";
import { saveSupermarketAdminAction } from "@/server/actions/admin";

export const metadata: Metadata = { title: "Supermärkte verwalten" };

export default async function AdminSupermarketsPage() {
  const markets = await db.supermarket.findMany({
    orderBy: { priceFactor: "asc" },
    include: { _count: { select: { profiles: true } } },
  });
  return (
    <div className="space-y-5">
      <Card>
        <SectionTitle>Preisfaktoren</SectionTitle>
        <p className="mb-4 text-sm text-muted">
          Der Faktor wird mit dem Richtpreis jeder Zutat multipliziert. 1,0 entspricht dem Durchschnitt.
        </p>
        <ul className="space-y-2">
          {markets.map((m) => (
            <li key={m.id}>
              <form action={saveSupermarketAdminAction} className="flex flex-wrap items-center gap-2 rounded-2xl bg-mint-50 p-2">
                <input type="hidden" name="id" value={m.id} />
                <Input name="name" defaultValue={m.name} className="h-10 min-w-40 flex-1" aria-label="Name" />
                <Input name="priceFactor" defaultValue={m.priceFactor} inputMode="decimal" className="h-10 w-24" aria-label="Preisfaktor" />
                <span className="text-xs text-muted">{m._count.profiles} Nutzer</span>
                <Button type="submit" size="sm">
                  Speichern
                </Button>
              </form>
            </li>
          ))}
        </ul>
      </Card>
      <Card>
        <SectionTitle>Neuer Supermarkt</SectionTitle>
        <form action={saveSupermarketAdminAction} className="flex flex-wrap items-center gap-2">
          <Input name="name" placeholder="Name" required className="h-10 min-w-40 flex-1" aria-label="Name" />
          <Input name="priceFactor" placeholder="1,0" inputMode="decimal" required className="h-10 w-24" aria-label="Preisfaktor" />
          <Button type="submit" size="sm">
            Anlegen
          </Button>
        </form>
      </Card>
    </div>
  );
}
