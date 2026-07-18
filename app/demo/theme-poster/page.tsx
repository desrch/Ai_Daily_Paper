import type { Metadata } from "next";

import themePosterJson from "@/data/demo/theme-poster.json";
import { PageContainer } from "@/components/layout/page-container";
import { ThemePosterResultView } from "@/components/poster/theme-poster-result-view";
import { themePosterContentSchema } from "@/lib/api/schemas";

export const metadata: Metadata = {
  title: "固定演示主题海报",
  description: "无需接口或浏览器存储即可查看的 TodayPaper 固定主题海报。",
};

const demoThemePoster =
  themePosterContentSchema.parse(themePosterJson);

export default function DemoThemePosterPage() {
  return (
    <PageContainer className="py-6 sm:py-8">
      <ThemePosterResultView
        poster={demoThemePoster}
        isSaved={false}
        demoMode
      />
    </PageContainer>
  );
}
