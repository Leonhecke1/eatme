"use server";

import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { db } from "@/lib/db";
import { destroySession, requireUser } from "@/server/auth";

export interface AccountState {
  ok?: string;
  error?: string;
}

export async function updateNameAction(_: AccountState, formData: FormData): Promise<AccountState> {
  const user = await requireUser();
  const name = z.string().trim().min(2).max(60).safeParse(formData.get("name"));
  if (!name.success) return { error: "Der Name muss 2 bis 60 Zeichen lang sein." };
  await db.user.update({ where: { id: user.id }, data: { name: name.data } });
  revalidatePath("/", "layout");
  return { ok: "Name gespeichert." };
}

export async function changePasswordAction(_: AccountState, formData: FormData): Promise<AccountState> {
  const user = await requireUser();
  const parsed = z
    .object({ current: z.string().min(1), next: z.string().min(8).max(200) })
    .safeParse({ current: formData.get("current"), next: formData.get("next") });
  if (!parsed.success) return { error: "Das neue Passwort muss mindestens 8 Zeichen lang sein." };
  const full = await db.user.findUnique({ where: { id: user.id } });
  if (!full || !(await bcrypt.compare(parsed.data.current, full.passwordHash))) return { error: "Das aktuelle Passwort ist falsch." };
  await db.user.update({ where: { id: user.id }, data: { passwordHash: await bcrypt.hash(parsed.data.next, 12) } });
  return { ok: "Passwort geändert." };
}

export async function deleteAccountAction(_: AccountState, formData: FormData): Promise<AccountState> {
  const user = await requireUser();
  const full = await db.user.findUnique({ where: { id: user.id } });
  const password = String(formData.get("password") ?? "");
  if (!full || !(await bcrypt.compare(password, full.passwordHash))) return { error: "Das Passwort ist falsch." };
  if (formData.get("confirm") !== "LOESCHEN") return { error: "Bitte tippe LOESCHEN zur Bestätigung." };
  await db.user.delete({ where: { id: user.id } });
  await destroySession();
  redirect("/");
}
