"use client";

import * as React from "react";
import { Switch as HeroSwitch } from "@heroui/react";

import { cn } from "@/lib/utils";

type HeroSwitchProps = React.ComponentProps<typeof HeroSwitch.Root>;

type SwitchProps = Omit<HeroSwitchProps, "defaultSelected" | "isDisabled" | "isSelected" | "onChange"> & {
  checked?: boolean;
  defaultChecked?: boolean;
  disabled?: boolean;
  onCheckedChange?: (checked: boolean) => void;
};

const Switch = React.forwardRef<HTMLLabelElement, SwitchProps>(
  ({ checked, className, defaultChecked, disabled, onCheckedChange, ...props }, ref) => (
    <HeroSwitch.Root
      ref={ref}
      className={cn("inline-flex", className)}
      defaultSelected={defaultChecked}
      isDisabled={disabled}
      isSelected={checked}
      onChange={(isSelected) => onCheckedChange?.(Boolean(isSelected))}
      size="md"
      {...props}
    />
  ),
);
Switch.displayName = "Switch";

export { Switch };
