import { format, parseISO } from "date-fns";
import { zhCN } from "date-fns/locale";
import Image from "next/image";

import { SourceMeta } from "@/components/news/source-meta";
import { NewspaperMasthead } from "@/components/newspaper/newspaper-masthead";
import { Badge } from "@/components/ui/badge";
import type { DailyIssue, NewsArticle } from "@/types";

function formatPublishedAt(value: string) {
  return format(parseISO(value), "MM-dd HH:mm", { locale: zhCN });
}

function findLeadArticle(issue: DailyIssue): NewsArticle | undefined {
  return issue.sections
    .flatMap((section) => section.articles)
    .find((article) => article.id === issue.leadArticleId);
}

export function DailyNewspaper({ issue }: { issue: DailyIssue }) {
  const leadArticle = findLeadArticle(issue);
  const issueDateLabel = format(parseISO(issue.issueDate), "yyyy 年 M 月 d 日 EEEE", {
    locale: zhCN,
  });
  const issueNumber = issue.issueDate.replaceAll("-", "");
  const sources = Array.from(
    new Map(
      issue.sections
        .flatMap((section) => section.articles)
        .map((article) => [article.id, article]),
    ).values(),
  );

  return (
    <article className="newspaper-sheet paper-grain border border-line-strong bg-surface p-5 shadow-paper sm:p-8 lg:p-10">
      <NewspaperMasthead
        issueDate={issueDateLabel}
        issueNumber={issueNumber}
        topics={issue.topics}
      />

      {leadArticle && (
        <section className="newspaper-block mt-6 border-b-2 border-ink pb-6">
          <Badge>今日头条</Badge>
          <div className="mt-4 grid gap-6 lg:grid-cols-[1.05fr_0.95fr] lg:items-stretch">
            <div>
              <h1 className="font-serif text-3xl font-bold leading-tight sm:text-4xl">
                {leadArticle.title}
              </h1>
              <p className="mt-4 text-sm leading-7 text-muted-ink sm:text-base">
                {leadArticle.description}
              </p>
              <SourceMeta
                className="mt-5"
                source={leadArticle.source}
                sourceUrl={leadArticle.sourceUrl}
                publishedLabel={formatPublishedAt(leadArticle.publishedAt)}
              />
            </div>
            {leadArticle.imageUrl && (
              <div className="relative min-h-64 overflow-hidden border border-line bg-soft">
                <Image
                  src={leadArticle.imageUrl}
                  alt=""
                  fill
                  priority
                  sizes="(max-width: 1024px) 100vw, 46vw"
                  className="object-cover"
                />
              </div>
            )}
          </div>
        </section>
      )}

      <section className="newspaper-block mt-5 border border-line bg-paper p-5">
        <p className="font-serif text-xl font-semibold text-brand">
          AI 今日导读
        </p>
        <p className="mt-3 text-sm leading-7 text-ink">
          {issue.dailyBriefing}
        </p>
      </section>

      <div className="mt-6 grid gap-5 lg:grid-cols-3 lg:gap-0 lg:divide-x lg:divide-line">
        {issue.sections.map((section, sectionIndex) => (
          <section
            key={section.title}
            className="newspaper-block lg:px-5 first:lg:pl-0 last:lg:pr-0"
          >
            <div className="flex items-baseline justify-between gap-3 border-b-2 border-ink pb-2">
              <h2 className="font-serif text-2xl font-semibold">
                {section.title}
              </h2>
              <span className="font-brand text-sm text-brand">
                0{sectionIndex + 1}
              </span>
            </div>
            <div className="divide-y divide-line">
              {section.articles.map((article) => (
                <article
                  key={article.id}
                  className="newspaper-block py-4 first:pt-4"
                >
                  <h3 className="font-serif text-lg font-semibold leading-snug">
                    {article.title}
                  </h3>
                  <p className="mt-2 text-sm leading-6 text-muted-ink">
                    {article.description}
                  </p>
                  <SourceMeta
                    className="mt-3"
                    source={article.source}
                    sourceUrl={article.sourceUrl}
                    publishedLabel={formatPublishedAt(article.publishedAt)}
                  />
                </article>
              ))}
            </div>
          </section>
        ))}
      </div>

      <div className="mt-6 grid gap-5 border-t-2 border-ink pt-5 md:grid-cols-2">
        <section className="newspaper-block border border-line p-5">
          <h2 className="font-serif text-xl font-semibold text-brand">
            今日速览
          </h2>
          <ul className="mt-3 space-y-2 text-sm leading-6 text-ink">
            {issue.quickNews.map((item) => (
              <li key={item} className="flex gap-2">
                <span className="mt-2 size-1.5 shrink-0 rounded-full bg-brand" />
                {item}
              </li>
            ))}
          </ul>
        </section>
        <section className="newspaper-block border border-line p-5">
          <h2 className="font-serif text-xl font-semibold text-brand">
            值得继续关注
          </h2>
          <ol className="mt-3 space-y-2 text-sm leading-6 text-ink">
            {issue.watchNext.map((item, index) => (
              <li key={item} className="flex gap-3">
                <span className="font-brand text-brand">{index + 1}.</span>
                {item}
              </li>
            ))}
          </ol>
        </section>
      </div>

      <section className="newspaper-block mt-6 border-t border-line pt-5">
        <h2 className="font-serif text-lg font-semibold">来源区</h2>
        <ol className="mt-3 grid gap-x-8 gap-y-2 text-xs leading-5 text-muted-ink sm:grid-cols-2">
          {sources.map((article, index) => (
            <li key={article.id}>
              {index + 1}. {article.source} ·{" "}
              {formatPublishedAt(article.publishedAt)}
              {article.sourceUrl && (
                <>
                  {" · "}
                  <a
                    href={article.sourceUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="text-brand hover:underline"
                  >
                    原文
                  </a>
                </>
              )}
            </li>
          ))}
        </ol>
        <p className="mt-5 border-t border-line pt-4 text-center text-[0.68rem] tracking-[0.12em] text-muted-ink">
          本期内容为 TodayPaper 固定演示数据，不代表实时新闻
        </p>
      </section>
    </article>
  );
}
