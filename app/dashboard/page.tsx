import type { Metadata } from "next";

import { DashboardClient } from "@/components/dashboard/dashboard-client";
import { PageContainer } from "@/components/layout/page-container";

export const metadata: Metadata = {
  title: "我的日报",
  description: "查看 TodayPaper 演示日报并模拟每日 08:00 投递。",
};

export default function DashboardPage() {
  return (
    <PageContainer className="py-10 sm:py-14">
      <DashboardClient />
    </PageContainer>
  );
}
