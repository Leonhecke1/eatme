"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Field, FormError, Input } from "@/components/ui/form";
import { changePasswordAction, deleteAccountAction, updateNameAction, type AccountState } from "@/server/actions/account";

function Ok({ text }: { text?: string }) {
  if (!text) return null;
  return <p className="rounded-2xl bg-mint-100 px-4 py-3 text-sm font-bold text-leaf-700">{text}</p>;
}

export function NameForm({ name }: { name: string }) {
  const [state, action, pending] = useActionState<AccountState, FormData>(updateNameAction, {});
  return (
    <form action={action} className="space-y-3">
      <Field label="Name" htmlFor="name">
        <Input id="name" name="name" defaultValue={name} required />
      </Field>
      <FormError message={state.error} />
      <Ok text={state.ok} />
      <Button type="submit" disabled={pending}>
        Speichern
      </Button>
    </form>
  );
}

export function PasswordForm() {
  const [state, action, pending] = useActionState<AccountState, FormData>(changePasswordAction, {});
  return (
    <form action={action} className="space-y-3">
      <Field label="Aktuelles Passwort" htmlFor="current">
        <Input id="current" name="current" type="password" autoComplete="current-password" required />
      </Field>
      <Field label="Neues Passwort" htmlFor="next" hint="Mindestens 8 Zeichen">
        <Input id="next" name="next" type="password" autoComplete="new-password" minLength={8} required />
      </Field>
      <FormError message={state.error} />
      <Ok text={state.ok} />
      <Button type="submit" disabled={pending}>
        Passwort ändern
      </Button>
    </form>
  );
}

export function DeleteAccountForm() {
  const [state, action, pending] = useActionState<AccountState, FormData>(deleteAccountAction, {});
  return (
    <form action={action} className="space-y-3">
      <p className="text-sm text-muted">
        Dabei werden dein Profil, alle Pläne, gespeicherten Rezepte und Tagebuch-Einträge endgültig gelöscht.
      </p>
      <Field label="Passwort" htmlFor="del-password">
        <Input id="del-password" name="password" type="password" autoComplete="current-password" required />
      </Field>
      <Field label="Zur Bestätigung LOESCHEN eintippen" htmlFor="confirm">
        <Input id="confirm" name="confirm" autoComplete="off" required />
      </Field>
      <FormError message={state.error} />
      <Button type="submit" variant="danger" disabled={pending}>
        Konto endgültig löschen
      </Button>
    </form>
  );
}
