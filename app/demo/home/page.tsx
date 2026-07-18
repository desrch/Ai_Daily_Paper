import type { Metadata } from "next";

import dailyIssueJson from "@/data/demo/daily-issue.json";
import subscriptionsJson from "@/data/demo/subscriptions.json";
import { DashboardClient } from "@/components/dashboard/dashboard-client";
import { PageContainer } from "@/components/layout/page-container";
import {
  dailyIssueSchema,
  subscriptionBundleSchema,
} from "@/lib/api/schemas";

export const metadata: Metadata = {
  title: "演示用户主页",
  description: "无需登录或外部服务即可打开的 TodayPaper 固定演示主页。",
};

const demoIssue = dailyIssueSchema.parse(dailyIssueJson);
const demoSubscriptions =
  subscriptionBundleSchema.parse(subscriptionsJson);

export default function DemoHomePage() {
  return (
    <PageContainer className="py-10 sm:py-14">
      <DashboardClient
        demoMode
        demoData={{
          subscriptions: demoSubscriptions,
          issues: [demoIssue],
        }}
      />
    </PageContainer>
  );
}
