"use server";

import bcrypt from "bcryptjs";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";
import { db } from "@/lib/db";
import { createSession, destroySession } from "@/server/auth";
import { checkRateLimit } from "@/server/rate-limit";

export interface FormState {
  error?: string;
  fieldErrors?: Record<string, string>;
}

const registerSchema = z.object({
  name: z.string().trim().min(2, "Bitte gib mindestens 2 Zeichen ein.").max(60),
  email: z.string().trim().toLowerCase().email("Bitte gib eine gültige E-Mail-Adresse ein."),
  password: z.string().min(8, "Das Passwort muss mindestens 8 Zeichen lang sein.").max(200),
});

const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email("Bitte gib eine gültige E-Mail-Adresse ein."),
  password: z.string().min(1, "Bitte gib dein Passwort ein."),
});

function fieldErrors(error: z.ZodError): Record<string, string> {
  const out: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = String(issue.path[0] ?? "form");
    if (!out[key]) out[key] = issue.message;
  }
  return out;
}

async function clientIp() {
  const h = await headers();
  return h.get("x-forwarded-for")?.split(",")[0]?.trim() || h.get("x-real-ip") || "unbekannt";
}

function safeRedirectTarget(value: FormDataEntryValue | null): string {
  const s = typeof value === "string" ? value : "";
  return s.startsWith("/") && !s.startsWith("//") ? s : "/heute";
}

export async function registerAction(_: FormState, formData: FormData): Promise<FormState> {
  const parsed = registerSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { fieldErrors: fieldErrors(parsed.error) };
  const { name, email, password } = parsed.data;

  if (!(await checkRateLimit(`register:${await clientIp()}`, 10, 60 * 60 * 1000))) {
    return { error: "Zu viele Registrierungen. Bitte versuche es später erneut." };
  }

  const exists = await db.user.findUnique({ where: { email }, select: { id: true } });
  if (exists) return { fieldErrors: { email: "Diese E-Mail-Adresse ist bereits registriert." } };

  const user = await db.user.create({
    data: { name, email, passwordHash: await bcrypt.hash(password, 12) },
  });
  await createSession({ userId: user.id, role: user.role });
  redirect("/onboarding");
}

export async function loginAction(_: FormState, formData: FormData): Promise<FormState> {
  const parsed = loginSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { fieldErrors: fieldErrors(parsed.error) };
  const { email, password } = parsed.data;

  const ip = await clientIp();
  const allowed =
    (await checkRateLimit(`login:${email}`, 8, 15 * 60 * 1000)) &&
    (await checkRateLimit(`login-ip:${ip}`, 30, 15 * 60 * 1000));
  if (!allowed) return { error: "Zu viele Anmeldeversuche. Bitte warte 15 Minuten." };

  const user = await db.user.findUnique({ where: { email } });
  const ok = user ? await bcrypt.compare(password, user.passwordHash) : await bcrypt.compare(password, DUMMY_HASH);
  if (!user || !ok) return { error: "E-Mail oder Passwort ist falsch." };

  await createSession({ userId: user.id, role: user.role });
  redirect(safeRedirectTarget(formData.get("weiter")));
}

export async function logoutAction() {
  await destroySession();
  redirect("/login");
}

// Verhindert Timing-Unterschiede zwischen existierenden und unbekannten E-Mails.
const DUMMY_HASH = "$2b$12$C6UzMDM.H6dfI/f/IKcEeO5QWVxqj2JpT1Q2zxgO9mQfN2Tn7b3q2";
