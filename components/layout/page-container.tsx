import type { ComponentProps } from "react";

import { cn } from "@/lib/utils";

export function PageContainer({
  className,
  ...props
}: ComponentProps<"div">) {
  return (
    <div
      className={cn("mx-auto w-full max-w-[var(--page-width)] px-5 sm:px-7 lg:px-10", className)}
      {...props}
    />
  );
}
