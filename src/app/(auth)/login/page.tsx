import type { Metadata } from "next";
import { LoginForm } from "@/components/auth-forms";

export const metadata: Metadata = { title: "Anmelden" };

export default async function LoginPage({ searchParams }: PageProps<"/login">) {
  const { weiter } = await searchParams;
  return (
    <>
      <h1 className="text-2xl font-extrabold">Willkommen zurück</h1>
      <p className="mb-6 mt-1 text-muted">Melde dich an, um deinen Plan zu sehen.</p>
      <LoginForm next={typeof weiter === "string" ? weiter : undefined} />
    </>
  );
}
