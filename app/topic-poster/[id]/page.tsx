import type { Metadata } from "next";

import { PageContainer } from "@/components/layout/page-container";
import { TopicPosterPageClient } from "@/components/poster/topic-poster-page-client";

export const metadata: Metadata = {
  title: "关键词专题海报",
  description: "查看、调整、保存并下载 TodayPaper 关键词专题海报。",
};

export default async function TopicPosterResultPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return (
    <PageContainer className="py-6 sm:py-8">
      <TopicPosterPageClient posterId={id} />
    </PageContainer>
  );
}
