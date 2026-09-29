import type { Metadata } from "next";
import { RegisterForm } from "@/components/auth-forms";

export const metadata: Metadata = { title: "Registrieren" };

export default function RegisterPage() {
  return (
    <>
      <h1 className="text-2xl font-extrabold">Konto erstellen</h1>
      <p className="mb-6 mt-1 text-muted">In wenigen Schritten zu deinem veganen Ernährungsplan.</p>
      <RegisterForm />
    </>
  );
}
