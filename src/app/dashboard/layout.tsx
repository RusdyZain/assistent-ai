import { redirect } from "next/navigation";
import Link from "next/link";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { SetupGuard } from "@/components/dashboard/setup-guard";
import { DashboardSidebar } from "@/components/dashboard/sidebar";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();

  if (!session?.businessId) {
    redirect("/login");
  }

  const business = await prisma.business.findUnique({
    where: {
      id: session.businessId,
    },
    select: {
      setupCompleted: true,
      setupStep: true,
    },
  });

  if (!business) {
    redirect("/login");
  }

  return (
    <div className="min-h-screen bg-[var(--surface-soft)] text-zinc-900 md:flex">
      <DashboardSidebar />
      <main className="w-full p-4 md:p-6 lg:p-7">
        <SetupGuard setupCompleted={business.setupCompleted} />
        {!business.setupCompleted ? (
          <Alert variant="warning" className="mb-4">
            <AlertTitle>Setup bisnis belum selesai</AlertTitle>
            <AlertDescription>
              Lengkapi langkah setup sebelum memakai AI di Inbox.
              {" "}
              <Link href="/dashboard/setup" className="font-semibold underline">
                Buka Setup
              </Link>
              {" "}
              (langkah {business.setupStep}/7).
            </AlertDescription>
          </Alert>
        ) : null}
        {children}
      </main>
    </div>
  );
}
