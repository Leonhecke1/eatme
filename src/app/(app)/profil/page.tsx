import type { Metadata } from "next";
import { Trash2 } from "lucide-react";
import { ProfileEditor } from "@/components/profile-editor";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/form";
import { PageHeader } from "@/components/ui/page";
import { WeightChart } from "@/components/weight-chart";
import { db } from "@/lib/db";
import { formatDateShort, isoFromDate, todayISO } from "@/lib/dates";
import { formatNumber } from "@/lib/labels";
import { deleteWeightAction, logWeightAction } from "@/server/actions/profile";
import { requireProfileUser } from "@/server/auth";
import { loadProfileEditorData } from "@/server/profile-data";

export const metadata: Metadata = { title: "Profil" };

export default async function ProfilePage() {
  const user = await requireProfileUser();
  const [data, weights] = await Promise.all([
    loadProfileEditorData(user.id),
    db.weightLog.findMany({ where: { userId: user.id }, orderBy: { date: "desc" }, take: 60 }),
  ]);
  const points = [...weights].reverse().map((w) => ({ date: isoFromDate(w.date), weightKg: w.weightKg }));

  return (
    <>
      <PageHeader title="Profil" subtitle="Deine Angaben bestimmen Kalorienbedarf, Makros und Wochenplan." />
      <ProfileEditor mode="edit" {...data} />

      <Card className="mt-5">
        <h2 className="mb-1 text-lg font-extrabold">Gewichtsverlauf</h2>
        <p className="mb-4 text-sm text-muted">Der neueste Eintrag wird automatisch als aktuelles Gewicht übernommen.</p>
        <form action={logWeightAction} className="mb-5 flex flex-wrap items-end gap-2">
          <label className="flex flex-col gap-1 text-sm font-bold">
            Datum
            <Input type="date" name="date" defaultValue={todayISO()} max={todayISO()} className="w-44" />
          </label>
          <label className="flex flex-col gap-1 text-sm font-bold">
            Gewicht (kg)
            <Input type="number" name="weightKg" step="0.1" inputMode="decimal" required className="w-32" />
          </label>
          <Button type="submit">Eintragen</Button>
        </form>
        {points.length > 1 ? <WeightChart points={points} /> : null}
        {weights.length > 0 ? (
          <ul className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {weights.slice(0, 12).map((w) => (
              <li key={w.id} className="flex items-center justify-between rounded-2xl bg-mint-50 px-4 py-2">
                <span className="text-sm text-muted">{formatDateShort(isoFromDate(w.date))}</span>
                <span className="font-extrabold tabular-nums">{formatNumber(w.weightKg, 1)} kg</span>
                <form action={deleteWeightAction}>
                  <input type="hidden" name="id" value={w.id} />
                  <Button type="submit" variant="ghost" size="icon-sm" aria-label="Eintrag löschen">
                    <Trash2 className="h-4 w-4" aria-hidden />
                  </Button>
                </form>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-muted">Noch keine Einträge.</p>
        )}
      </Card>
    </>
  );
}
