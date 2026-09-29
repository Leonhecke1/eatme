import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE, verifySession } from "@/server/session";

const PUBLIC_PATHS = ["/", "/login", "/registrieren"];

export default async function proxy(req: NextRequest) {
  const path = req.nextUrl.pathname;
  const session = await verifySession(req.cookies.get(SESSION_COOKIE)?.value);
  const isPublic = PUBLIC_PATHS.includes(path);

  if (!session && !isPublic) {
    const url = new URL("/login", req.nextUrl);
    url.searchParams.set("weiter", path);
    return NextResponse.redirect(url);
  }
  if (session && (path === "/login" || path === "/registrieren")) {
    return NextResponse.redirect(new URL("/heute", req.nextUrl));
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|icon|apple-icon|manifest.webmanifest|.*\.(?:png|svg|jpg|ico|webp)$).*)"],
};
