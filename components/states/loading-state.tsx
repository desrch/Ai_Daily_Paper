import { LoaderCircle } from "lucide-react";

import { cn } from "@/lib/utils";

export function LoadingState({
  title = "正在加载",
  description = "正在整理演示数据，请稍候。",
  className,
}: {
  title?: string;
  description?: string;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "grid min-h-64 place-items-center rounded-lg border border-line bg-surface p-8 text-center",
        className,
      )}
      role="status"
    >
      <div>
        <LoaderCircle
          className="mx-auto size-7 animate-spin text-brand"
          aria-hidden="true"
        />
        <p className="mt-4 font-serif text-xl font-semibold">{title}</p>
        <p className="mt-2 text-sm text-muted-ink">{description}</p>
      </div>
    </div>
  );
}
