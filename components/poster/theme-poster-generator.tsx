"use client";

import {
  Bot,
  BriefcaseBusiness,
  Clapperboard,
  GraduationCap,
  HeartPulse,
  Laptop,
  LoaderCircle,
  Palette,
  Sparkles,
  Trophy,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";

import { ErrorState } from "@/components/states/error-state";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { GenerationSteps } from "@/components/workflow/generation-steps";
import { apiClient, toApiError } from "@/lib/api/client";
import { runGenerationWorkflow } from "@/lib/workflow/generation";
import { cn } from "@/lib/utils";
import type { GenerationStage } from "@/types";

const themes = [
  { key: "ai", label: "AI 前沿", value: "人工智能", icon: Bot },
  { key: "tech", label: "科技数码", value: "科技数码", icon: Laptop },
  {
    key: "business",
    label: "商业财经",
    value: "商业财经",
    icon: BriefcaseBusiness,
  },
  { key: "sports", label: "体育赛事", value: "体育赛事", icon: Trophy },
  {
    key: "movies",
    label: "电影娱乐",
    value: "电影娱乐",
    icon: Clapperboard,
  },
  {
    key: "campus",
    label: "校园生活",
    value: "校园生活",
    icon: GraduationCap,
  },
  {
    key: "health",
    label: "健康生活",
    value: "健康生活",
    icon: HeartPulse,
  },
  { key: "custom", label: "自定义主题", value: "", icon: Sparkles },
] as const;

const articleCounts = [3, 4, 5] as const;

export function ThemePosterGenerator() {
  const router = useRouter();
  const [selectedThemeKey, setSelectedThemeKey] = useState("");
  const [customTheme, setCustomTheme] = useState("");
  const [summaryLength, setSummaryLength] =
    useState<"brief" | "standard">("standard");
  const [articleCount, setArticleCount] =
    useState<(typeof articleCounts)[number]>(4);
  const [template, setTemplate] =
    useState<"classic" | "modern">("classic");
  const [currentStage, setCurrentStage] =
    useState<GenerationStage>();
  const [completedStages, setCompletedStages] = useState<
    GenerationStage[]
  >([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationError, setGenerationError] =
    useState<string | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  useEffect(
    () => () => {
      abortControllerRef.current?.abort();
    },
    [],
  );

  const selectedTheme = useMemo(() => {
    if (selectedThemeKey === "custom") {
      return customTheme.trim();
    }

    return (
      themes.find((theme) => theme.key === selectedThemeKey)?.value ?? ""
    );
  }, [customTheme, selectedThemeKey]);

  async function generatePoster() {
    if (!selectedTheme || isGenerating) {
      return;
    }

    const controller = new AbortController();
    abortControllerRef.current = controller;
    setIsGenerating(true);
    setGenerationError(null);
    setCompletedStages([]);

    try {
      const poster = await runGenerationWorkflow({
        signal: controller.signal,
        onProgress: (progress) => {
          setCurrentStage(progress.currentStage);
          setCompletedStages(progress.completedStages);
        },
        operation: () =>
          apiClient.generateThemePoster({
            theme: selectedTheme,
            articleCount,
            summaryLength,
            template,
          }),
      });

      router.push(`/theme-poster/${poster.id}`);
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") {
        return;
      }

      setGenerationError(toApiError(error).message);
      setCurrentStage(undefined);
    } finally {
      setIsGenerating(false);
      abortControllerRef.current = null;
    }
  }

  return (
    <div className="space-y-8">
      <GenerationSteps
        currentStage={currentStage}
        completedStages={completedStages}
      />

      {generationError && (
        <div className="space-y-3">
          <ErrorState
            title="主题海报生成失败"
            description={generationError}
            onRetry={() => void generatePoster()}
          />
          <Button
            type="button"
            variant="secondary"
            className="w-full"
            onClick={() => router.push("/theme-poster/demo-theme")}
          >
            使用演示数据继续
          </Button>
        </div>
      )}

      <fieldset disabled={isGenerating}>
        <legend className="font-serif text-2xl font-semibold">
          1. 选择关注主题
        </legend>
        <p className="mt-2 text-sm leading-6 text-muted-ink">
          选择一个方向，系统会汇总 3～5 篇代表新闻。
        </p>
        <div className="mt-5 grid grid-cols-2 gap-3 md:grid-cols-4">
          {themes.map((theme) => {
            const Icon = theme.icon;
            const isSelected = selectedThemeKey === theme.key;

            return (
              <button
                key={theme.key}
                type="button"
                aria-pressed={isSelected}
                onClick={() => setSelectedThemeKey(theme.key)}
                className={cn(
                  "flex min-h-28 flex-col items-start justify-between rounded-lg border border-line bg-surface p-4 text-left shadow-card transition-[border-color,transform,box-shadow] hover:-translate-y-0.5 hover:border-brand/45 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/25",
                  isSelected && "border-brand bg-brand/5 ring-1 ring-brand/20",
                )}
              >
                <Icon
                  className={cn(
                    "size-6 text-muted-ink",
                    isSelected && "text-brand",
                  )}
                  aria-hidden="true"
                />
                <span className="mt-4 text-sm font-semibold">
                  {theme.label}
                </span>
              </button>
            );
          })}
        </div>
        {selectedThemeKey === "custom" && (
          <div className="mt-4 max-w-xl">
            <Label htmlFor="custom-theme">自定义主题</Label>
            <Input
              id="custom-theme"
              value={customTheme}
              maxLength={50}
              placeholder="例如：低空经济、城市更新"
              onChange={(event) => setCustomTheme(event.target.value)}
              className="mt-2"
            />
          </div>
        )}
      </fieldset>

      <div className="grid gap-5 lg:grid-cols-3">
        <fieldset
          disabled={isGenerating}
          className="rounded-lg border border-line bg-surface p-5 shadow-card"
        >
          <legend className="px-1 font-serif text-lg font-semibold">
            2. 摘要长度
          </legend>
          <div className="mt-3 grid grid-cols-2 gap-2">
            {(
              [
                ["brief", "精简"],
                ["standard", "标准"],
              ] as const
            ).map(([value, label]) => (
              <button
                key={value}
                type="button"
                aria-pressed={summaryLength === value}
                onClick={() => setSummaryLength(value)}
                className={cn(
                  "rounded-md border border-line px-4 py-3 text-sm font-semibold",
                  summaryLength === value
                    ? "border-brand bg-brand text-white"
                    : "bg-surface hover:border-brand",
                )}
              >
                {label}
              </button>
            ))}
          </div>
        </fieldset>

        <fieldset
          disabled={isGenerating}
          className="rounded-lg border border-line bg-surface p-5 shadow-card"
        >
          <legend className="px-1 font-serif text-lg font-semibold">
            3. 新闻数量
          </legend>
          <div className="mt-3 grid grid-cols-3 gap-2">
            {articleCounts.map((count) => (
              <button
                key={count}
                type="button"
                aria-pressed={articleCount === count}
                onClick={() => setArticleCount(count)}
                className={cn(
                  "rounded-md border border-line px-4 py-3 text-sm font-semibold",
                  articleCount === count
                    ? "border-brand bg-brand text-white"
                    : "bg-surface hover:border-brand",
                )}
              >
                {count} 篇
              </button>
            ))}
          </div>
        </fieldset>

        <fieldset
          disabled={isGenerating}
          className="rounded-lg border border-line bg-surface p-5 shadow-card"
        >
          <legend className="px-1 font-serif text-lg font-semibold">
            4. 海报风格
          </legend>
          <div className="mt-3 grid grid-cols-2 gap-2">
            {(
              [
                ["classic", "经典报刊"],
                ["modern", "现代简约"],
              ] as const
            ).map(([value, label]) => (
              <button
                key={value}
                type="button"
                aria-pressed={template === value}
                onClick={() => setTemplate(value)}
                className={cn(
                  "rounded-md border border-line px-3 py-3 text-sm font-semibold",
                  template === value
                    ? "border-brand bg-brand text-white"
                    : "bg-surface hover:border-brand",
                )}
              >
                {label}
              </button>
            ))}
          </div>
        </fieldset>
      </div>

      <Card className="flex flex-col gap-5 p-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="font-serif text-xl font-semibold">
            {selectedTheme
              ? `准备生成：${selectedTheme}`
              : "请选择一个主题"}
          </p>
          <p className="mt-1 text-sm text-muted-ink">
            {articleCount} 篇新闻 ·{" "}
            {summaryLength === "brief" ? "精简摘要" : "标准摘要"} ·{" "}
            {template === "classic" ? "经典报刊" : "现代简约"}
          </p>
        </div>
        <Button
          type="button"
          size="lg"
          disabled={!selectedTheme || isGenerating}
          onClick={() => void generatePoster()}
        >
          {isGenerating ? (
            <LoaderCircle className="animate-spin" />
          ) : (
            <Palette />
          )}
          {isGenerating ? "正在生成海报…" : "生成主题海报"}
        </Button>
      </Card>
    </div>
  );
}
