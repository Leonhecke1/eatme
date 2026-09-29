const TZ = "Europe/Berlin";

/** Heutiges Datum als YYYY-MM-DD in deutscher Zeitzone. */
export function todayISO(now = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: TZ, year: "numeric", month: "2-digit", day: "2-digit" }).format(now);
}

export function isISODate(value: string | undefined | null): value is string {
  return !!value && /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(Date.parse(value));
}

/** YYYY-MM-DD -> Date (UTC Mitternacht), passend fuer @db.Date. */
export function dateFromISO(iso: string): Date {
  return new Date(`${iso}T00:00:00.000Z`);
}

export function isoFromDate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

export function addDays(iso: string, days: number): string {
  const d = dateFromISO(iso);
  d.setUTCDate(d.getUTCDate() + days);
  return isoFromDate(d);
}

/** Montag der Woche, in der das Datum liegt. */
export function weekStartISO(iso: string): string {
  const d = dateFromISO(iso);
  const dow = (d.getUTCDay() + 6) % 7;
  return addDays(iso, -dow);
}

export function dayIndexInWeek(iso: string): number {
  return (dateFromISO(iso).getUTCDay() + 6) % 7;
}

export const WEEKDAYS = ["Montag", "Dienstag", "Mittwoch", "Donnerstag", "Freitag", "Samstag", "Sonntag"];
export const WEEKDAYS_SHORT = ["Mo", "Di", "Mi", "Do", "Fr", "Sa", "So"];

export function formatDateLong(iso: string): string {
  return new Intl.DateTimeFormat("de-DE", { weekday: "long", day: "numeric", month: "long", timeZone: "UTC" }).format(
    dateFromISO(iso),
  );
}

export function formatDateShort(iso: string): string {
  return new Intl.DateTimeFormat("de-DE", { day: "2-digit", month: "2-digit", timeZone: "UTC" }).format(dateFromISO(iso));
}

export function berlinHour(now = new Date()): number {
  return Number(new Intl.DateTimeFormat("de-DE", { hour: "numeric", hour12: false, timeZone: TZ }).format(now));
}

/** Passende Mahlzeit zur aktuellen Uhrzeit (fuer Formular-Voreinstellungen). */
export function mealTypeForNow(now = new Date()): "FRUEHSTUECK" | "MITTAG" | "ABEND" | "SNACK" {
  const h = berlinHour(now);
  if (h < 11) return "FRUEHSTUECK";
  if (h < 15) return "MITTAG";
  if (h < 17) return "SNACK";
  return "ABEND";
}
