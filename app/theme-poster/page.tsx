import type { Metadata } from "next";

import { PageContainer } from "@/components/layout/page-container";
import { ThemePosterGenerator } from "@/components/poster/theme-poster-generator";

export const metadata: Metadata = {
  title: "生成主题新闻海报",
  description: "选择关注主题，将多篇代表新闻汇总为 TodayPaper 主题海报。",
};

export default function ThemePosterPage() {
  return (
    <PageContainer className="py-10 sm:py-14">
      <div className="mb-9">
        <p className="text-xs font-semibold tracking-[0.22em] text-brand uppercase">
          Theme Poster Studio
        </p>
        <h1 className="mt-3 font-serif text-4xl font-semibold tracking-tight sm:text-5xl">
          生成主题新闻海报
        </h1>
        <span className="mt-4 block h-0.5 w-10 bg-brand" aria-hidden="true" />
        <p className="mt-5 max-w-3xl text-sm leading-7 text-muted-ink">
          从同一主题的多篇新闻中提炼代表内容、趋势与关键词，生成可保存和下载的纵向新闻海报。
        </p>
      </div>
      <ThemePosterGenerator />
    </PageContainer>
  );
}
