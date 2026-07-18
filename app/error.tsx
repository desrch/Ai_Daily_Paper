"use client";

import { PageContainer } from "@/components/layout/page-container";
import { ErrorState } from "@/components/states/error-state";

export default function ErrorPage({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <PageContainer className="py-12">
      <ErrorState
        title="页面暂时无法显示"
        description="本地演示发生了意外错误，请重新尝试。"
        onRetry={reset}
      />
    </PageContainer>
  );
}
