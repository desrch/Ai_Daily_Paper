import { Inbox } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function EmptyState({
  title,
  description,
  action,
  className,
}: {
  title: string;
  description: string;
  action?: {
    href: string;
    label: string;
  };
  className?: string;
}) {
  return (
    <div
      className={cn(
        "grid min-h-64 place-items-center rounded-lg border border-dashed border-line-strong bg-surface/70 p-8 text-center",
        className,
      )}
    >
      <div className="max-w-md">
        <Inbox className="mx-auto size-7 text-brand" aria-hidden="true" />
        <h2 className="mt-4 font-serif text-xl font-semibold">{title}</h2>
        <p className="mt-2 text-sm leading-6 text-muted-ink">{description}</p>
        {action && (
          <Button asChild className="mt-5">
            <Link href={action.href}>{action.label}</Link>
          </Button>
        )}
      </div>
    </div>
  );
}
