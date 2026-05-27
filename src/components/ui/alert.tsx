"use client";

import * as React from "react";
import { Alert as HeroAlert } from "@heroui/react";

import { cn } from "@/lib/utils";

type AlertVariant = "default" | "warning" | "destructive";

const statusByVariant: Record<AlertVariant, "default" | "warning" | "danger"> = {
  default: "default",
  warning: "warning",
  destructive: "danger",
};

function Alert({
  className,
  variant = "default",
  ...props
}: React.ComponentProps<"div"> & {
  variant?: AlertVariant;
}) {
  return (
    <HeroAlert.Root
      status={statusByVariant[variant]}
      className={cn("rounded-2xl", className)}
      {...(props as React.ComponentProps<typeof HeroAlert.Root>)}
    />
  );
}

function AlertTitle({ className, ...props }: React.ComponentProps<"p">) {
  return (
    <HeroAlert.Title
      className={cn("font-medium leading-none", className)}
      {...(props as React.ComponentProps<typeof HeroAlert.Title>)}
    />
  );
}

function AlertDescription({ className, ...props }: React.ComponentProps<"span">) {
  return (
    <HeroAlert.Description
      className={cn("text-sm [&_p]:leading-relaxed", className)}
      {...(props as React.ComponentProps<typeof HeroAlert.Description>)}
    />
  );
}

export { Alert, AlertTitle, AlertDescription };
