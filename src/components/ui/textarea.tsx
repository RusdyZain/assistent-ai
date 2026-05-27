"use client";

import * as React from "react";
import { TextArea as HeroTextArea } from "@heroui/react";

import { cn } from "@/lib/utils";

type TextareaProps = React.ComponentProps<"textarea">;

function withTextareaA11yFallback(props: TextareaProps): TextareaProps {
  if (props["aria-label"] || props["aria-labelledby"]) {
    return props;
  }

  return {
    ...props,
    "aria-label": props.placeholder?.trim() || props.name?.trim() || props.id?.trim() || "Text area",
  };
}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, ...props }, ref) => {
    const safeProps = withTextareaA11yFallback(props);

    return (
      <HeroTextArea
        className={cn("min-h-[80px] text-sm", className)}
        ref={ref as React.Ref<HTMLTextAreaElement>}
        variant="primary"
        {...(safeProps as React.ComponentProps<typeof HeroTextArea>)}
      />
    );
  },
);
Textarea.displayName = "Textarea";

export { Textarea };
