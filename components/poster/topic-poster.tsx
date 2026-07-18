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
import type { NewsAngle, TopicPosterContent } from "@/types";

export function TopicPoster({
  poster,
  posterRef,
}: {
  poster: TopicPosterContent;
  posterRef?: Ref<HTMLDivElement>;
}) {
  const modern = poster.template === "modern";
  const articles: PosterArticleData[] = poster.articles.map((article) => ({
    id: article.id,
    title: article.headline,
    summary: article.summary,
    source: article.source,
    sourceUrl: article.sourceUrl,
    publishedAt: article.publishedAt,
    imageUrl: article.imageUrl,
    angle: article.angle as NewsAngle,
  }));

  return (
    <div
      ref={posterRef}
      className={cn(
        "poster-sheet paper-grain mx-auto w-full max-w-[52rem] border border-line bg-surface px-5 py-7 text-ink shadow-paper sm:px-10 sm:py-10",
        modern && "bg-white",
      )}
    >
      <header className="border-t-8 border-ink pt-5">
        <div className="flex flex-wrap items-center justify-between gap-2 text-[10px] tracking-[0.18em] text-muted-ink uppercase">
          <span>TodayPaper · Topic Investigation</span>
          <span>
            {format(parseISO(poster.createdAt), "yyyy 年 M 月 d 日", {
              locale: zhCN,
            })}
          </span>
        </div>
        <p className="mt-7 text-xs font-semibold tracking-[0.26em] text-brand uppercase">
          关键词专题
        </p>
        <h1
          className={cn(
            "mt-3 font-serif text-4xl leading-tight font-bold tracking-tight sm:text-6xl",
            modern && "font-sans",
          )}
        >
          {poster.topicTitle}
        </h1>
        <p className="mt-5 border-l-4 border-brand pl-4 font-serif text-sm leading-7 text-muted-ink sm:text-base">
          {poster.introduction}
        </p>
      </header>

      <section className="mt-8 space-y-7" aria-label="专题新闻">
        {articles.map((article, index) => (
          <PosterArticle
            key={article.id}
            article={article}
            index={index}
            numbered
            modern={modern}
          />
        ))}
      </section>

      <section className="poster-block mt-8 grid gap-6 border-y-4 border-double border-ink py-6 sm:grid-cols-2">
        <div>
          <p className="text-xs font-semibold tracking-[0.2em] text-brand uppercase">
            趋势总结
          </p>
          <p className="mt-3 font-serif text-base leading-8 font-semibold">
            {poster.trendSummary}
          </p>
        </div>
        <div>
          <p className="text-xs font-semibold tracking-[0.2em] text-brand uppercase">
            关键结论
          </p>
          <ol className="mt-3 space-y-2 text-sm leading-6 text-muted-ink">
            {poster.keyTakeaways.map((takeaway, index) => (
              <li key={takeaway} className="flex gap-2">
                <span className="font-brand font-bold text-brand">
                  {index + 1}.
                </span>
                <span>{takeaway}</span>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="poster-block mt-7">
        <p className="text-xs font-semibold tracking-[0.16em] text-muted-ink uppercase">
          完整来源
        </p>
        <ol className="mt-3 grid gap-2 text-xs leading-5 text-muted-ink sm:grid-cols-2">
          {poster.articles.map((article, index) => (
            <li key={article.id}>
              [{index + 1}] {article.source} ·{" "}
              {format(parseISO(article.publishedAt), "M 月 d 日 HH:mm", {
                locale: zhCN,
              })}
            </li>
          ))}
        </ol>
      </section>

      <footer className="mt-7 flex flex-col gap-6 border-t border-line pt-6 sm:flex-row sm:items-end sm:justify-between">
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
