import { format, parseISO } from "date-fns";
import { zhCN } from "date-fns/locale";
import Image from "next/image";

import { AngleBadge } from "@/components/news/angle-badge";
import { SourceMeta } from "@/components/news/source-meta";
import { cn } from "@/lib/utils";
import type { NewsAngle } from "@/types";

export type PosterArticleData = {
  id: string;
  title: string;
  summary: string;
  source: string;
  sourceUrl?: string;
  publishedAt: string;
  imageUrl?: string;
  angle?: NewsAngle;
};

export function PosterArticle({
  article,
  index,
  numbered = false,
  modern = false,
}: {
  article: PosterArticleData;
  index: number;
  numbered?: boolean;
  modern?: boolean;
}) {
  return (
    <article
      className={cn(
        "poster-block grid gap-4 border-t border-line pt-5 sm:grid-cols-[1fr_13rem]",
        modern && "border-line/70",
      )}
    >
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          {numbered && (
            <span className="font-brand text-3xl leading-none font-bold text-brand">
              {String(index + 1).padStart(2, "0")}
            </span>
          )}
          {article.angle && <AngleBadge angle={article.angle} />}
        </div>
        <h2
          className={cn(
            "mt-3 font-serif text-xl leading-snug font-semibold tracking-tight sm:text-2xl",
            modern && "font-sans font-bold",
          )}
        >
          {article.title}
        </h2>
        <p className="mt-3 text-sm leading-7 text-muted-ink">
          {article.summary}
        </p>
        <SourceMeta
          source={article.source}
          sourceUrl={article.sourceUrl}
          publishedLabel={format(parseISO(article.publishedAt), "M 月 d 日 HH:mm", {
            locale: zhCN,
          })}
          className="mt-4"
        />
      </div>
      {article.imageUrl && (
        <div className="relative aspect-[4/3] overflow-hidden rounded-sm border border-line bg-soft sm:order-last">
          <Image
            src={article.imageUrl}
            alt=""
            fill
            loading={index === 0 ? "eager" : "lazy"}
            fetchPriority={index === 0 ? "high" : "auto"}
            sizes="(max-width: 640px) 100vw, 208px"
            className="object-cover"
          />
        </div>
      )}
    </article>
  );
}
