"use client";

import * as React from "react";
import { Badge as HeroBadge } from "@heroui/react";

import { cn } from "@/lib/utils";

type BadgeVariant = "default" | "secondary" | "outline";

const badgePreset: Record<
  BadgeVariant,
  {
    color: "default" | "success";
    variant: "primary" | "secondary" | "soft";
  }
> = {
  default: { color: "success", variant: "primary" },
  secondary: { color: "default", variant: "secondary" },
  outline: { color: "default", variant: "soft" },
};

const badgeClassByVariant: Record<BadgeVariant, string> = {
  default: "",
  secondary: "",
  outline: "border",
};

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
}

function badgeVariants({ variant = "default" }: { variant?: BadgeVariant }) {
  return badgeClassByVariant[variant];
}

function Badge({ className, variant = "default", ...props }: BadgeProps) {
  const preset = badgePreset[variant];

  return (
    <HeroBadge.Root
      color={preset.color}
      variant={preset.variant}
      className={cn(badgeVariants({ variant }), className)}
      {...(props as React.ComponentProps<typeof HeroBadge.Root>)}
    />
  );
}

export { Badge, badgeVariants };
