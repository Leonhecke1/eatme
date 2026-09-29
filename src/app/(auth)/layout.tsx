import Link from "next/link";
import { Logo } from "@/components/logo";

export default function AuthLayout({ children }: LayoutProps<"/">) {
  return (
    <div className="flex min-h-dvh flex-col items-center bg-gradient-to-b from-mint-100 to-canvas px-4 py-8">
      <Link href="/" className="mb-8">
        <Logo />
      </Link>
      <div className="w-full max-w-md rounded-[2rem] bg-surface p-6 shadow-lift sm:p-8">{children}</div>
    </div>
  );
}
