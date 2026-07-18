"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { cn } from "@/lib/utils";

export const siteNavigation = [
  { href: "/", label: "首页" },
  { href: "/dashboard", label: "每日日报" },
  { href: "/theme-poster", label: "主题海报" },
  { href: "/topic-search", label: "专题搜索" },
  { href: "/creations", label: "历史作品" },
] as const;

function isActivePath(pathname: string, href: string) {
  if (href === "/") {
    return pathname === href;
  }

  return pathname === href || pathname.startsWith(`${href}/`);
}

export function DesktopNavigation() {
  const pathname = usePathname();

  return (
    <nav className="hidden items-stretch self-stretch lg:flex" aria-label="主导航">
      {siteNavigation.map((item) => {
        const active = isActivePath(pathname, item.href);

        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "relative flex items-center px-4 text-sm font-medium text-muted-ink transition-colors hover:text-brand",
              active && "text-brand",
            )}
          >
            {item.label}
            <span
              className={cn(
                "absolute inset-x-4 bottom-0 h-0.5 origin-center scale-x-0 bg-brand transition-transform",
                active && "scale-x-100",
              )}
              aria-hidden="true"
            />
          </Link>
        );
      })}
    </nav>
  );
}
