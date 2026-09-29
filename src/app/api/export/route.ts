import { cookies } from "next/headers";
import { db } from "@/lib/db";
import { SESSION_COOKIE, verifySession } from "@/server/session";

export async function GET() {
  const session = await verifySession((await cookies()).get(SESSION_COOKIE)?.value);
  if (!session) return new Response("Nicht angemeldet", { status: 401 });

  const data = await db.user.findUnique({
    where: { id: session.userId },
    select: {
      email: true,
      name: true,
      createdAt: true,
      profile: true,
      sports: true,
      weights: true,
      favorites: { select: { ingredient: { select: { name: true } } } },
      prices: { select: { pricePer100gCents: true, ingredient: { select: { name: true } } } },
      savedRecipes: { include: { recipe: { select: { title: true } }, ingredients: { include: { ingredient: { select: { name: true } } } } } },
      mealPlans: { include: { entries: { include: { recipe: { select: { title: true } } } } } },
      foodLog: true,
    },
  });
  if (!data) return new Response("Nicht gefunden", { status: 404 });

  return new Response(JSON.stringify(data, null, 2), {
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Content-Disposition": `attachment; filename="eatme-export.json"`,
      "Cache-Control": "no-store",
    },
  });
}
