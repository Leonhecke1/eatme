"use client";

import { useMemo, useState, useTransition } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Dumbbell,
  Flame,
  HeartOff,
  Minus,
  Plus,
  Scale,
  Search,
  ThumbsUp,
  Trash2,
  TrendingUp,
} from "lucide-react";
import { EnergySummary } from "@/components/energy-summary";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Chip } from "@/components/ui/chip";
import { Field, FormError, Input, Select } from "@/components/ui/form";
import { cn } from "@/lib/cn";
import { ALLERGENS, ALLERGEN_LABELS, BASE_LABELS, BASE_TYPES, formatNumber } from "@/lib/labels";
import {
  ACTIVITY_FACTORS,
  GOALS,
  SPORTS,
  ageFromBirthDate,
  calculateEnergy,
  type DailyActivity,
  type Goal,
} from "@/lib/nutrition/energy";
import type { ProfileInput } from "@/lib/validators/profile";
import { saveProfileAction } from "@/server/actions/profile";

interface Props {
  mode: "onboarding" | "edit";
  initial: ProfileInput;
  supermarkets: { id: string; name: string; priceFactor: number }[];
  ingredients: { id: string; name: string; category: string }[];
}

const STEPS = ["Körper", "Alltag & Sport", "Ziel", "Lebensmittel", "Einkauf", "Ergebnis"];

const GOAL_ICONS: Record<Goal, typeof Flame> = {
  ABNEHMEN: Flame,
  HALTEN: Scale,
  MUSKELAUFBAU: Dumbbell,
  ZUNEHMEN: TrendingUp,
};

