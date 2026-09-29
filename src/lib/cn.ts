import clsx, { type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/** Klassen zusammenfuehren; spaetere Tailwind-Klassen ueberschreiben widerspruechliche fruehere (z. B. w-full vs. w-24). */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
