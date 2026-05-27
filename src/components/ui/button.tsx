"use client";

import * as React from "react";
import { Button as HeroButton, buttonVariants as heroButtonVariants } from "@heroui/react";
import { Slot } from "@radix-ui/react-slot";

import { cn } from "@/lib/utils";

type LegacyVariant = "default" | "destructive" | "outline" | "secondary" | "ghost";
type LegacySize = "default" | "sm" | "lg" | "icon";

const variantMap: Record<LegacyVariant, "primary" | "danger" | "outline" | "secondary" | "ghost"> = {
  default: "primary",
  destructive: "danger",
  outline: "outline",
  secondary: "secondary",
  ghost: "ghost",
};

const sizeMap: Record<LegacySize, "sm" | "md" | "lg"> = {
  default: "md",
  sm: "sm",
  lg: "lg",
  icon: "sm",
};

const buttonVariants = ({
  variant = "default",
  size = "default",
  className,
}: {
  variant?: LegacyVariant;
  size?: LegacySize;
  className?: string;
}) =>
  cn(
    heroButtonVariants({
      isIconOnly: size === "icon",
      size: sizeMap[size],
      variant: variantMap[variant],
    }),
    size === "icon" && "h-10 w-10 min-w-10 p-0",
    className,
  );

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  asChild?: boolean;
  size?: LegacySize;
  variant?: LegacyVariant;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ asChild = false, className, size = "default", variant = "default", disabled, ...props }, ref) => {
    if (asChild) {
      const Comp = Slot;
      return <Comp className={buttonVariants({ variant, size, className })} ref={ref} {...props} />;
    }

    return (
      <HeroButton
        className={cn(size === "icon" && "h-10 w-10 min-w-10 p-0", className)}
        isDisabled={disabled}
        isIconOnly={size === "icon"}
        size={sizeMap[size]}
        variant={variantMap[variant]}
        {...(props as React.ComponentProps<typeof HeroButton>)}
      />
    );
  },
);
Button.displayName = "Button";

export { Button, buttonVariants };
