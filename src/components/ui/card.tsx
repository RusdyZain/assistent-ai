"use client";

import * as React from "react";
import { Card as HeroCard } from "@heroui/react";

import { cn } from "@/lib/utils";

function Card({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <HeroCard.Root
      className={cn("rounded-2xl shadow-[0_22px_45px_-36px_rgba(15,23,42,0.42)]", className)}
      variant="default"
      {...(props as React.ComponentProps<typeof HeroCard.Root>)}
    />
  );
}

function CardHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <HeroCard.Header
      className={cn("space-y-1.5 p-6", className)}
      {...(props as React.ComponentProps<typeof HeroCard.Header>)}
    />
  );
}

function CardTitle({ className, ...props }: React.ComponentProps<"h3">) {
  return (
    <HeroCard.Title
      className={cn("font-semibold leading-none tracking-tight", className)}
      {...(props as React.ComponentProps<typeof HeroCard.Title>)}
    />
  );
}

function CardDescription({ className, ...props }: React.ComponentProps<"p">) {
  return (
    <HeroCard.Description
      className={cn("text-sm text-zinc-600", className)}
      {...(props as React.ComponentProps<typeof HeroCard.Description>)}
    />
  );
}

function CardContent({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <HeroCard.Content
      className={cn("p-6 pt-0", className)}
      {...(props as React.ComponentProps<typeof HeroCard.Content>)}
    />
  );
}

function CardFooter({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <HeroCard.Footer
      className={cn("items-center p-6 pt-0", className)}
      {...(props as React.ComponentProps<typeof HeroCard.Footer>)}
    />
  );
}

export { Card, CardHeader, CardFooter, CardTitle, CardDescription, CardContent };
