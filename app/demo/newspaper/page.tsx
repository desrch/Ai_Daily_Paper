import { ArrowLeft } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

import dailyIssueJson from "@/data/demo/daily-issue.json";
import { DemoModeBadge } from "@/components/demo/demo-mode-badge";
import { PageContainer } from "@/components/layout/page-container";
import { DailyNewspaper } from "@/components/newspaper/daily-newspaper";
import { NewspaperActions } from "@/components/newspaper/newspaper-actions";
import { Button } from "@/components/ui/button";
import { dailyIssueSchema } from "@/lib/api/schemas";

export const metadata: Metadata = {
  title: "固定演示日报",
  description: "无需接口或浏览器存储即可阅读的 TodayPaper 固定演示日报。",
};

const demoIssue = dailyIssueSchema.parse(dailyIssueJson);

export default function DemoNewspaperPage() {
  return (
    <PageContainer className="py-6 sm:py-8">
      <div
        className="mb-5 flex flex-wrap items-center justify-between gap-3"
        data-print-hidden
      >
        <div className="flex flex-wrap items-center gap-2">
          <Button asChild variant="ghost">
            <Link href="/demo/home">
              <ArrowLeft />
              返回演示主页
            </Link>
          </Button>
          <DemoModeBadge />
        </div>
        <NewspaperActions title={`${demoIssue.issueDate} 固定演示日报`} />
      </div>
      <DailyNewspaper issue={demoIssue} />
    </PageContainer>
  );
}
