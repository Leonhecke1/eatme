import "server-only";
import { cache } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { SESSION_COOKIE, SESSION_MAX_AGE, signSession, verifySession, type SessionPayload } from "./session";

export async function createSession(payload: SessionPayload) {
  const token = await signSession(payload);
  (await cookies()).set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production" && process.env.COOKIE_SECURE !== "false",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_MAX_AGE,
  });
}

export async function destroySession() {
  (await cookies()).delete(SESSION_COOKIE);
}

export const getSession = cache(async () => {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  return verifySession(token);
});

export const getCurrentUser = cache(async () => {
  const session = await getSession();
  if (!session) return null;
  return db.user.findUnique({
    where: { id: session.userId },
    select: { id: true, email: true, name: true, role: true, profile: { select: { userId: true } } },
  });
});

export async function requireUser() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  return user;
}

/** Nutzer mit abgeschlossenem Onboarding. */
export async function requireProfileUser() {
  const user = await requireUser();
  if (!user.profile) redirect("/onboarding");
  return user;
}

export async function requireAdmin() {
  const user = await requireUser();
  if (user.role !== "ADMIN") redirect("/heute");
  return user;
}
