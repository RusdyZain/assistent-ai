"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";

const ALLOWED_PATHS_WHEN_INCOMPLETE = new Set([
  "/dashboard/setup",
  "/dashboard/products",
  "/dashboard/templates",
  "/dashboard/knowledge-base",
  "/dashboard/settings",
]);

export function SetupGuard({ setupCompleted }: { setupCompleted: boolean }) {
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    if (setupCompleted) return;
    if (ALLOWED_PATHS_WHEN_INCOMPLETE.has(pathname)) return;
    if (!pathname.startsWith("/dashboard")) return;

    router.replace("/dashboard/setup");
  }, [pathname, router, setupCompleted]);

  return null;
}
