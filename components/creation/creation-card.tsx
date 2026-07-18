import { format, parseISO } from "date-fns";
import { zhCN } from "date-fns/locale";
import { ArrowUpRight } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { Creation, CreationType } from "@/types";

const typeLabels: Record<CreationType, string> = {
  daily_issue: "每日日报",
  theme_poster: "主题海报",
  topic_poster: "专题海报",
};

const typeVariants = {
  daily_issue: "default",
  theme_poster: "info",
  topic_poster: "success",
} as const;

export function CreationCard({
  creation,
  priority = false,
}: {
  creation: Creation;
  priority?: boolean;
}) {
  return (
    <Card className="group overflow-hidden transition-[transform,box-shadow,border-color] hover:-translate-y-1 hover:border-brand/40 hover:shadow-paper">
      <Link
        href={creation.href}
        className="relative block aspect-[3/4] overflow-hidden border-b border-line bg-soft"
        aria-label={`查看${creation.title}`}
      >
        <Image
          src={creation.coverImageUrl}
          alt=""
          fill
          loading={priority ? "eager" : "lazy"}
          fetchPriority={priority ? "high" : "auto"}
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
          className="object-cover transition-transform duration-300 group-hover:scale-[1.02]"
        />
      </Link>
      <CardHeader className="pb-3">
        <Badge variant={typeVariants[creation.type]}>
          {typeLabels[creation.type]}
        </Badge>
        <CardTitle className="mt-2 text-xl">{creation.title}</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="line-clamp-2 text-sm leading-6 text-muted-ink">
          {creation.description}
        </p>
        <p className="mt-3 text-xs text-muted-ink">
          生成时间：
          {format(parseISO(creation.createdAt), "yyyy-MM-dd HH:mm", {
            locale: zhCN,
          })}
        </p>
      </CardContent>
      <CardFooter>
        <Button asChild variant="outline" className="w-full">
          <Link href={creation.href}>
            查看作品
            <ArrowUpRight />
          </Link>
        </Button>
      </CardFooter>
    </Card>
  );
}
