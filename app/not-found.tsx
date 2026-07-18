import { PageContainer } from "@/components/layout/page-container";
import { EmptyState } from "@/components/states/empty-state";

export default function NotFound() {
  return (
    <PageContainer className="py-12">
      <EmptyState
        title="这张版面还没有准备好"
        description="页面可能仍在后续开发阶段，或访问地址不正确。"
        action={{ href: "/", label: "返回首页" }}
      />
    </PageContainer>
  );
}
