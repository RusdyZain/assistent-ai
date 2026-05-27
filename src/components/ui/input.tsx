"use client";

import * as React from "react";
import { Input as HeroInput } from "@heroui/react";

import { cn } from "@/lib/utils";

type InputProps = React.ComponentProps<"input">;

function withInputA11yFallback(props: InputProps): InputProps {
  if (props["aria-label"] || props["aria-labelledby"]) {
    return props;
  }

  return {
    ...props,
    "aria-label": props.placeholder?.trim() || props.name?.trim() || props.id?.trim() || "Input field",
  };
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, ...props }, ref) => {
    const safeProps = withInputA11yFallback(props);

    return (
      <HeroInput
        className={cn("w-full text-sm", className)}
        ref={ref as React.Ref<HTMLInputElement>}
        variant="primary"
        {...(safeProps as React.ComponentProps<typeof HeroInput>)}
      />
    );
  },
);
Input.displayName = "Input";

export { Input };
