import { ArrowDown, ArrowUp, X } from "lucide-react";

import { AngleBadge } from "@/components/news/angle-badge";
import { Button } from "@/components/ui/button";
import type { SearchNewsItem } from "@/types";

export function SelectedNewsPanel({
  articles,
  onRemove,
  onMove,
}: {
  articles: SearchNewsItem[];
  onRemove: (id: string) => void;
  onMove: (id: string, direction: "up" | "down") => void;
}) {
  return (
    <ol className="space-y-3" aria-label="已选新闻排序">
      {articles.map((article, index) => (
        <li
          key={article.id}
          className="rounded-md border border-line bg-surface p-3"
        >
          <div className="flex items-start gap-3">
            <span className="grid size-6 shrink-0 place-items-center rounded-full bg-ink font-brand text-xs font-bold text-white">
              {index + 1}
            </span>
            <div className="min-w-0 flex-1">
              <AngleBadge angle={article.angle} />
              <p className="mt-2 line-clamp-2 text-sm leading-5 font-semibold">
                {article.title}
              </p>
            </div>
          </div>
          <div className="mt-3 flex justify-end gap-1 border-t border-line pt-2">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="size-8"
              disabled={index === 0}
              onClick={() => onMove(article.id, "up")}
              aria-label={`上移：${article.title}`}
            >
              <ArrowUp />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="size-8"
              disabled={index === articles.length - 1}
              onClick={() => onMove(article.id, "down")}
              aria-label={`下移：${article.title}`}
            >
              <ArrowDown />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="size-8 text-danger"
              onClick={() => onRemove(article.id)}
              aria-label={`移除：${article.title}`}
            >
              <X />
            </Button>
          </div>
        </li>
      ))}
    </ol>
  );
}
