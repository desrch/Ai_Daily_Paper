import type { Metadata } from "next";

import { PageContainer } from "@/components/layout/page-container";
import { ThemePosterPageClient } from "@/components/poster/theme-poster-page-client";

export const metadata: Metadata = {
  title: "主题海报",
  description: "查看、保存并下载 TodayPaper 主题新闻海报。",
};

export default async function ThemePosterResultPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return (
    <PageContainer className="py-6 sm:py-8">
      <ThemePosterPageClient posterId={id} />
    </PageContainer>
  );
}
