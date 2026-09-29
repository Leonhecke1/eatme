import { SearchX } from "lucide-react";
import { ButtonLink } from "@/components/ui/button";
import { Logo } from "@/components/logo";

export default function NotFound() {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-6 bg-gradient-to-b from-mint-100 to-canvas px-4 text-center">
      <Logo />
      <div className="rounded-[2rem] bg-surface p-8 shadow-lift">
        <SearchX className="mx-auto mb-3 h-10 w-10 text-leaf-600" aria-hidden />
        <h1 className="text-2xl font-extrabold">Seite nicht gefunden</h1>
        <p className="mt-1 text-muted">Diese Seite gibt es leider nicht (mehr).</p>
        <ButtonLink href="/heute" className="mt-5">
          Zur Startseite
        </ButtonLink>
      </div>
    </div>
  );
}
