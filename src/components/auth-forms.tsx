"use client";

import Link from "next/link";
import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Field, FormError, Input } from "@/components/ui/form";
import { loginAction, registerAction, type FormState } from "@/server/actions/auth";

export function LoginForm({ next }: { next?: string }) {
  const [state, action, pending] = useActionState<FormState, FormData>(loginAction, {});
  return (
    <form action={action} className="flex flex-col gap-4" noValidate>
      <input type="hidden" name="weiter" value={next ?? "/heute"} />
      <FormError message={state.error} />
      <Field label="E-Mail" htmlFor="email" error={state.fieldErrors?.email}>
        <Input id="email" name="email" type="email" autoComplete="email" required />
      </Field>
      <Field label="Passwort" htmlFor="password" error={state.fieldErrors?.password}>
        <Input id="password" name="password" type="password" autoComplete="current-password" required />
      </Field>
      <Button type="submit" size="lg" disabled={pending} className="mt-2">
        {pending ? "Anmelden ..." : "Anmelden"}
      </Button>
      <p className="text-center text-sm text-muted">
        Noch kein Konto?{" "}
        <Link href="/registrieren" className="font-bold text-leaf-700 underline-offset-4 hover:underline">
          Jetzt registrieren
        </Link>
      </p>
    </form>
  );
}

export function RegisterForm() {
  const [state, action, pending] = useActionState<FormState, FormData>(registerAction, {});
  return (
    <form action={action} className="flex flex-col gap-4" noValidate>
      <FormError message={state.error} />
      <Field label="Name" htmlFor="name" error={state.fieldErrors?.name}>
        <Input id="name" name="name" autoComplete="given-name" required />
      </Field>
      <Field label="E-Mail" htmlFor="email" error={state.fieldErrors?.email}>
        <Input id="email" name="email" type="email" autoComplete="email" required />
      </Field>
      <Field label="Passwort" htmlFor="password" error={state.fieldErrors?.password} hint="Mindestens 8 Zeichen">
        <Input id="password" name="password" type="password" autoComplete="new-password" required minLength={8} />
      </Field>
      <Button type="submit" size="lg" disabled={pending} className="mt-2">
        {pending ? "Konto wird erstellt ..." : "Konto erstellen"}
      </Button>
      <p className="text-center text-sm text-muted">
        Schon registriert?{" "}
        <Link href="/login" className="font-bold text-leaf-700 underline-offset-4 hover:underline">
          Anmelden
        </Link>
      </p>
    </form>
  );
}
