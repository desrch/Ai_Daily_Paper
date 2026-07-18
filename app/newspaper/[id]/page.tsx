import type { Metadata } from "next";

import { PageContainer } from "@/components/layout/page-container";
import { NewspaperPageClient } from "@/components/newspaper/newspaper-page-client";

export const metadata: Metadata = {
  title: "日报详情",
  description: "阅读 TodayPaper 经典中文报纸版式的演示日报。",
};

export default async function NewspaperPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return (
    <PageContainer className="py-6 sm:py-8">
      <NewspaperPageClient issueId={id} />
    </PageContainer>
  );
}
