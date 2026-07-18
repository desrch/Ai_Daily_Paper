import type { ComponentProps } from "react";

import { cn } from "@/lib/utils";

function Input({ className, type, ...props }: ComponentProps<"input">) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        "h-10 w-full rounded-md border border-line-strong bg-surface px-3 py-2 text-sm text-ink shadow-xs transition-colors outline-none placeholder:text-muted-ink/70 hover:border-muted-ink focus-visible:border-brand focus-visible:ring-2 focus-visible:ring-brand/15 disabled:cursor-not-allowed disabled:bg-soft disabled:opacity-60",
        className,
      )}
      {...props}
    />
  );
}

export { Input };
