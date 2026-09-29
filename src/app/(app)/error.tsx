"use client";

import { TriangleAlert } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function AppError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="mx-auto max-w-md rounded-3xl bg-surface p-8 text-center shadow-soft">
      <TriangleAlert className="mx-auto mb-3 h-10 w-10 text-peach-700" aria-hidden />
      <h1 className="text-xl font-extrabold">Da ist etwas schiefgelaufen</h1>
      <p className="mt-1 text-sm text-muted">Bitte versuche es noch einmal. Wenn der Fehler bleibt, lade die Seite neu.</p>
      <Button className="mt-5" onClick={reset}>
        Erneut versuchen
      </Button>
    </div>
  );
}
