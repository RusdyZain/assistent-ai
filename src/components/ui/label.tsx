"use client";

import * as React from "react";
import { Label as HeroLabel } from "@heroui/react";

import { cn } from "@/lib/utils";

const Label = React.forwardRef<HTMLLabelElement, React.ComponentPropsWithoutRef<"label">>(
  ({ className, ...props }, ref) => (
    <HeroLabel.Root
      ref={ref}
      className={cn("text-sm font-medium leading-none", className)}
      {...(props as React.ComponentProps<typeof HeroLabel.Root>)}
    />
  ),
);
Label.displayName = "Label";

export { Label };
