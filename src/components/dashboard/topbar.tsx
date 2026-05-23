import { Bell } from "lucide-react";

import { Card } from "@/components/ui/card";

export function DashboardTopbar({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <Card className="mb-5 rounded-2xl border-zinc-200 bg-white px-4 py-3 md:px-5">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-lg font-semibold tracking-tight text-zinc-900 md:text-xl">{title}</h1>
          <p className="text-sm text-zinc-600">{description}</p>
        </div>
        <div className="hidden items-center gap-2 rounded-full border border-zinc-200 bg-zinc-50 px-3 py-1 text-xs text-zinc-500 md:flex">
          <Bell className="h-3.5 w-3.5" />
          Pantau follow-up harian
        </div>
      </div>
    </Card>
  );
}
