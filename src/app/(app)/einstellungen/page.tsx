import type { Metadata } from "next";
import { Download, LogOut } from "lucide-react";
import { DeleteAccountForm, NameForm, PasswordForm } from "@/components/account-forms";
import { Button, buttonClass } from "@/components/ui/button";
import { Card, SectionTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page";
import { logoutAction } from "@/server/actions/auth";
import { requireProfileUser } from "@/server/auth";

export const metadata: Metadata = { title: "Einstellungen" };

export default async function SettingsPage() {
  const user = await requireProfileUser();
  return (
    <>
      <PageHeader title="Einstellungen" subtitle={user.email} />
      <div className="grid gap-5 lg:grid-cols-2">
        <Card>
          <SectionTitle>Konto</SectionTitle>
          <NameForm name={user.name} />
        </Card>
        <Card>
          <SectionTitle>Passwort</SectionTitle>
          <PasswordForm />
        </Card>
        <Card>
          <SectionTitle>Deine Daten</SectionTitle>
          <p className="mb-3 text-sm text-muted">Lade alle deine Daten als JSON-Datei herunter.</p>
          <div className="flex flex-wrap gap-2">
            <a href="/api/export" className={buttonClass("secondary")} download>
              <Download className="h-5 w-5" aria-hidden /> Daten exportieren
            </a>
            <form action={logoutAction}>
              <Button type="submit" variant="ghost">
                <LogOut className="h-5 w-5" aria-hidden /> Abmelden
              </Button>
            </form>
          </div>
        </Card>
        <Card>
          <SectionTitle>Konto löschen</SectionTitle>
          <DeleteAccountForm />
        </Card>
      </div>
    </>
  );
}
