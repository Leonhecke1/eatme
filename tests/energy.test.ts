import { describe, expect, it } from "vitest";
import { ageFromBirthDate, bmrKatch, bmrMifflin, calculateEnergy, sportKcalPerDay } from "@/lib/nutrition/energy";

describe("energy", () => {
  it("berechnet den Grundumsatz nach Mifflin-St Jeor", () => {
    // 10*80 + 6.25*180 - 5*30 + 5 = 1780
    expect(bmrMifflin("MAENNLICH", 30, 180, 80)).toBe(1780);
    // 10*60 + 6.25*165 - 5*25 - 161 = 1345.25
    expect(bmrMifflin("WEIBLICH", 25, 165, 60)).toBeCloseTo(1345.25);
  });

  it("nutzt Katch-McArdle bei Koerperfettangabe", () => {
    expect(bmrKatch(80, 15)).toBeCloseTo(370 + 21.6 * 68);
    const r = calculateEnergy({
      sex: "MAENNLICH", age: 30, heightCm: 180, weightKg: 80, bodyFatPct: 15,
      dailyActivity: "SITZEND", goal: "HALTEN", sports: [],
    });
    expect(r.bmrFormula).toBe("Katch-McArdle");
  });

  it("rechnet Sport netto pro Tag", () => {
    // Krafttraining MET 5: (5-1) * 80 kg * 3 h / 7
    expect(sportKcalPerDay([{ type: "KRAFTTRAINING", minutesPerSession: 60, sessionsPerWeek: 3 }], 80)).toBeCloseTo(
      (4 * 80 * 3) / 7,
    );
  });

  it("passt das Ziel an und verteilt Makros stimmig", () => {
    const base = {
      sex: "MAENNLICH" as const, age: 30, heightCm: 180, weightKg: 80,
      dailyActivity: "LEICHT" as const, sports: [],
    };
    const halten = calculateEnergy({ ...base, goal: "HALTEN" });
    const muskel = calculateEnergy({ ...base, goal: "MUSKELAUFBAU" });
    const ab = calculateEnergy({ ...base, goal: "ABNEHMEN" });
    expect(halten.target).toBe(Math.round(1780 * 1.375));
    expect(muskel.target).toBeGreaterThan(halten.target);
    expect(ab.target).toBeLessThan(halten.target);
    expect(ab.target).toBeGreaterThanOrEqual(ab.bmr);
    expect(muskel.protein).toBe(Math.round(80 * 1.8));
    const kcalFromMacros = muskel.protein * 4 + muskel.carbs * 4 + muskel.fat * 9;
    expect(Math.abs(kcalFromMacros - muskel.target)).toBeLessThan(15);
  });

  it("berechnet das Alter korrekt", () => {
    expect(ageFromBirthDate(new Date("2000-10-01"), new Date("2026-09-29"))).toBe(25);
    expect(ageFromBirthDate(new Date("2000-09-29"), new Date("2026-09-29"))).toBe(26);
  });
});
