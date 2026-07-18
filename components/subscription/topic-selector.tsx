import { Check, Plus } from "lucide-react";
import type { LucideIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export type TopicOption = {
  label: string;
  description: string;
  icon: LucideIcon;
  extra?: boolean;
};

export function TopicSelector({
  options,
  selectedTopics,
  showMore,
  onShowMore,
  onToggle,
  error,
}: {
  options: TopicOption[];
  selectedTopics: string[];
  showMore: boolean;
  onShowMore: () => void;
  onToggle: (topic: string) => void;
  error?: string;
}) {
  const visibleOptions = options.filter(
    (option) => !option.extra || showMore,
  );

  return (
    <fieldset aria-describedby={error ? "topics-error" : undefined}>
      <legend className="text-sm font-semibold text-ink">
        选择你关心的方向
        <span className="ml-2 text-xs font-normal text-muted-ink">
          可多选
        </span>
      </legend>
      <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {visibleOptions.map(({ label, description, icon: Icon }) => {
          const selected = selectedTopics.includes(label);

          return (
            <button
              key={label}
              type="button"
              aria-pressed={selected}
              onClick={() => onToggle(label)}
              className={cn(
                "relative flex min-h-24 items-start gap-3 rounded-md border border-line-strong bg-surface p-4 text-left transition-[border-color,background-color,transform] hover:-translate-y-0.5 hover:border-brand/60",
                selected && "border-brand bg-brand/5",
              )}
            >
              <span
                className={cn(
                  "grid size-10 shrink-0 place-items-center rounded-md bg-soft text-muted-ink",
                  selected && "bg-brand text-white",
                )}
              >
                <Icon className="size-5" aria-hidden="true" />
              </span>
              <span>
                <span className="block font-semibold text-ink">{label}</span>
                <span className="mt-1 block text-xs leading-5 text-muted-ink">
                  {description}
                </span>
              </span>
              {selected && (
                <span className="absolute top-3 right-3 grid size-5 place-items-center rounded-full bg-brand text-white">
                  <Check className="size-3.5" aria-hidden="true" />
                </span>
              )}
            </button>
          );
        })}
        {!showMore && options.some((option) => option.extra) && (
          <Button
            type="button"
            variant="secondary"
            className="min-h-24 border-dashed"
            onClick={onShowMore}
          >
            <Plus />
            添加更多方向
          </Button>
        )}
      </div>
      {error && (
        <p id="topics-error" className="mt-2 text-sm text-danger" role="alert">
          {error}
        </p>
      )}
    </fieldset>
  );
}
