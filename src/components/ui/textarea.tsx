"use client";

import * as React from "react";
import { TextArea as HeroTextArea } from "@heroui/react";

import { cn } from "@/lib/utils";

const Textarea = React.forwardRef<HTMLTextAreaElement, React.ComponentProps<"textarea">>(
  ({ className, ...props }, ref) => {
    return (
      <HeroTextArea
        className={cn("min-h-[80px] text-sm", className)}
        ref={ref as React.Ref<HTMLTextAreaElement>}
        variant="primary"
        {...(props as React.ComponentProps<typeof HeroTextArea>)}
      />
    );
  },
);
Textarea.displayName = "Textarea";

export { Textarea };
