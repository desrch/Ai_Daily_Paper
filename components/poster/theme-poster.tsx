import { format, parseISO } from "date-fns";
import { zhCN } from "date-fns/locale";
import type { Ref } from "react";

import {
  PosterArticle,
  type PosterArticleData,
} from "@/components/poster/poster-article";
import { PosterMark } from "@/components/poster/poster-mark";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { ThemePosterContent } from "@/types";

export function ThemePoster({
  poster,
  posterRef,
}: {
  poster: ThemePosterContent;
  posterRef?: Ref<HTMLDivElement>;
}) {
  const modern = poster.template === "modern";
  const articles: PosterArticleData[] = poster.articles.map((article) => ({
    id: article.id,
    title: article.title,
    summary: article.description,
    source: article.source,
    sourceUrl: article.sourceUrl,
    publishedAt: article.publishedAt,
    imageUrl: article.imageUrl,
  }));

  return (
    <div
      ref={posterRef}
      className={cn(
        "poster-sheet paper-grain mx-auto w-full max-w-[52rem] border border-line bg-surface px-5 py-7 text-ink shadow-paper sm:px-10 sm:py-10",
        modern && "bg-white",
      )}
    >
      <header className="border-y-4 border-double border-ink py-4 text-center">
        <div className="flex flex-wrap items-center justify-between gap-2 text-[10px] tracking-[0.18em] text-muted-ink uppercase">
          <span>TodayPaper · Theme Brief</span>
          <span>
            {format(parseISO(poster.createdAt), "yyyy 年 M 月 d 日", {
              locale: zhCN,
            })}
          </span>
        </div>
        <h1
          className={cn(
            "mt-5 font-serif text-4xl leading-tight font-bold tracking-tight sm:text-6xl",
            modern && "font-sans",
          )}
        >
          {poster.title}
        </h1>
        <div className="editorial-rule mt-5">
          <span className="text-xs font-semibold tracking-[0.22em] text-brand uppercase">
            多新闻主题聚合
          </span>
        </div>
        <p className="mx-auto mt-4 max-w-2xl font-serif text-sm leading-7 text-muted-ink sm:text-base">
          {poster.introduction}
        </p>
      </header>

      <section className="mt-7 space-y-6" aria-label="主题新闻">
        {articles.map((article, index) => (
          <PosterArticle
            key={article.id}
            article={article}
            index={index}
            modern={modern}
          />
        ))}
      </section>

      <section className="poster-block mt-8 border-y border-ink py-6">
        <p className="text-xs font-semibold tracking-[0.2em] text-brand uppercase">
          AI 趋势总结
        </p>
        <p className="mt-3 font-serif text-lg leading-8 font-semibold">
          {poster.trendSummary}
        </p>
      </section>

      <footer className="mt-7 flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-semibold tracking-[0.16em] text-muted-ink uppercase">
            核心关键词
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            {poster.keywords.map((keyword) => (
              <Badge key={keyword} variant="neutral">
                #{keyword}
              </Badge>
            ))}
          </div>
        </div>
        <PosterMark />
      </footer>
    </div>
  );
}
