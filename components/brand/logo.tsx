import Link from "next/link";

import { cn } from "@/lib/utils";

type LogoProps = {
  className?: string;
  compact?: boolean;
};

export function Logo({ className, compact = false }: LogoProps) {
  return (
    <Link
      href="/"
      className={cn(
        "inline-flex items-baseline gap-2 whitespace-nowrap",
        className,
      )}
      aria-label="今日报纸 TodayPaper 首页"
    >
      <span className="font-serif text-2xl font-bold tracking-[0.08em] text-brand sm:text-[1.7rem]">
        今日报纸
      </span>
      {!compact && (
        <span className="font-brand text-sm tracking-tight text-ink">
          TodayPaper
        </span>
      )}
    </Link>
  );
}
