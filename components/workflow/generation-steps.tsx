import { Check, LoaderCircle } from "lucide-react";

import { generationSteps } from "@/lib/workflow/generation";
import { cn } from "@/lib/utils";
import type { GenerationStage } from "@/types";

export function GenerationSteps({
  currentStage,
  completedStages,
  compact = false,
}: {
  currentStage?: GenerationStage;
  completedStages: GenerationStage[];
  compact?: boolean;
}) {
  return (
    <ol
      className={cn(
        "grid gap-2",
        !compact && "sm:grid-cols-2 xl:grid-cols-4",
      )}
      aria-label="日报生成进度"
    >
      {generationSteps.map((step, index) => {
        const isCompleted = completedStages.includes(step.id);
        const isCurrent = currentStage === step.id && !isCompleted;

        return (
          <li
            key={step.id}
            className={cn(
              "flex items-start gap-3 rounded-md border border-line bg-surface p-3",
              isCurrent && "border-brand bg-brand/5",
              isCompleted && "border-success/35",
            )}
            aria-current={isCurrent ? "step" : undefined}
          >
            <span
              className={cn(
                "grid size-6 shrink-0 place-items-center rounded-full border border-line-strong text-xs font-semibold text-muted-ink",
                isCurrent && "border-brand bg-brand text-white",
                isCompleted && "border-success bg-success text-white",
              )}
            >
              {isCompleted ? (
                <Check className="size-3.5" aria-hidden="true" />
              ) : isCurrent ? (
                <LoaderCircle
                  className="size-3.5 animate-spin"
                  aria-hidden="true"
                />
              ) : (
                index + 1
              )}
            </span>
            <span>
              <span className="block text-sm font-semibold text-ink">
                {step.title}
              </span>
              {!compact && (
                <span className="mt-0.5 block text-xs leading-5 text-muted-ink">
                  {step.description}
                </span>
              )}
            </span>
          </li>
        );
      })}
    </ol>
  );
}
