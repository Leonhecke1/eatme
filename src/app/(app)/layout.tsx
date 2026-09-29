import { BottomNav, MobileTopBar, Sidebar } from "@/components/app-nav";
import { requireProfileUser } from "@/server/auth";

export default async function AppLayout({ children }: LayoutProps<"/">) {
  const user = await requireProfileUser();
  const isAdmin = user.role === "ADMIN";
  return (
    <div className="flex min-h-dvh">
      <Sidebar name={user.name} isAdmin={isAdmin} />
      <div className="flex min-w-0 flex-1 flex-col">
        <MobileTopBar isAdmin={isAdmin} />
        <main className="mx-auto w-full max-w-7xl flex-1 px-4 pb-28 pt-5 sm:px-6 md:pb-12 md:pt-8 lg:px-10">
          {children}
        </main>
      </div>
      <BottomNav />
    </div>
  );
}
