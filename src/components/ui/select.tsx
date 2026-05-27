"use client";

import * as React from "react";
import { ListBox, ListBoxItem, Select as HeroSelect } from "@heroui/react";

import { cn } from "@/lib/utils";

type SelectRootProps = Omit<React.ComponentProps<"div">, "children" | "defaultValue" | "onChange" | "value"> & {
  children: React.ReactNode;
  defaultValue?: string;
  disabled?: boolean;
  name?: string;
  onValueChange?: (value: string) => void;
  required?: boolean;
  value?: string;
};

type SelectTriggerProps = React.ComponentProps<"button">;
type SelectValueProps = React.ComponentProps<"span"> & { placeholder?: string };
type SelectContentProps = React.ComponentProps<"div">;
type SelectItemProps = React.ComponentProps<"div"> & { value: string };

const SelectGroup = ({ children }: { children?: React.ReactNode }) => <>{children}</>;

const SelectTrigger: React.FC<SelectTriggerProps> = () => null;
SelectTrigger.displayName = "SelectTrigger";

const SelectValue: React.FC<SelectValueProps> = () => null;
SelectValue.displayName = "SelectValue";

const SelectContent: React.FC<SelectContentProps> = () => null;
SelectContent.displayName = "SelectContent";

const SelectLabel: React.FC<React.ComponentProps<"div">> = () => null;
SelectLabel.displayName = "SelectLabel";

const SelectItem: React.FC<SelectItemProps> = () => null;
SelectItem.displayName = "SelectItem";

const SelectSeparator: React.FC<React.ComponentProps<"hr">> = () => null;
SelectSeparator.displayName = "SelectSeparator";

const SelectScrollUpButton: React.FC<React.ComponentProps<"div">> = () => null;
const SelectScrollDownButton: React.FC<React.ComponentProps<"div">> = () => null;

function isComponent<P>(node: React.ReactNode, component: React.ComponentType<P>) {
  return React.isValidElement(node) && node.type === component;
}

function renderSelectItems(nodes: React.ReactNode): React.ReactNode {
  return React.Children.map(nodes, (node, index) => {
    if (!React.isValidElement(node)) return null;
    const element = node as React.ReactElement<Record<string, unknown>>;

    if (element.type === SelectGroup) {
      return (
        <React.Fragment key={element.key ?? index}>
          {renderSelectItems(element.props.children as React.ReactNode)}
        </React.Fragment>
      );
    }

    if (element.type === SelectLabel) {
      return (
        <div
          key={element.key ?? `label-${index}`}
          className={cn("px-3 py-1 text-xs font-medium text-zinc-500", element.props.className as string)}
        >
          {element.props.children as React.ReactNode}
        </div>
      );
    }

    if (element.type === SelectSeparator) {
      return (
        <hr
          key={element.key ?? `separator-${index}`}
          className={cn("my-1 border-zinc-200", element.props.className as string)}
        />
      );
    }

    if (element.type === SelectItem) {
      const itemProps = element.props as Record<string, unknown>;
      const value = String(itemProps.value ?? "");
      return (
        <ListBoxItem.Root
          key={element.key ?? value}
          className={itemProps.className as string | undefined}
          id={value}
          {...(itemProps as Record<string, unknown>)}
        >
          {itemProps.children as React.ReactNode}
        </ListBoxItem.Root>
      );
    }

    return element;
  });
}

function Select({
  children,
  className,
  defaultValue,
  disabled,
  name,
  onValueChange,
  required,
  value,
  ...props
}: SelectRootProps) {
  const childArray = React.Children.toArray(children);

  const triggerNode = childArray.find((child) => isComponent(child, SelectTrigger)) as React.ReactElement<SelectTriggerProps> | undefined;
  const contentNode = childArray.find((child) => isComponent(child, SelectContent)) as React.ReactElement<SelectContentProps> | undefined;

  const triggerChildren = React.Children.toArray(triggerNode?.props.children);
  const valueNode = triggerChildren.find((child) => isComponent(child, SelectValue)) as React.ReactElement<SelectValueProps> | undefined;
  const extraTriggerChildren = triggerChildren.filter((child) => !isComponent(child, SelectValue));
  const hasAriaLabel = Boolean(props["aria-label"] || props["aria-labelledby"]);
  const fallbackAriaLabel =
    valueNode?.props.placeholder?.trim() || name?.trim() || "Select option";

  return (
    <HeroSelect.Root
      className={cn(className)}
      defaultSelectedKey={defaultValue}
      isDisabled={disabled}
      isRequired={required}
      name={name}
      onSelectionChange={(key) => onValueChange?.(key == null ? "" : String(key))}
      placeholder={valueNode?.props.placeholder}
      selectedKey={value == null ? null : value}
      variant="primary"
      {...(hasAriaLabel ? {} : { "aria-label": fallbackAriaLabel })}
      {...(props as React.ComponentProps<typeof HeroSelect.Root>)}
    >
      <HeroSelect.Trigger className={cn("w-full", triggerNode?.props.className)}>
        <HeroSelect.Value className={valueNode?.props.className} />
        {extraTriggerChildren}
      </HeroSelect.Trigger>
      <HeroSelect.Indicator />
      <HeroSelect.Popover className={contentNode?.props.className}>
        <ListBox.Root>{renderSelectItems(contentNode?.props.children)}</ListBox.Root>
      </HeroSelect.Popover>
    </HeroSelect.Root>
  );
}

export {
  Select,
  SelectGroup,
  SelectValue,
  SelectTrigger,
  SelectContent,
  SelectLabel,
  SelectItem,
  SelectSeparator,
  SelectScrollUpButton,
  SelectScrollDownButton,
};
