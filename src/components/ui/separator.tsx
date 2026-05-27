"use client";

import * as React from "react";
import { Separator as HeroSeparator } from "@heroui/react";

import { cn } from "@/lib/utils";

const Separator = React.forwardRef<
  HTMLHRElement,
  React.ComponentPropsWithoutRef<"hr"> & {
    decorative?: boolean;
    orientation?: "horizontal" | "vertical";
  }
>(({ className, orientation = "horizontal", ...props }, ref) => (
  <HeroSeparator.Root
    className={cn(className)}
    orientation={orientation}
    ref={ref}
    {...(props as React.ComponentProps<typeof HeroSeparator.Root>)}
  />
));
Separator.displayName = "Separator";

export { Separator };
