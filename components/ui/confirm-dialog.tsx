"use client";

import * as AlertDialogPrimitive from "@radix-ui/react-alert-dialog";
import { AlertTriangle } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel,
  onConfirm,
  doubleConfirm = false,
  secondTitle = "请再次确认",
  secondDescription = "此操作无法撤销，请确认你确实要继续。",
  danger = true,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  confirmLabel: string;
  onConfirm: () => void | Promise<void>;
  doubleConfirm?: boolean;
  secondTitle?: string;
  secondDescription?: string;
  danger?: boolean;
}) {
  const [step, setStep] = useState<1 | 2>(1);
  const isSecondStep = doubleConfirm && step === 2;

  function handleOpenChange(nextOpen: boolean) {
    if (!nextOpen) {
      setStep(1);
    }
    onOpenChange(nextOpen);
  }

  return (
    <AlertDialogPrimitive.Root
      open={open}
      onOpenChange={handleOpenChange}
    >
      <AlertDialogPrimitive.Portal>
        <AlertDialogPrimitive.Overlay className="fixed inset-0 z-[80] bg-ink/45 backdrop-blur-[1px] data-[state=closed]:animate-none" />
        <AlertDialogPrimitive.Content
          className={cn(
            "fixed top-1/2 left-1/2 z-[90] w-[calc(100%-2rem)] max-w-md -translate-x-1/2 -translate-y-1/2 rounded-lg border border-line bg-surface p-6 shadow-paper",
            "focus:outline-none",
          )}
        >
          <span
            className={cn(
              "grid size-10 place-items-center rounded-full",
              danger
                ? "bg-danger/10 text-danger"
                : "bg-info/10 text-info",
            )}
          >
            <AlertTriangle className="size-5" aria-hidden="true" />
          </span>
          <AlertDialogPrimitive.Title className="mt-4 font-serif text-2xl font-semibold">
            {isSecondStep ? secondTitle : title}
          </AlertDialogPrimitive.Title>
          <AlertDialogPrimitive.Description className="mt-3 text-sm leading-6 text-muted-ink">
            {isSecondStep ? secondDescription : description}
          </AlertDialogPrimitive.Description>
          <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <AlertDialogPrimitive.Cancel asChild>
              <Button type="button" variant="secondary">
                取消
              </Button>
            </AlertDialogPrimitive.Cancel>
            {doubleConfirm && step === 1 ? (
              <Button
                type="button"
                variant={danger ? "danger" : "default"}
                onClick={() => setStep(2)}
              >
                继续确认
              </Button>
            ) : (
              <AlertDialogPrimitive.Action asChild>
                <Button
                  type="button"
                  variant={danger ? "danger" : "default"}
                  onClick={() => void onConfirm()}
                >
                  {confirmLabel}
                </Button>
              </AlertDialogPrimitive.Action>
            )}
          </div>
        </AlertDialogPrimitive.Content>
      </AlertDialogPrimitive.Portal>
    </AlertDialogPrimitive.Root>
  );
}