export function ProfileEditor({ mode, initial, supermarkets, ingredients }: Props) {
  const [data, setData] = useState<ProfileInput>(initial);
  const [step, setStep] = useState(0);
  const [error, setError] = useState<string>();
  const [saved, setSaved] = useState(false);
  const [pending, startTransition] = useTransition();

  const set = <K extends keyof ProfileInput>(key: K, value: ProfileInput[K]) => {
    setSaved(false);
    setData((d) => ({ ...d, [key]: value }));
  };

  const energy = useMemo(() => {
    const age = data.birthDate ? ageFromBirthDate(new Date(data.birthDate)) : 30;
    if (!data.heightCm || !data.weightKg || Number.isNaN(age)) return null;
    return calculateEnergy({
      sex: data.sex,
      age,
      heightCm: Number(data.heightCm),
      weightKg: Number(data.weightKg),
      bodyFatPct: data.bodyFatPct ? Number(data.bodyFatPct) : null,
      dailyActivity: data.dailyActivity,
      goal: data.goal,
      sports: data.sports,
    });
  }, [data]);

  const stepError = (s: number): string | undefined => {
    if (s === 0) {
      if (!data.birthDate) return "Bitte gib dein Geburtsdatum an.";
      if (!(data.heightCm >= 120 && data.heightCm <= 230)) return "Bitte gib eine Größe zwischen 120 und 230 cm an.";
      if (!(data.weightKg >= 35 && data.weightKg <= 300)) return "Bitte gib ein Gewicht zwischen 35 und 300 kg an.";
    }
    if (s === 4 && !(data.weeklyBudgetEuro >= 10)) return "Bitte gib ein Wochenbudget von mindestens 10 Euro an.";
    return undefined;
  };

  const submit = () => {
    for (let s = 0; s < 5; s++) {
      const e = stepError(s);
      if (e) {
        setError(e);
        if (mode === "onboarding") setStep(s);
        return;
      }
    }
    setError(undefined);
    startTransition(async () => {
      const res = await saveProfileAction(
        { ...data, bodyFatPct: data.bodyFatPct ? Number(data.bodyFatPct) : null },
        mode,
      );
      if (res?.error) setError(res.error);
      else setSaved(true);
    });
  };

  const sections = [
    <BodySection key="body" data={data} set={set} />,
    <ActivitySection key="activity" data={data} set={set} />,
    <GoalSection key="goal" data={data} set={set} />,
    <FoodSection key="food" data={data} set={set} ingredients={ingredients} />,
    <ShoppingSection key="shop" data={data} set={set} supermarkets={supermarkets} dailyKcal={energy?.target} />,
  ];

  if (mode === "edit") {
    return (
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[1fr_340px]">
        <div className="space-y-5">
          {sections.map((s, i) => (
            <Card key={i}>
              <h2 className="mb-4 text-lg font-extrabold">{STEPS[i]}</h2>
              {s}
            </Card>
          ))}
        </div>
        <div className="lg:sticky lg:top-8 lg:self-start">
          <Card>
            {energy ? <EnergySummary energy={energy} goal={data.goal} activity={data.dailyActivity} /> : null}
            <div className="mt-4 space-y-3">
              <FormError message={error} />
              <Button size="lg" className="w-full" onClick={submit} disabled={pending}>
                {saved ? <Check className="h-5 w-5" aria-hidden /> : null}
                {pending ? "Speichern ..." : saved ? "Gespeichert" : "Änderungen speichern"}
              </Button>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  const isLast = step === STEPS.length - 1;
  return (
    <div className="mx-auto w-full max-w-2xl">
      <ol className="mb-6 flex gap-1.5" aria-label="Fortschritt">
        {STEPS.map((label, i) => (
          <li key={label} className="flex-1">
            <div className={cn("h-2 rounded-full transition-colors", i <= step ? "bg-leaf-500" : "bg-mint-200")} />
            <span className={cn("mt-1.5 hidden text-xs font-bold sm:block", i === step ? "text-leaf-700" : "text-muted")}>
              {label}
            </span>
          </li>
        ))}
      </ol>
      <Card className="p-5 sm:p-8">
        <p className="text-sm font-bold text-leaf-600">
          Schritt {step + 1} von {STEPS.length}
        </p>
        <h1 className="mb-5 text-2xl font-extrabold">{STEPS[step]}</h1>
        {isLast ? (
          energy ? (
            <div>
              <EnergySummary energy={energy} goal={data.goal} activity={data.dailyActivity} />
              <p className="mt-4 text-sm text-muted">
                Im nächsten Schritt erstellen wir deinen ersten Wochenplan mit {data.mealsPerDay} Mahlzeiten pro Tag und
                einem Budget von {formatNumber(data.weeklyBudgetEuro)} Euro.
              </p>
            </div>
          ) : null
        ) : (
          sections[step]
        )}
        <div className="mt-6 space-y-3">
          <FormError message={error} />
          <div className="flex gap-3">
            {step > 0 ? (
              <Button variant="secondary" size="lg" onClick={() => setStep(step - 1)} disabled={pending}>
                <ArrowLeft className="h-5 w-5" aria-hidden />
                Zurück
              </Button>
            ) : null}
            {isLast ? (
              <Button size="lg" className="flex-1" onClick={submit} disabled={pending}>
                {pending ? "Plan wird erstellt ..." : "Plan erstellen"}
              </Button>
            ) : (
              <Button
                size="lg"
                className="flex-1"
                onClick={() => {
                  const e = stepError(step);
                  setError(e);
                  if (!e) setStep(step + 1);
                }}
              >
                Weiter
                <ArrowRight className="h-5 w-5" aria-hidden />
              </Button>
            )}
          </div>
        </div>
      </Card>
    </div>
  );
}

type SectionProps = {
  data: ProfileInput;
  set: <K extends keyof ProfileInput>(key: K, value: ProfileInput[K]) => void;
};

function numberOrZero(v: string) {
  const n = Number(v.replace(",", "."));
  return Number.isFinite(n) ? n : 0;
}

function BodySection({ data, set }: SectionProps) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      <Field label="Geschlecht (für die Grundumsatz-Formel)" className="sm:col-span-2">
        <div className="flex flex-wrap gap-2">
          <Chip active={data.sex === "WEIBLICH"} onClick={() => set("sex", "WEIBLICH")}>
            Weiblich
          </Chip>
          <Chip active={data.sex === "MAENNLICH"} onClick={() => set("sex", "MAENNLICH")}>
            Männlich
          </Chip>
        </div>
      </Field>
      <Field label="Geburtsdatum" htmlFor="birthDate">
        <Input id="birthDate" type="date" value={data.birthDate} max={new Date().toISOString().slice(0, 10)} onChange={(e) => set("birthDate", e.target.value)} />
      </Field>
      <Field label="Größe (cm)" htmlFor="heightCm">
        <Input id="heightCm" type="number" inputMode="numeric" value={data.heightCm || ""} onChange={(e) => set("heightCm", numberOrZero(e.target.value))} />
      </Field>
      <Field label="Gewicht (kg)" htmlFor="weightKg">
        <Input id="weightKg" type="number" inputMode="decimal" step="0.1" value={data.weightKg || ""} onChange={(e) => set("weightKg", numberOrZero(e.target.value))} />
      </Field>
      <Field label="Körperfett in % (optional)" htmlFor="bodyFat" hint="Wenn bekannt, rechnen wir genauer (Katch-McArdle).">
        <Input
          id="bodyFat"
          type="number"
          inputMode="decimal"
          value={data.bodyFatPct ?? ""}
          onChange={(e) => set("bodyFatPct", e.target.value === "" ? null : numberOrZero(e.target.value))}
        />
      </Field>
    </div>
  );
}

