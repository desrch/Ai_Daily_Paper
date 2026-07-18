import type { Metadata } from "next";

import topicPosterJson from "@/data/demo/topic-poster.json";
import { PageContainer } from "@/components/layout/page-container";
import { TopicPosterResultView } from "@/components/poster/topic-poster-result-view";
import { topicPosterContentSchema } from "@/lib/api/schemas";

export const metadata: Metadata = {
  title: "固定演示关键词专题",
  description: "无需接口或浏览器存储即可查看的 TodayPaper 固定关键词专题海报。",
};

const demoTopicPoster =
  topicPosterContentSchema.parse(topicPosterJson);

export default function DemoTopicPosterPage() {
  return (
    <PageContainer className="py-6 sm:py-8">
      <TopicPosterResultView
        poster={demoTopicPoster}
        isSaved={false}
        demoMode
      />
    </PageContainer>
  );
}
