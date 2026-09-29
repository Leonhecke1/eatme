import "server-only";
import { db } from "@/lib/db";

/** DB-basiertes Rate-Limit, funktioniert ueber mehrere App-Instanzen hinweg. */
export async function checkRateLimit(key: string, limit: number, windowMs: number): Promise<boolean> {
  const since = new Date(Date.now() - windowMs);
  const count = await db.loginAttempt.count({ where: { key, createdAt: { gte: since } } });
  if (count >= limit) return false;
  await db.loginAttempt.create({ data: { key } });
  if (Math.random() < 0.02) {
    await db.loginAttempt.deleteMany({ where: { createdAt: { lt: new Date(Date.now() - 24 * 3600 * 1000) } } });
  }
  return true;
}
