import { redirect } from "next/navigation";
import { CalendarDays, Calculator, ListChecks, ShoppingBasket, Sprout, Wallet } from "lucide-react";
import { ButtonLink } from "@/components/ui/button";
import { Logo } from "@/components/logo";
import { getSession } from "@/server/auth";

const FEATURES = [
  { icon: Calculator, title: "Dein Bedarf", text: "Aus Körpermaßen, Alltag und Sport berechnen wir Kalorien und Makros." },
  { icon: CalendarDays, title: "Wochenplan", text: "Passend zu Ziel, Lieblingslebensmitteln und Allergien." },
  { icon: Wallet, title: "Budget im Blick", text: "Wähle deinen Supermarkt und dein Wochenbudget." },
  { icon: ShoppingBasket, title: "Einkaufsliste", text: "Automatisch zusammengefasst, mit Packungen und Kosten." },
  { icon: ListChecks, title: "Rezepte anpassen", text: "Zutaten ergänzen, streichen und beim Kochen abhaken." },
  { icon: Sprout, title: "100 % vegan", text: "Alle Rezepte und Zutaten sind rein pflanzlich." },
];

export default async function LandingPage() {
  if (await getSession()) redirect("/heute");
  return (
    <div className="min-h-dvh bg-gradient-to-b from-mint-100 via-canvas to-canvas">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-4 py-5 sm:px-6">
        <Logo />
        <ButtonLink href="/login" variant="ghost" size="sm">
          Anmelden
        </ButtonLink>
      </header>
      <main className="mx-auto max-w-6xl px-4 pb-16 sm:px-6">
        <section className="grid grid-cols-1 items-center gap-10 py-8 md:grid-cols-2 md:py-16">
          <div>
            <p className="mb-3 inline-flex rounded-full bg-mint-200 px-3 py-1 text-sm font-bold text-leaf-700">
              Vegan essen, einfach geplant
            </p>
            <h1 className="text-3xl font-extrabold leading-tight tracking-tight text-ink sm:text-5xl">
              Kalorien tracken und Wochenpläne erstellen, die zu dir passen.
            </h1>
            <p className="mt-4 max-w-lg text-lg text-muted">
              Ob Muskelaufbau, Abnehmen oder Zunehmen: EatMe berechnet deinen Bedarf und plant rein pflanzliche Mahlzeiten
              innerhalb deines Budgets.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <ButtonLink href="/registrieren" size="lg">
                Kostenlos starten
              </ButtonLink>
              <ButtonLink href="/login" variant="secondary" size="lg">
                Ich habe schon ein Konto
              </ButtonLink>
            </div>
          </div>
          <div className="min-w-0 rounded-[2rem] bg-surface p-5 shadow-lift sm:p-7">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
                <p className="text-sm font-bold text-muted">Heute</p>
                <p className="text-2xl font-extrabold text-ink sm:text-3xl">
                  1.840 <span className="text-base font-bold text-muted sm:text-lg">/ 2.650 kcal</span>
                </p>
              </div>
              <span className="shrink-0 rounded-full bg-mint-100 px-3 py-1 text-sm font-bold text-leaf-700">Muskelaufbau</span>
            </div>
            <div className="mt-5 space-y-3">
              {[
                ["Protein", 118, 144, "bg-leaf-400"],
                ["Kohlenhydrate", 210, 320, "bg-sky-400"],
                ["Fett", 58, 80, "bg-butter-400"],
              ].map(([label, v, m, c]) => (
                <div key={label as string}>
                  <div className="mb-1 flex justify-between text-sm">
                    <span className="font-bold">{label}</span>
                    <span className="text-muted">
                      {v} / {m} g
                    </span>
                  </div>
                  <div className="h-2.5 rounded-full bg-mint-100">
                    <div className={`h-full rounded-full ${c}`} style={{ width: `${((v as number) / (m as number)) * 100}%` }} />
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-6 grid gap-2">
              {["Schoko-Protein-Porridge", "Teriyaki-Tofu mit Brokkoli", "Chili sin Carne mit Reis"].map((t, i) => (
                <div key={t} className="flex items-center justify-between rounded-2xl bg-mint-50 px-4 py-3">
                  <span className="font-bold">{t}</span>
                  <span className="text-sm text-muted">{["Frühstück", "Mittag", "Abend"][i]}</span>
                </div>
              ))}
            </div>
          </div>
        </section>
        <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map(({ icon: Icon, title, text }) => (
            <div key={title} className="rounded-3xl bg-surface p-5 shadow-soft">
              <span className="mb-3 flex h-11 w-11 items-center justify-center rounded-2xl bg-mint-100 text-leaf-600">
                <Icon className="h-5 w-5" aria-hidden />
              </span>
              <h2 className="font-extrabold">{title}</h2>
              <p className="mt-1 text-sm text-muted">{text}</p>
            </div>
          ))}
        </section>
      </main>
    </div>
  );
}
