import { SignJWT, jwtVerify } from "jose";

export const SESSION_COOKIE = "eatme_session";
export const SESSION_MAX_AGE = 60 * 60 * 24 * 30;

export interface SessionPayload {
  userId: string;
  role: "USER" | "ADMIN";
}

function secretKey() {
  const secret = process.env.AUTH_SECRET;
  if (!secret || secret.length < 32) throw new Error("AUTH_SECRET fehlt oder ist kürzer als 32 Zeichen.");
  return new TextEncoder().encode(secret);
}

export async function signSession(payload: SessionPayload): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_MAX_AGE}s`)
    .sign(secretKey());
}

export async function verifySession(token: string | undefined): Promise<SessionPayload | null> {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secretKey(), { algorithms: ["HS256"] });
    if (typeof payload.userId !== "string") return null;
    return { userId: payload.userId, role: payload.role === "ADMIN" ? "ADMIN" : "USER" };
  } catch {
    return null;
  }
}
