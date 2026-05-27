"use client";

import * as React from "react";
import { ScrollShadow } from "@heroui/react";

import { cn } from "@/lib/utils";

const ScrollArea = React.forwardRef<HTMLDivElement, React.ComponentProps<"div">>(
  ({ children, className, ...props }, ref) => (
    <ScrollShadow.Root
      className={cn("h-full w-full", className)}
      ref={ref}
      {...(props as React.ComponentProps<typeof ScrollShadow.Root>)}
    >
      {children}
    </ScrollShadow.Root>
  ),
);
ScrollArea.displayName = "ScrollArea";

type ScrollBarProps = React.ComponentProps<"div"> & {
  orientation?: "horizontal" | "vertical";
};

const ScrollBar = React.forwardRef<HTMLDivElement, ScrollBarProps>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("hidden", className)} {...props} />
));
ScrollBar.displayName = "ScrollBar";

export { ScrollArea, ScrollBar };
