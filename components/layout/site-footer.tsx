import Link from "next/link";

import { Logo } from "@/components/brand/logo";

import { PageContainer } from "./page-container";

export function SiteFooter() {
  return (
    <footer className="border-t border-line bg-surface" data-print-hidden>
      <PageContainer className="grid gap-8 py-10 sm:grid-cols-[1fr_auto] sm:items-end">
        <div>
          <Logo />
          <p className="mt-3 max-w-md text-sm leading-6 text-muted-ink">
            AI 为你整理世界。当前内容为演示数据，不代表实时新闻。
          </p>
        </div>
        <nav
          className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-muted-ink"
          aria-label="页脚导航"
        >
          <Link className="hover:text-brand" href="/">
            首页
          </Link>
          <Link className="hover:text-brand" href="/demo/home">
            演示模式
          </Link>
          <Link className="hover:text-brand" href="/creations">
            历史作品
          </Link>
        </nav>
        <p className="text-xs text-muted-ink sm:col-span-2">
          © 2026 TodayPaper. 保留所有权利。
        </p>
      </PageContainer>
    </footer>
  );
}
