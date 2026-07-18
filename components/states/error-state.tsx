import { AlertTriangle, RotateCcw } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function ErrorState({
  title = "暂时无法完成操作",
  description,
  onRetry,
  className,
}: {
  title?: string;
  description: string;
  onRetry?: () => void;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "grid min-h-64 place-items-center rounded-lg border border-danger/35 bg-surface p-8 text-center",
        className,
      )}
      role="alert"
    >
      <div className="max-w-md">
        <AlertTriangle
          className="mx-auto size-7 text-danger"
          aria-hidden="true"
        />
        <h2 className="mt-4 font-serif text-xl font-semibold">{title}</h2>
        <p className="mt-2 text-sm leading-6 text-muted-ink">{description}</p>
        {onRetry && (
          <Button
            type="button"
            variant="secondary"
            className="mt-5"
            onClick={onRetry}
          >
            <RotateCcw />
            重新尝试
          </Button>
        )}
      </div>
    </div>
  );
}
