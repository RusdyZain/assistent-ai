import { redirect } from "next/navigation";

import { DashboardSidebar } from "@/components/dashboard/sidebar";
import { getSession } from "@/lib/auth";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();

  if (!session?.businessId) {
    redirect("/login");
  }

  return (
    <div className="min-h-screen bg-[var(--surface-soft)] text-zinc-900 md:flex">
      <DashboardSidebar />
      <main className="w-full p-4 md:p-6 lg:p-7">{children}</main>
    </div>
  );
}
