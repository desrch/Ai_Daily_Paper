"use client";

import { PageContainer } from "@/components/layout/page-container";
import { ErrorState } from "@/components/states/error-state";

export default function DemoErrorPage({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <PageContainer className="py-12">
      <ErrorState
        title="固定演示暂时无法显示"
        description="本地演示数据未能正确读取，请重新尝试；该页面不会连接任何外部服务。"
        onRetry={reset}
      />
    </PageContainer>
  );
}
