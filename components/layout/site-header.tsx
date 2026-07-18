import { UserRound } from "lucide-react";
import Link from "next/link";

import { Logo } from "@/components/brand/logo";
import { Button } from "@/components/ui/button";

import { MobileNav } from "./mobile-nav";
import { DesktopNavigation } from "./navigation";
import { PageContainer } from "./page-container";

export function SiteHeader() {
  return (
    <header
      className="sticky top-0 z-50 border-b border-line bg-surface/95 backdrop-blur-sm"
      data-print-hidden
    >
      <PageContainer className="relative flex h-16 items-center justify-between gap-6">
        <Logo />
        <DesktopNavigation />
        <div className="ml-auto hidden lg:block">
          <Button asChild variant="ghost" size="sm">
            <Link href="/dashboard">
              <UserRound />
              进入主页
            </Link>
          </Button>
        </div>
        <MobileNav />
      </PageContainer>
    </header>
  );
}
