import { cva, type VariantProps } from "class-variance-authority";
import type { ComponentProps } from "react";

import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex w-fit items-center rounded-sm border px-2 py-0.5 text-xs font-medium",
  {
    variants: {
      variant: {
        default: "border-brand/30 bg-brand/8 text-brand",
        neutral: "border-line bg-soft text-muted-ink",
        success: "border-success/30 bg-success/8 text-success",
        info: "border-info/30 bg-info/8 text-info",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

type BadgeProps = ComponentProps<"span"> &
  VariantProps<typeof badgeVariants>;

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <span
      data-slot="badge"
      className={cn(badgeVariants({ variant }), className)}
      {...props}
    />
  );
}

export { Badge, badgeVariants };
