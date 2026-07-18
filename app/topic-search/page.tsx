import type { Metadata } from "next";

import { PageContainer } from "@/components/layout/page-container";
import { TopicSearchWorkspace } from "@/components/topic/topic-search-workspace";

export const metadata: Metadata = {
  title: "关键词专题搜索",
  description: "搜索候选新闻，选择不同报道角度并生成 TodayPaper 专题海报。",
};

export default function TopicSearchPage() {
  return (
    <PageContainer className="py-10 sm:py-14">
      <div className="mb-9">
        <p className="text-xs font-semibold tracking-[0.22em] text-brand uppercase">
          Topic Investigation
        </p>
        <h1 className="mt-3 font-serif text-4xl font-semibold tracking-tight sm:text-5xl">
          搜索关键词，生成专题海报
        </h1>
        <span className="mt-4 block h-0.5 w-10 bg-brand" aria-hidden="true" />
        <p className="mt-5 max-w-3xl text-sm leading-7 text-muted-ink">
          从至少六条候选新闻中选择 3～5 篇，调整顺序并组合不同报道角度。
        </p>
      </div>
      <TopicSearchWorkspace />
    </PageContainer>
  );
}
