"use client";

import * as React from "react";
import { Input as HeroInput } from "@heroui/react";

import { cn } from "@/lib/utils";

const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>(
  ({ className, ...props }, ref) => {
    return (
      <HeroInput
        className={cn("w-full text-sm", className)}
        ref={ref as React.Ref<HTMLInputElement>}
        variant="primary"
        {...(props as React.ComponentProps<typeof HeroInput>)}
      />
    );
  },
);
Input.displayName = "Input";

export { Input };
