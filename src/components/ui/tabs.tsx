"use client";

import * as React from "react";
import { Tabs as HeroTabs } from "@heroui/react";

import { cn } from "@/lib/utils";

type TabsProps = Omit<React.ComponentProps<"div">, "defaultValue" | "onChange" | "value"> & {
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  value?: string;
};

const Tabs = ({
  children,
  defaultValue,
  onValueChange,
  value,
  ...props
}: TabsProps) => {
  return (
    <HeroTabs.Root
      defaultSelectedKey={defaultValue}
      onSelectionChange={(key) => onValueChange?.(key == null ? "" : String(key))}
      selectedKey={value == null ? undefined : value}
      variant="primary"
      {...(props as React.ComponentProps<typeof HeroTabs.Root>)}
    >
      {children}
    </HeroTabs.Root>
  );
};

const TabsList = React.forwardRef<HTMLDivElement, React.ComponentProps<"div">>(({ className, ...props }, ref) => (
  <HeroTabs.List
    className={cn(className)}
    ref={ref}
    {...(props as React.ComponentProps<typeof HeroTabs.List>)}
  />
));
TabsList.displayName = "TabsList";

type TabsTriggerProps = React.ComponentProps<"div"> & { value: string };

const TabsTrigger = React.forwardRef<HTMLDivElement, TabsTriggerProps>(
  ({ className, value, ...props }, ref) => (
    <HeroTabs.Tab
      className={cn(className)}
      id={value}
      ref={ref}
      {...(props as React.ComponentProps<typeof HeroTabs.Tab>)}
    />
  ),
);
TabsTrigger.displayName = "TabsTrigger";

type TabsContentProps = React.ComponentProps<"div"> & { value: string };

const TabsContent = React.forwardRef<HTMLDivElement, TabsContentProps>(
  ({ className, value, ...props }, ref) => (
    <HeroTabs.Panel
      className={cn("mt-2", className)}
      id={value}
      ref={ref}
      {...(props as React.ComponentProps<typeof HeroTabs.Panel>)}
    />
  ),
);
TabsContent.displayName = "TabsContent";

export { Tabs, TabsList, TabsTrigger, TabsContent };
