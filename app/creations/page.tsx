import type { Metadata } from "next";

import { CreationsBrowser } from "@/components/creation/creations-browser";
import { PageContainer } from "@/components/layout/page-container";

export const metadata: Metadata = {
  title: "历史作品",
  description: "查看并筛选 TodayPaper 历史日报与新闻海报。",
};

export default function CreationsPage() {
  return (
    <PageContainer className="py-10 sm:py-14">
      <div className="mb-9">
        <p className="text-xs font-semibold tracking-[0.22em] text-brand uppercase">
          Editorial Archive
        </p>
        <h1 className="mt-3 font-serif text-4xl font-semibold tracking-tight sm:text-5xl">
          历史作品
        </h1>
        <span
          className="mt-4 block h-0.5 w-10 bg-brand"
          aria-hidden="true"
        />
        <p className="mt-5 max-w-2xl text-sm leading-7 text-muted-ink">
          查看各类生成内容和记录，支持按类型、日期与关键词筛选。
        </p>
      </div>

      <CreationsBrowser />
    </PageContainer>
  );
}
