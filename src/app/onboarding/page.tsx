import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Logo } from "@/components/logo";
import { ProfileEditor } from "@/components/profile-editor";
import { requireUser } from "@/server/auth";
import { loadProfileEditorData } from "@/server/profile-data";

export const metadata: Metadata = { title: "Einrichtung" };

export default async function OnboardingPage() {
  const user = await requireUser();
  if (user.profile) redirect("/heute");
  const data = await loadProfileEditorData(user.id);
  return (
    <div className="min-h-dvh bg-gradient-to-b from-mint-100 to-canvas px-4 py-6 sm:py-10">
      <div className="mx-auto mb-6 flex max-w-2xl items-center justify-between">
        <Logo />
        <span className="text-sm font-bold text-muted">Hallo {user.name}</span>
      </div>
      <ProfileEditor mode="onboarding" {...data} />
    </div>
  );
}
