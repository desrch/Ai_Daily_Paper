"use client";

import { CheckCircle2, ListChecks } from "lucide-react";
import { useRef } from "react";

import { DemoModeBadge } from "@/components/demo/demo-mode-badge";
import { ExportActions } from "@/components/poster/export-actions";
import { ThemePoster } from "@/components/poster/theme-poster";
import { GenerationSteps } from "@/components/workflow/generation-steps";
import { generationSteps } from "@/lib/workflow/generation";
import type { ThemePosterContent } from "@/types";

export function ThemePosterResultView({
  poster,
  isSaved,
  demoMode = false,
  onSave,
}: {
  poster: ThemePosterContent;
  isSaved: boolean;
  demoMode?: boolean;
  onSave?: () => Promise<boolean>;
}) {
  const posterRef = useRef<HTMLDivElement>(null);

  return (
    <div className="space-y-6">
      <div data-print-hidden>
        <GenerationSteps
          currentStage="layout"
          completedStages={generationSteps.map((step) => step.id)}
        />
      </div>

      <div className="grid items-start gap-7 xl:grid-cols-[minmax(0,1fr)_21rem]">
        <ThemePoster poster={poster} posterRef={posterRef} />

        <aside
          className="space-y-5 xl:sticky xl:top-24"
          data-print-hidden
        >
          <div className="rounded-lg border border-success/30 bg-surface p-5 shadow-card">
            <div className="flex items-center gap-2">
              <CheckCircle2
                className="size-5 text-success"
                aria-hidden="true"
              />
              <p className="font-serif text-lg font-semibold">海报已完成</p>
            </div>
            <p className="mt-2 text-sm leading-6 text-muted-ink">
              已完成新闻筛选、摘要生成和纵向海报排版。
            </p>
            {demoMode && <DemoModeBadge className="mt-3" />}
          </div>

          <div className="rounded-lg border border-line bg-surface p-5 shadow-card">
            <div className="flex items-center gap-2">
              <ListChecks className="size-5 text-brand" aria-hidden="true" />
              <h2 className="font-serif text-lg font-semibold">所选新闻</h2>
            </div>
            <ol className="mt-4 space-y-3">
              {poster.articles.map((article, index) => (
                <li
                  key={article.id}
                  className="flex gap-3 border-t border-line pt-3 first:border-0 first:pt-0"
                >
                  <span className="font-brand text-sm font-bold text-brand">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <div>
                    <p className="line-clamp-2 text-sm leading-5 font-semibold">
                      {article.title}
                    </p>
                    <p className="mt-1 text-xs text-muted-ink">
                      {article.source}
                    </p>
                  </div>
                </li>
              ))}
            </ol>
          </div>

          <ExportActions
            posterRef={posterRef}
            topic={poster.theme}
            typeLabel="主题海报"
            createdAt={poster.createdAt}
            isSaved={isSaved}
            regenerateHref="/theme-poster"
            onSave={onSave ?? (async () => true)}
            saveSuccessMessage={
              demoMode
                ? "演示操作已完成；固定演示不会写入浏览器历史作品。"
                : undefined
            }
          />
        </aside>
      </div>
    </div>
  );
}
