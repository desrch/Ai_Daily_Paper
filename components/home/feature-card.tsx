import type { LucideIcon } from "lucide-react";
import { ArrowUpRight } from "lucide-react";
import Link from "next/link";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

type FeatureCardProps = {
  href: string;
  icon: LucideIcon;
  index: string;
  title: string;
  description: string;
  preview: "daily" | "theme" | "topic";
};

const previewStyles = {
  daily: {
    label: "今日报纸",
    detail: "AI · 科技 · 商业",
    className: "text-brand",
  },
  theme: {
    label: "人工智能",
    detail: "THEME EDITION",
    className: "bg-ink text-paper",
  },
  topic: {
    label: "专题聚焦",
    detail: "四种角度 · 一张长图",
    className: "bg-[#183b34] text-paper",
  },
} as const;

export function FeatureCard({
  href,
  icon: Icon,
  index,
  title,
  description,
  preview,
}: FeatureCardProps) {
  const currentPreview = previewStyles[preview];

  return (
    <Link href={href} className="group block rounded-lg">
      <Card className="h-full overflow-hidden transition-[border-color,transform,box-shadow] duration-200 group-hover:-translate-y-1 group-hover:border-brand/45 group-hover:shadow-paper">
        <div className="paper-grain m-4 mb-0 border border-line bg-paper p-4">
          <div
            className={`grid min-h-40 place-items-center border border-current/20 p-4 text-center ${currentPreview.className}`}
          >
            <div>
              <p className="font-serif text-2xl font-bold tracking-[0.08em]">
                {currentPreview.label}
              </p>
              <span className="mx-auto my-3 block h-px w-16 bg-current/55" />
              <p className="text-[0.63rem] tracking-[0.18em] opacity-75">
                {currentPreview.detail}
              </p>
            </div>
          </div>
        </div>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <span className="font-brand text-sm text-brand">{index}</span>
            <Icon className="size-5 text-brand" aria-hidden="true" />
          </div>
          <CardTitle>{title}</CardTitle>
        </CardHeader>
        <CardContent className="flex items-end justify-between gap-5">
          <CardDescription>{description}</CardDescription>
          <ArrowUpRight
            className="size-5 shrink-0 text-muted-ink transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-brand"
            aria-hidden="true"
          />
        </CardContent>
      </Card>
    </Link>
  );
}
