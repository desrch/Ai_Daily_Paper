import { Clock3, ExternalLink } from "lucide-react";

import { cn } from "@/lib/utils";

export function SourceMeta({
  source,
  publishedLabel,
  sourceUrl,
  className,
}: {
  source: string;
  publishedLabel: string;
  sourceUrl?: string;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-ink",
        className,
      )}
    >
      <span>来源：{source}</span>
      <span className="inline-flex items-center gap-1">
        <Clock3 className="size-3.5" aria-hidden="true" />
        {publishedLabel}
      </span>
      {sourceUrl && (
        <a
          href={sourceUrl}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-1 font-medium text-brand hover:underline"
        >
          查看原文
          <ExternalLink className="size-3.5" aria-hidden="true" />
        </a>
      )}
    </div>
  );
}
