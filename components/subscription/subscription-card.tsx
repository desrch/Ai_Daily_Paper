import {
  Bot,
  BriefcaseBusiness,
  Laptop,
  Power,
  Trash2,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { Subscription } from "@/types";

const topicIcons: Record<string, LucideIcon> = {
  人工智能: Bot,
  科技数码: Laptop,
  商业财经: BriefcaseBusiness,
};

export function SubscriptionCard({
  subscription,
  onToggle,
  onDelete,
}: {
  subscription: Subscription;
  onToggle: () => void;
  onDelete: () => void;
}) {
  const Icon = topicIcons[subscription.topic] ?? Power;

  return (
    <article
      className={cn(
        "flex flex-col gap-4 rounded-lg border border-line bg-surface p-5 shadow-card sm:flex-row sm:items-center",
        !subscription.enabled && "bg-soft/70 opacity-75",
      )}
    >
      <span
        className={cn(
          "grid size-12 shrink-0 place-items-center rounded-md bg-brand text-white",
          subscription.topic === "科技数码" && "bg-info",
          subscription.topic === "商业财经" && "bg-success",
          !subscription.enabled && "bg-muted-ink",
        )}
      >
        <Icon className="size-6" aria-hidden="true" />
      </span>

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <h2 className="font-serif text-xl font-semibold">
            {subscription.topic}
          </h2>
          <Badge variant={subscription.enabled ? "success" : "neutral"}>
            {subscription.enabled ? "已启用" : "已暂停"}
          </Badge>
        </div>
        <p className="mt-2 text-xs leading-5 text-muted-ink">
          关键词：
          {subscription.keywords.length > 0
            ? subscription.keywords.join("、")
            : "使用主题默认关键词"}
        </p>
        <p className="mt-1 text-xs text-muted-ink">
          今日更新 {subscription.todayUpdateCount} 篇
        </p>
      </div>

      <div className="flex items-center gap-2 sm:pl-4">
        <button
          type="button"
          role="switch"
          aria-label={`${subscription.topic}订阅`}
          aria-checked={subscription.enabled}
          onClick={onToggle}
          className={cn(
            "relative h-7 w-12 shrink-0 rounded-full bg-line-strong transition-colors",
            subscription.enabled && "bg-info",
          )}
        >
          <span
            className={cn(
              "absolute top-1 left-1 size-5 rounded-full bg-white shadow-sm transition-transform",
              subscription.enabled && "translate-x-5",
            )}
          />
        </button>
        <Button
          type="button"
          variant="danger"
          size="sm"
          aria-label={`删除${subscription.topic}订阅`}
          onClick={onDelete}
        >
          <Trash2 />
          删除
        </Button>
      </div>
    </article>
  );
}
