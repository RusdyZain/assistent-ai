"use client";

import { Spinner as HeroSpinner } from "@heroui/react";

import { cn } from "@/lib/utils";

export function Spinner({ className }: { className?: string }) {
  return <HeroSpinner.Root className={cn("h-4 w-4", className)} />;
}
