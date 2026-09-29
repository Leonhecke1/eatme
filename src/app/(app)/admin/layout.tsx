import { AdminTabs } from "@/components/admin/admin-tabs";
import { requireAdmin } from "@/server/auth";

export default async function AdminLayout({ children }: LayoutProps<"/admin">) {
  await requireAdmin();
  return (
    <>
      <h1 className="mb-4 text-2xl font-extrabold tracking-tight sm:text-3xl">Verwaltung</h1>
      <AdminTabs />
      <div className="mt-5">{children}</div>
    </>
  );
}
