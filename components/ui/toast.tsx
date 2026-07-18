"use client";

import { AlertCircle, CheckCircle2, Info, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type ToastVariant = "success" | "error" | "info";

type ToastProps = {
  message: string;
  variant?: ToastVariant;
  onDismiss: () => void;
};

const iconMap = {
  success: CheckCircle2,
  error: AlertCircle,
  info: Info,
} as const;

export function Toast({
  message,
  variant = "info",
  onDismiss,
}: ToastProps) {
  const Icon = iconMap[variant];

  return (
    <div
      role={variant === "error" ? "alert" : "status"}
      aria-live={variant === "error" ? "assertive" : "polite"}
      className={cn(
        "fixed right-4 bottom-4 z-[70] flex max-w-sm items-start gap-3 rounded-md border bg-surface p-4 shadow-paper",
        variant === "success" && "border-success/40",
        variant === "error" && "border-danger/40",
        variant === "info" && "border-info/40",
      )}
    >
      <Icon
        className={cn(
          "mt-0.5 size-5 shrink-0",
          variant === "success" && "text-success",
          variant === "error" && "text-danger",
          variant === "info" && "text-info",
        )}
        aria-hidden="true"
      />
      <p className="flex-1 text-sm leading-6 text-ink">{message}</p>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="-m-2 size-8"
        aria-label="关闭提示"
        onClick={onDismiss}
      >
        <X />
      </Button>
    </div>
  );
}
