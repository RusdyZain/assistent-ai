"use client";

import { useCallback } from "react";
import { AlertDialog as HeroAlertDialog } from "@heroui/react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface ConfirmAlertDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  onConfirm: () => void | Promise<void>;
  confirmLabel?: string;
  cancelLabel?: string;
  confirmVariant?: "default" | "destructive";
  loading?: boolean;
}

export function ConfirmAlertDialog({
  open,
  onOpenChange,
  title,
  description,
  onConfirm,
  confirmLabel = "Ya, lanjutkan",
  cancelLabel = "Batal",
  confirmVariant = "destructive",
  loading = false,
}: ConfirmAlertDialogProps) {
  const handleConfirm = useCallback(() => {
    onOpenChange(false);
    void onConfirm();
  }, [onConfirm, onOpenChange]);

  return (
    <HeroAlertDialog.Backdrop
      className="z-50 bg-black/50 backdrop-blur-sm"
      isDismissable={!loading}
      isKeyboardDismissDisabled={loading}
      isOpen={open}
      onOpenChange={onOpenChange}
    >
      <HeroAlertDialog.Container>
        <HeroAlertDialog.Dialog
          className={cn(
            "relative w-full max-w-lg rounded-2xl border border-zinc-200 bg-white p-6 shadow-2xl shadow-zinc-300/35",
          )}
        >
          <HeroAlertDialog.Header className="mb-2">
            <HeroAlertDialog.Heading className="text-lg font-semibold leading-none text-zinc-900">
              {title}
            </HeroAlertDialog.Heading>
          </HeroAlertDialog.Header>

          <HeroAlertDialog.Body className="text-sm text-zinc-600">
            {description}
          </HeroAlertDialog.Body>

          <HeroAlertDialog.Footer className="mt-4 flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
              {cancelLabel}
            </Button>
            <Button
              type="button"
              variant={confirmVariant}
              onClick={handleConfirm}
              disabled={loading}
            >
              {confirmLabel}
            </Button>
          </HeroAlertDialog.Footer>
        </HeroAlertDialog.Dialog>
      </HeroAlertDialog.Container>
    </HeroAlertDialog.Backdrop>
  );
}
