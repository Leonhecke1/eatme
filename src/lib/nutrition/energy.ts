export type Sex = "MAENNLICH" | "WEIBLICH";
export type DailyActivity = "SITZEND" | "LEICHT" | "MITTEL" | "STARK";
export type Goal = "ABNEHMEN" | "HALTEN" | "MUSKELAUFBAU" | "ZUNEHMEN";

export const SPORTS: Record<string, { label: string; met: number }> = {
  KRAFTTRAINING: { label: "Krafttraining", met: 5.0 },
  LAUFEN: { label: "Laufen / Joggen", met: 9.0 },
  RADFAHREN: { label: "Radfahren", met: 7.5 },
  SCHWIMMEN: { label: "Schwimmen", met: 7.0 },
  FUSSBALL: { label: "Fußball", met: 7.0 },
  BASKETBALL: { label: "Basketball", met: 6.5 },
  TENNIS: { label: "Tennis", met: 7.3 },
  KAMPFSPORT: { label: "Kampfsport", met: 10.0 },
  HIIT: { label: "HIIT / Crossfit", met: 8.0 },
  YOGA: { label: "Yoga / Pilates", met: 3.0 },
  WANDERN: { label: "Wandern", met: 6.0 },
  TANZEN: { label: "Tanzen", met: 5.5 },
  KLETTERN: { label: "Klettern / Bouldern", met: 7.5 },
  SPAZIEREN: { label: "Zügiges Gehen", met: 3.8 },
};

export const ACTIVITY_FACTORS: Record<DailyActivity, { factor: number; label: string; hint: string }> = {
  SITZEND: { factor: 1.2, label: "Sitzend", hint: "Bürojob, wenig Bewegung im Alltag" },
  LEICHT: { factor: 1.375, label: "Leicht aktiv", hint: "Viel Gehen, Stehen, Radwege zur Arbeit" },
  MITTEL: { factor: 1.55, label: "Aktiv", hint: "Stehende Tätigkeit, viel auf den Beinen" },
  STARK: { factor: 1.725, label: "Sehr aktiv", hint: "Körperlich harte Arbeit" },
};

export const GOALS: Record<Goal, { label: string; adjust: number; proteinPerKg: number; hint: string }> = {
  ABNEHMEN: { label: "Abnehmen", adjust: -0.2, proteinPerKg: 2.0, hint: "Moderates Defizit, Muskeln erhalten" },
  HALTEN: { label: "Gewicht halten", adjust: 0, proteinPerKg: 1.4, hint: "Ausgewogen und nachhaltig" },
  MUSKELAUFBAU: { label: "Muskelaufbau", adjust: 0.1, proteinPerKg: 1.8, hint: "Leichter Überschuss, viel Protein" },
  ZUNEHMEN: { label: "Zunehmen", adjust: 0.15, proteinPerKg: 1.6, hint: "Deutlicher Überschuss, energiedicht" },
};

export interface SportInput {
  type: string;
  minutesPerSession: number;
  sessionsPerWeek: number;
}

export interface EnergyInput {
  sex: Sex;
  age: number;
  heightCm: number;
  weightKg: number;
  bodyFatPct?: number | null;
  dailyActivity: DailyActivity;
  goal: Goal;
  sports: SportInput[];
}

export interface EnergyResult {
  bmr: number;
  bmrFormula: "Mifflin-St Jeor" | "Katch-McArdle";
  everyday: number;
  sportPerDay: number;
  tdee: number;
  target: number;
  protein: number;
  fat: number;
  carbs: number;
  fiber: number;
}

export function ageFromBirthDate(birthDate: Date, now = new Date()): number {
  let age = now.getFullYear() - birthDate.getFullYear();
  const m = now.getMonth() - birthDate.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < birthDate.getDate())) age--;
  return age;
}

export function bmrMifflin(sex: Sex, age: number, heightCm: number, weightKg: number): number {
  const base = 10 * weightKg + 6.25 * heightCm - 5 * age;
  return sex === "MAENNLICH" ? base + 5 : base - 161;
}

export function bmrKatch(weightKg: number, bodyFatPct: number): number {
  const leanMass = weightKg * (1 - bodyFatPct / 100);
  return 370 + 21.6 * leanMass;
}

/** Zusätzlicher Verbrauch durch Sport pro Tag (Netto, ohne Grundumsatz-Anteil). */
export function sportKcalPerDay(sports: SportInput[], weightKg: number): number {
  let weekly = 0;
  for (const s of sports) {
    const met = SPORTS[s.type]?.met ?? 5;
    const hours = (s.minutesPerSession * s.sessionsPerWeek) / 60;
    weekly += (met - 1) * weightKg * hours;
  }
  return weekly / 7;
}

export function calculateEnergy(input: EnergyInput): EnergyResult {
  const useKatch = input.bodyFatPct != null && input.bodyFatPct > 3 && input.bodyFatPct < 60;
  const bmr = useKatch
    ? bmrKatch(input.weightKg, input.bodyFatPct as number)
    : bmrMifflin(input.sex, input.age, input.heightCm, input.weightKg);
  const everyday = bmr * ACTIVITY_FACTORS[input.dailyActivity].factor;
  const sportPerDay = sportKcalPerDay(input.sports, input.weightKg);
  const tdee = everyday + sportPerDay;
  const goal = GOALS[input.goal];
  const target = Math.max(bmr, tdee * (1 + goal.adjust));

  const protein = input.weightKg * goal.proteinPerKg;
  const fatShare = input.goal === "ZUNEHMEN" ? 0.3 : 0.27;
  const fat = (target * fatShare) / 9;
  const carbs = Math.max(0, (target - protein * 4 - fat * 9) / 4);
  const fiber = (target / 1000) * 14;

  return {
    bmr: Math.round(bmr),
    bmrFormula: useKatch ? "Katch-McArdle" : "Mifflin-St Jeor",
    everyday: Math.round(everyday),
    sportPerDay: Math.round(sportPerDay),
    tdee: Math.round(tdee),
    target: Math.round(target),
    protein: Math.round(protein),
    fat: Math.round(fat),
    carbs: Math.round(carbs),
    fiber: Math.round(fiber),
  };
}