function ActivitySection({ data, set }: SectionProps) {
  const updateSport = (i: number, patch: Partial<ProfileInput["sports"][number]>) =>
    set(
      "sports",
      data.sports.map((s, idx) => (idx === i ? { ...s, ...patch } : s)),
    );
  return (
    <div className="space-y-5">
      <Field label="Wie aktiv ist dein Alltag (ohne Sport)?">
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          {(Object.keys(ACTIVITY_FACTORS) as DailyActivity[]).map((key) => (
            <OptionCard
              key={key}
              active={data.dailyActivity === key}
              onClick={() => set("dailyActivity", key)}
              title={ACTIVITY_FACTORS[key].label}
              text={ACTIVITY_FACTORS[key].hint}
            />
          ))}
        </div>
      </Field>
      <div>
        <p className="mb-2 text-sm font-bold">Sport</p>
        {data.sports.length === 0 ? (
          <p className="mb-3 rounded-2xl bg-mint-50 px-4 py-3 text-sm text-muted">Noch kein Sport eingetragen.</p>
        ) : null}
        <div className="space-y-3">
          {data.sports.map((s, i) => (
            <div key={i} className="grid grid-cols-2 gap-2 rounded-2xl border border-line p-3 sm:grid-cols-[1fr_120px_120px_auto] sm:items-end">
              <Field label="Sportart" className="col-span-2 sm:col-span-1">
                <Select value={s.type} onChange={(e) => updateSport(i, { type: e.target.value })}>
                  {Object.entries(SPORTS).map(([key, v]) => (
                    <option key={key} value={key}>
                      {v.label}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field label="Minuten">
                <Input type="number" inputMode="numeric" value={s.minutesPerSession || ""} onChange={(e) => updateSport(i, { minutesPerSession: numberOrZero(e.target.value) })} />
              </Field>
              <Field label="Pro Woche">
                <Input type="number" inputMode="numeric" value={s.sessionsPerWeek || ""} onChange={(e) => updateSport(i, { sessionsPerWeek: numberOrZero(e.target.value) })} />
              </Field>
              <Button
                variant="ghost"
                size="icon"
                aria-label="Sport entfernen"
                className="col-span-2 w-full sm:col-span-1 sm:w-11"
                onClick={() => set("sports", data.sports.filter((_, idx) => idx !== i))}
              >
                <Trash2 className="h-5 w-5" aria-hidden />
              </Button>
            </div>
          ))}
        </div>
        <Button
          variant="soft"
          className="mt-3"
          onClick={() => set("sports", [...data.sports, { type: "KRAFTTRAINING", minutesPerSession: 60, sessionsPerWeek: 3 }])}
        >
          <Plus className="h-5 w-5" aria-hidden />
          Sport hinzufügen
        </Button>
      </div>
    </div>
  );
}

function GoalSection({ data, set }: SectionProps) {
  return (
    <div className="space-y-5">
      <Field label="Was ist dein Ziel?">
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          {(Object.keys(GOALS) as Goal[]).map((key) => {
            const Icon = GOAL_ICONS[key];
            return (
              <OptionCard
                key={key}
                active={data.goal === key}
                onClick={() => set("goal", key)}
                title={GOALS[key].label}
                text={GOALS[key].hint}
                icon={<Icon className="h-5 w-5" aria-hidden />}
              />
            );
          })}
        </div>
      </Field>
      <Field label="Mahlzeiten pro Tag">
        <div className="flex flex-wrap gap-2">
          {[3, 4, 5].map((n) => (
            <Chip key={n} active={data.mealsPerDay === n} onClick={() => set("mealsPerDay", n)}>
              {n} {n === 3 ? "(ohne Snack)" : n === 4 ? "(1 Snack)" : "(2 Snacks)"}
            </Chip>
          ))}
        </div>
      </Field>
      <Field label="Welche Beilagen magst du besonders? (optional)" hint="Der Planer bevorzugt diese Gerichte.">
        <div className="flex flex-wrap gap-2">
          {BASE_TYPES.filter((b) => b !== "SONSTIGES").map((b) => (
            <Chip
              key={b}
              active={data.preferredBases.includes(b)}
              onClick={() => set("preferredBases", toggle(data.preferredBases, b))}
            >
              {BASE_LABELS[b]}
            </Chip>
          ))}
        </div>
      </Field>
    </div>
  );
}

function toggle<T>(list: T[], value: T): T[] {
  return list.includes(value) ? list.filter((v) => v !== value) : [...list, value];
}

function FoodSection({ data, set, ingredients }: SectionProps & { ingredients: Props["ingredients"] }) {
  const [modeLike, setModeLike] = useState(true);
  const [query, setQuery] = useState("");
  const grouped = useMemo(() => {
    const q = query.trim().toLowerCase();
    const map = new Map<string, Props["ingredients"]>();
    for (const i of ingredients) {
      if (q && !i.name.toLowerCase().includes(q)) continue;
      map.set(i.category, [...(map.get(i.category) ?? []), i]);
    }
    return [...map.entries()];
  }, [ingredients, query]);

  const onPick = (id: string) => {
    if (modeLike) {
      set("favoriteIds", toggle(data.favoriteIds, id));
      if (data.dislikedIds.includes(id)) set("dislikedIds", data.dislikedIds.filter((x) => x !== id));
    } else {
      set("dislikedIds", toggle(data.dislikedIds, id));
      if (data.favoriteIds.includes(id)) set("favoriteIds", data.favoriteIds.filter((x) => x !== id));
    }
  };

  return (
    <div className="space-y-5">
      <Field label="Unverträglichkeiten">
        <div className="flex flex-wrap gap-2">
          {ALLERGENS.map((a) => (
            <Chip key={a} active={data.allergies.includes(a)} onClick={() => set("allergies", toggle(data.allergies, a))}>
              {ALLERGEN_LABELS[a]}
            </Chip>
          ))}
        </div>
      </Field>
      <div>
        <p className="mb-2 text-sm font-bold">Was isst du oft und gerne, was gar nicht?</p>
        <div className="mb-3 inline-flex rounded-2xl bg-mint-50 p-1">
          <button
            type="button"
            onClick={() => setModeLike(true)}
            className={cn("flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-bold", modeLike ? "bg-surface text-leaf-700 shadow-soft" : "text-muted")}
          >
            <ThumbsUp className="h-4 w-4" aria-hidden /> Esse ich oft ({data.favoriteIds.length})
          </button>
          <button
            type="button"
            onClick={() => setModeLike(false)}
            className={cn("flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-bold", !modeLike ? "bg-surface text-peach-700 shadow-soft" : "text-muted")}
          >
            <HeartOff className="h-4 w-4" aria-hidden /> Mag ich nicht ({data.dislikedIds.length})
          </button>
        </div>
        <div className="relative mb-3">
          <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" aria-hidden />
          <Input placeholder="Lebensmittel suchen" value={query} onChange={(e) => setQuery(e.target.value)} className="pl-10" />
        </div>
        <div className="max-h-[420px] space-y-4 overflow-y-auto pr-1">
          {grouped.map(([category, items]) => (
            <div key={category}>
              <p className="mb-2 text-xs font-bold uppercase tracking-wide text-muted">{category}</p>
              <div className="flex flex-wrap gap-2">
                {items.map((i) => {
                  const fav = data.favoriteIds.includes(i.id);
                  const dis = data.dislikedIds.includes(i.id);
                  return (
                    <button
                      key={i.id}
                      type="button"
                      onClick={() => onPick(i.id)}
                      aria-pressed={fav || dis}
                      className={cn(
                        "inline-flex h-9 items-center gap-1 rounded-full border px-3 text-sm font-bold transition-colors",
                        fav && "border-leaf-600 bg-leaf-600 text-white",
                        dis && "border-peach-200 bg-peach-100 text-peach-700 line-through",
                        !fav && !dis && "border-line bg-surface hover:bg-mint-50",
                      )}
                    >
                      {fav ? <Check className="h-3.5 w-3.5" aria-hidden /> : dis ? <Minus className="h-3.5 w-3.5" aria-hidden /> : null}
                      {i.name}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function ShoppingSection({
  data,
  set,
  supermarkets,
  dailyKcal,
}: SectionProps & { supermarkets: Props["supermarkets"]; dailyKcal?: number }) {
  const factor = supermarkets.find((s) => s.id === data.supermarketId)?.priceFactor ?? 1;
  // Grobe Schaetzung aus den Seed-Rezepten: ca. 0,21 Cent pro kcal bei Faktor 1.
  const estimate = dailyKcal ? Math.round((dailyKcal * 7 * 0.21 * factor) / 100 / 5) * 5 : null;
  return (
    <div className="space-y-5">
      <Field label="Wo kaufst du meistens ein?">
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {supermarkets.map((s) => (
            <button
              key={s.id}
              type="button"
              onClick={() => set("supermarketId", s.id)}
              aria-pressed={data.supermarketId === s.id}
              className={cn(
                "rounded-2xl border px-3 py-3 text-left text-sm font-bold transition-colors",
                data.supermarketId === s.id ? "border-leaf-600 bg-mint-100 text-leaf-800" : "border-line bg-surface hover:bg-mint-50",
              )}
            >
              {s.name}
              <span className="block text-xs font-semibold text-muted">
                {s.priceFactor < 0.95 ? "günstig" : s.priceFactor < 1.05 ? "mittel" : s.priceFactor < 1.3 ? "gehoben" : "Bio"}
              </span>
            </button>
          ))}
        </div>
      </Field>
      <Field label="Budget pro Woche (Euro)" htmlFor="budget" hint={estimate ? `Für deinen Bedarf realistisch: ab ca. ${estimate} Euro pro Woche.` : undefined}>
        <div className="flex items-center gap-4">
          <input
            type="range"
            min={10}
            max={200}
            step={5}
            value={data.weeklyBudgetEuro}
            onChange={(e) => set("weeklyBudgetEuro", Number(e.target.value))}
            className="h-2 flex-1 cursor-pointer accent-leaf-600"
            aria-label="Budget pro Woche"
          />
          <Input
            id="budget"
            type="number"
            inputMode="numeric"
            className="w-28"
            value={data.weeklyBudgetEuro || ""}
            onChange={(e) => set("weeklyBudgetEuro", numberOrZero(e.target.value))}
          />
        </div>
      </Field>
    </div>
  );
}

function OptionCard({
  active,
  onClick,
  title,
  text,
  icon,
}: {
  active: boolean;
  onClick: () => void;
  title: string;
  text: string;
  icon?: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        "flex items-start gap-3 rounded-2xl border p-4 text-left transition-colors",
        active ? "border-leaf-600 bg-mint-100" : "border-line bg-surface hover:bg-mint-50",
      )}
    >
      {icon ? (
        <span className={cn("flex h-9 w-9 shrink-0 items-center justify-center rounded-xl", active ? "bg-leaf-600 text-white" : "bg-mint-100 text-leaf-600")}>
          {icon}
        </span>
      ) : null}
      <span>
        <span className="block font-extrabold text-ink">{title}</span>
        <span className="block text-sm text-muted">{text}</span>
      </span>
    </button>
  );
}
