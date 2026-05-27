"use client";

import * as React from "react";
import { Modal as HeroModal } from "@heroui/react";
import { Slot } from "@radix-ui/react-slot";

import { cn } from "@/lib/utils";

type DialogContextValue = {
  open: boolean;
  setOpen: (open: boolean) => void;
};

const DialogContext = React.createContext<DialogContextValue | null>(null);

function useDialogContext() {
  const ctx = React.useContext(DialogContext);
  if (!ctx) {
    throw new Error("Dialog components must be used inside <Dialog />.");
  }
  return ctx;
}

type DialogProps = {
  children: React.ReactNode;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  open?: boolean;
};

function Dialog({ children, defaultOpen = false, onOpenChange, open }: DialogProps) {
  const [internalOpen, setInternalOpen] = React.useState(defaultOpen);
  const isControlled = open !== undefined;
  const currentOpen = isControlled ? open : internalOpen;

  const setOpen = React.useCallback(
    (nextOpen: boolean) => {
      if (!isControlled) {
        setInternalOpen(nextOpen);
      }
      onOpenChange?.(nextOpen);
    },
    [isControlled, onOpenChange],
  );

  return <DialogContext.Provider value={{ open: currentOpen, setOpen }}>{children}</DialogContext.Provider>;
}

type DialogTriggerProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  asChild?: boolean;
};

function DialogTrigger({ asChild = false, children, onClick, ...props }: DialogTriggerProps) {
  const { setOpen } = useDialogContext();

  const handleClick = React.useCallback(
    (event: React.MouseEvent<HTMLButtonElement>) => {
      onClick?.(event);
      if (!event.defaultPrevented) {
        setOpen(true);
      }
    },
    [onClick, setOpen],
  );

  if (asChild) {
    const Comp = Slot;
    return <Comp onClick={handleClick} {...props}>{children}</Comp>;
  }

  return (
    <button type="button" onClick={handleClick} {...props}>
      {children}
    </button>
  );
}

function DialogPortal({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

function DialogOverlay({ className, ...props }: React.ComponentProps<"div">) {
  return <div className={cn("fixed inset-0 z-50 bg-black/50 backdrop-blur-sm", className)} {...props} />;
}

type DialogContentProps = React.ComponentProps<"div">;

function DialogContent({ className, children, ...props }: DialogContentProps) {
  const { open, setOpen } = useDialogContext();

  return (
    <HeroModal.Backdrop
      className="z-50 bg-black/50 backdrop-blur-sm"
      isOpen={open}
      onOpenChange={setOpen}
    >
      <HeroModal.Container>
        <HeroModal.Dialog
          className={cn(
            "relative w-full max-w-lg rounded-2xl border border-zinc-200 bg-white p-6 shadow-2xl shadow-zinc-300/35",
            className,
          )}
          {...(props as React.ComponentProps<typeof HeroModal.Dialog>)}
        >
          {children}
          <HeroModal.CloseTrigger
            aria-label="Tutup dialog"
            className="absolute right-4 top-4"
          />
        </HeroModal.Dialog>
      </HeroModal.Container>
    </HeroModal.Backdrop>
  );
}

function DialogHeader({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("flex flex-col space-y-1.5 text-center sm:text-left", className)} {...props} />;
}

function DialogFooter({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("mt-4 flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2", className)} {...props} />;
}

function DialogTitle({ className, ...props }: React.ComponentProps<"h2">) {
  return (
    <HeroModal.Heading
      className={cn("text-lg font-semibold leading-none", className)}
      {...(props as React.ComponentProps<typeof HeroModal.Heading>)}
    />
  );
}

function DialogDescription({ className, ...props }: React.ComponentProps<"p">) {
  return <p className={cn("text-sm text-zinc-600", className)} {...props} />;
}

type DialogCloseProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  asChild?: boolean;
};

function DialogClose({ asChild = false, children, onClick, ...props }: DialogCloseProps) {
  const { setOpen } = useDialogContext();

  const handleClick = React.useCallback(
    (event: React.MouseEvent<HTMLButtonElement>) => {
      onClick?.(event);
      if (!event.defaultPrevented) {
        setOpen(false);
      }
    },
    [onClick, setOpen],
  );

  if (asChild) {
    const Comp = Slot;
    return <Comp onClick={handleClick} {...props}>{children}</Comp>;
  }

  return (
    <button type="button" onClick={handleClick} {...props}>
      {children}
    </button>
  );
}

export {
  Dialog,
  DialogPortal,
  DialogOverlay,
  DialogClose,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
};
