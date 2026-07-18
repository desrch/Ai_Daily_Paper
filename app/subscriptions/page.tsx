import type { Metadata } from "next";

import { PageContainer } from "@/components/layout/page-container";
import { SubscriptionsManager } from "@/components/subscription/subscriptions-manager";

export const metadata: Metadata = {
  title: "管理订阅",
  description: "管理 TodayPaper 关注方向与每日投递设置。",
};

export default function SubscriptionsPage() {
  return (
    <PageContainer className="py-10 sm:py-14">
      <div className="mb-9">
        <p className="text-xs font-semibold tracking-[0.22em] text-brand uppercase">
          Subscription Desk
        </p>
        <h1 className="mt-3 font-serif text-4xl font-semibold tracking-tight sm:text-5xl">
          管理订阅
        </h1>
        <span
          className="mt-4 block h-0.5 w-10 bg-brand"
          aria-hidden="true"
        />
        <p className="mt-5 max-w-2xl text-sm leading-7 text-muted-ink">
          管理你的订阅主题、关键词与投递偏好，打造专属的每日资讯。
        </p>
      </div>

      <SubscriptionsManager />
    </PageContainer>
  );
}
