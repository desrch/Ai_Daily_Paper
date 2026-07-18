import { ArrowRight, Newspaper } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { DailyIssue, NewsArticle } from "@/types";

function findLeadArticle(issue: DailyIssue): NewsArticle | undefined {
  return issue.sections
    .flatMap((section) => section.articles)
    .find((article) => article.id === issue.leadArticleId);
}

export function DailyIssueCard({
  issue,
  href,
}: {
  issue?: DailyIssue;
  href?: string;
}) {
  if (!issue) {
    return (
      <article className="grid min-h-[30rem] place-items-center border border-dashed border-line-strong bg-surface p-7 text-center shadow-card">
        <div className="max-w-md">
          <span className="mx-auto grid size-14 place-items-center rounded-full bg-soft text-brand">
            <Newspaper className="size-7" aria-hidden="true" />
          </span>
          <h2 className="mt-5 font-serif text-2xl font-semibold">
            今日份日报还未生成
          </h2>
          <p className="mt-3 text-sm leading-7 text-muted-ink">
            点击“模拟每日 8 点投递”，体验获取、筛选、摘要和排版的完整演示流程。
          </p>
        </div>
      </article>
    );
  }

  const leadArticle = findLeadArticle(issue);

  return (
    <article className="paper-grain border border-line-strong bg-surface p-5 shadow-paper sm:p-7">
      <header className="border-y-2 border-ink py-3 text-center">
        <p className="font-serif text-4xl font-bold tracking-[0.16em] text-brand sm:text-5xl">
          今日报纸
        </p>
        <p className="font-brand mt-1 text-[0.6rem] tracking-[0.45em]">
          TODAYPAPER
        </p>
      </header>
      <div className="flex flex-wrap justify-between gap-2 border-b border-line py-2 text-xs text-muted-ink">
        <span>{issue.issueDate}</span>
        <span>演示期 · {issue.topics.join(" / ")}</span>
      </div>
      {leadArticle && (
        <div className="mt-5 grid gap-5 sm:grid-cols-[1.05fr_0.95fr]">
          <div>
            <Badge>今日头条</Badge>
            <h2 className="mt-3 font-serif text-2xl font-semibold leading-tight">
              {leadArticle.title}
            </h2>
            <p className="mt-3 text-sm leading-7 text-muted-ink">
              {leadArticle.description}
            </p>
          </div>
          {leadArticle.imageUrl && (
            <div className="relative min-h-52 overflow-hidden border border-line bg-soft">
              <Image
                src={leadArticle.imageUrl}
                alt=""
                fill
                loading="eager"
                fetchPriority="high"
                sizes="(max-width: 640px) 100vw, 45vw"
                className="object-cover"
              />
            </div>
          )}
        </div>
      )}
      <div className="mt-5 grid grid-cols-3 gap-3 border-t border-line pt-4">
        {issue.sections.slice(0, 3).map((section) => (
          <div key={section.title}>
            <p className="font-serif text-sm font-semibold">{section.title}</p>
            <p className="mt-2 line-clamp-2 text-xs leading-5 text-muted-ink">
              {section.articles[0]?.title}
            </p>
          </div>
        ))}
      </div>
      <Button asChild className="mt-6 w-full">
        <Link href={href ?? `/newspaper/${issue.id}`}>
          查看完整日报
          <ArrowRight />
        </Link>
      </Button>
    </article>
  );
}
