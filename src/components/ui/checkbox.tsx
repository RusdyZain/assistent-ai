"use client";

import * as React from "react";
import { Checkbox as HeroCheckbox } from "@heroui/react";

import { cn } from "@/lib/utils";

type HeroCheckboxProps = React.ComponentProps<typeof HeroCheckbox.Root>;

interface CheckboxProps
  extends Omit<HeroCheckboxProps, "defaultSelected" | "isDisabled" | "isSelected" | "onChange"> {
  checked?: boolean;
  defaultChecked?: boolean;
  disabled?: boolean;
  onCheckedChange?: (checked: boolean) => void;
}

const Checkbox = React.forwardRef<HTMLLabelElement, CheckboxProps>(
  ({ checked, className, defaultChecked, disabled, onCheckedChange, ...props }, ref) => {
    const safeProps =
      props["aria-label"] || props["aria-labelledby"]
        ? props
        : { ...props, "aria-label": props.name?.trim() || "Checkbox" };

    return (
      <HeroCheckbox.Root
        ref={ref}
        className={cn("inline-flex", className)}
        defaultSelected={defaultChecked}
        isDisabled={disabled}
        isSelected={checked}
        onChange={(isSelected) => onCheckedChange?.(Boolean(isSelected))}
        {...safeProps}
      />
    );
  },
);
Checkbox.displayName = "Checkbox";

export { Checkbox };
