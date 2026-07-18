import { formatDistanceToNowStrict, parseISO } from "date-fns";
import { zhCN } from "date-fns/locale";
import Image from "next/image";

import { AngleBadge } from "@/components/news/angle-badge";
import { RelevanceBadge } from "@/components/news/relevance-badge";
import { SourceMeta } from "@/components/news/source-meta";
import { cn } from "@/lib/utils";
import type { SearchNewsItem } from "@/types";

export function NewsSelector({
  article,
  selected,
  disabled,
  priority = false,
  onToggle,
}: {
  article: SearchNewsItem;
  selected: boolean;
  disabled?: boolean;
  priority?: boolean;
  onToggle: () => void;
}) {
  const checkboxId = `news-${article.id}`;

  return (
    <article
      className={cn(
        "grid gap-4 rounded-lg border border-line bg-surface p-4 shadow-card transition-colors sm:grid-cols-[1.25rem_9rem_1fr]",
        selected && "border-brand bg-brand/4",
        disabled && !selected && "opacity-55",
      )}
    >
      <div className="pt-1">
        <input
          id={checkboxId}
          type="checkbox"
          checked={selected}
          disabled={disabled && !selected}
          onChange={onToggle}
          className="size-4 accent-brand"
          aria-label={`选择新闻：${article.title}`}
        />
      </div>
      {article.imageUrl && (
        <label
          htmlFor={checkboxId}
          className="relative aspect-[4/3] cursor-pointer overflow-hidden rounded-sm border border-line bg-soft"
        >
          <Image
            src={article.imageUrl}
            alt=""
            fill
            preload={priority}
            sizes="(max-width: 640px) 100vw, 144px"
            className="object-cover"
          />
        </label>
      )}
      <div className="min-w-0">
        <div className="flex flex-wrap gap-2">
          <AngleBadge angle={article.angle} />
          <RelevanceBadge score={article.relevanceScore ?? 0} />
        </div>
        <label
          htmlFor={checkboxId}
          className="mt-3 block cursor-pointer font-serif text-lg leading-snug font-semibold"
        >
          {article.title}
        </label>
        <p className="mt-2 line-clamp-2 text-sm leading-6 text-muted-ink">
          {article.description}
        </p>
        <SourceMeta
          source={article.source}
          sourceUrl={article.sourceUrl}
          publishedLabel={`${formatDistanceToNowStrict(
            parseISO(article.publishedAt),
            {
              addSuffix: true,
              locale: zhCN,
            },
          )} · ${article.publishedAt.slice(0, 10)}`}
          className="mt-3"
        />
      </div>
    </article>
  );
}
