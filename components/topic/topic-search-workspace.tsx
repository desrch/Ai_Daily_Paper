"use client";

import {
  LoaderCircle,
  Search,
  Sparkles,
} from "lucide-react";
import { useRouter } from "next/navigation";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import { NewsSelector } from "@/components/news/news-selector";
import { SelectedNewsPanel } from "@/components/news/selected-news-panel";
import { ErrorState } from "@/components/states/error-state";
import { LoadingState } from "@/components/states/loading-state";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Toast } from "@/components/ui/toast";
import { GenerationSteps } from "@/components/workflow/generation-steps";
import { apiClient, toApiError } from "@/lib/api/client";
import { runGenerationWorkflow } from "@/lib/workflow/generation";
import {
  canGenerateTopicPoster,
  MAX_TOPIC_ARTICLES,
  MIN_TOPIC_ARTICLES,
  moveSelectedArticle,
  toggleSelectedArticle,
} from "@/lib/workflow/selection";
import { cn } from "@/lib/utils";
import type {
  GenerationStage,
  NewsTimeRange,
  SearchNewsItem,
} from "@/types";

type ToastState = {
  message: string;
  variant: "success" | "error" | "info";
};

function chooseDefaultArticles(items: SearchNewsItem[]) {
  const selected: string[] = [];
  const angles = new Set<string>();

  for (const item of items) {
    if (!angles.has(item.angle)) {
      selected.push(item.id);
      angles.add(item.angle);
    }

    if (selected.length === 4) {
      break;
    }
  }

  return selected;
}

export function TopicSearchWorkspace() {
  const router = useRouter();
  const [keyword, setKeyword] = useState("人工智能教育");
  const [timeRange, setTimeRange] =
    useState<NewsTimeRange>("7d");
  const [searchedKeyword, setSearchedKeyword] =
    useState("人工智能教育");
  const [articles, setArticles] = useState<SearchNewsItem[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isSearching, setIsSearching] = useState(true);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationError, setGenerationError] =
    useState<string | null>(null);
  const [currentStage, setCurrentStage] =
    useState<GenerationStage>();
  const [completedStages, setCompletedStages] = useState<
    GenerationStage[]
  >([]);
  const [toast, setToast] = useState<ToastState | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const searchNews = useCallback(
    async (nextKeyword: string, nextTimeRange: NewsTimeRange) => {
      const trimmedKeyword = nextKeyword.trim();

      if (!trimmedKeyword) {
        setToast({
          message: "请输入关键词后再搜索。",
          variant: "error",
        });
        return;
      }

      setIsSearching(true);
      setSearchError(null);

      try {
        const result = await apiClient.searchNews({
          keyword: trimmedKeyword,
          timeRange: nextTimeRange,
        });
        setArticles(result.items);
        setSelectedIds(chooseDefaultArticles(result.items));
        setSearchedKeyword(result.query);
      } catch (error) {
        setSearchError(toApiError(error).message);
      } finally {
        setIsSearching(false);
      }
    },
    [],
  );

  useEffect(() => {
    let active = true;

    apiClient
      .searchNews({
        keyword: "人工智能教育",
        timeRange: "7d",
      })
      .then((result) => {
        if (!active) {
          return;
        }

        setArticles(result.items);
        setSelectedIds(chooseDefaultArticles(result.items));
        setSearchedKeyword(result.query);
        setIsSearching(false);
      })
      .catch((error: unknown) => {
        if (!active) {
          return;
        }

        setSearchError(toApiError(error).message);
        setIsSearching(false);
      });

    return () => {
      active = false;
      abortControllerRef.current?.abort();
    };
  }, []);

  const selectedArticles = useMemo(
    () =>
      selectedIds
        .map((id) => articles.find((article) => article.id === id))
        .filter((article): article is SearchNewsItem => Boolean(article)),
    [articles, selectedIds],
  );

  const distinctAngleCount = useMemo(
    () =>
      new Set(selectedArticles.map((article) => article.angle)).size,
    [selectedArticles],
  );

  function toggleArticle(articleId: string) {
    const isAdding = !selectedIds.includes(articleId);

    if (isAdding && selectedIds.length >= MAX_TOPIC_ARTICLES) {
      setToast({
        message: "专题海报最多选择 5 篇新闻。",
        variant: "info",
      });
      return;
    }

    setSelectedIds((current) =>
      toggleSelectedArticle(current, articleId),
    );
  }

  async function generatePoster() {
    if (!canGenerateTopicPoster(selectedIds) || isGenerating) {
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
          apiClient.generateTopicPoster({
            keyword: searchedKeyword,
            articleIds: selectedIds,
            template: "classic",
          }),
      });

      router.push(`/topic-poster/${poster.id}`);
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
    <div className="space-y-7">
      <Card className="p-5">
        <form
          className="grid gap-4 md:grid-cols-[1fr_12rem_auto]"
          onSubmit={(event) => {
            event.preventDefault();
            void searchNews(keyword, timeRange);
          }}
        >
          <div>
            <Label htmlFor="topic-keyword">搜索关键词</Label>
            <Input
              id="topic-keyword"
              value={keyword}
              maxLength={50}
              onChange={(event) => setKeyword(event.target.value)}
              placeholder="例如：人工智能教育"
              className="mt-2"
            />
          </div>
          <div>
            <Label htmlFor="topic-time-range">时间范围</Label>
            <select
              id="topic-time-range"
              value={timeRange}
              onChange={(event) =>
                setTimeRange(event.target.value as NewsTimeRange)
              }
              className="mt-2 h-10 w-full rounded-md border border-line-strong bg-surface px-3 text-sm text-ink outline-none focus-visible:border-brand focus-visible:ring-2 focus-visible:ring-brand/15"
            >
              <option value="24h">过去 24 小时</option>
              <option value="7d">过去 7 天</option>
              <option value="30d">过去 30 天</option>
            </select>
          </div>
          <Button
            type="submit"
            className="md:self-end"
            disabled={!keyword.trim() || isSearching || isGenerating}
          >
            {isSearching ? (
              <LoaderCircle className="animate-spin" />
            ) : (
              <Search />
            )}
            {isSearching ? "正在搜索…" : "搜索新闻"}
          </Button>
        </form>
      </Card>

      {(isGenerating || completedStages.length > 0) && (
        <GenerationSteps
          currentStage={currentStage}
          completedStages={completedStages}
        />
      )}

      {generationError && (
        <ErrorState
          title="专题海报生成失败"
          description={generationError}
          onRetry={() => void generatePoster()}
        />
      )}

      {isSearching && articles.length === 0 ? (
        <LoadingState
          title="正在搜索候选新闻"
          description="正在按相关度和报道角度整理演示资讯。"
        />
      ) : searchError ? (
        <ErrorState
          title="候选新闻搜索失败"
          description={searchError}
          onRetry={() => void searchNews(keyword, timeRange)}
        />
      ) : (
        <div className="grid items-start gap-7 xl:grid-cols-[minmax(0,1fr)_22rem]">
          <section aria-labelledby="candidate-heading">
            <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
              <div>
                <h2
                  id="candidate-heading"
                  className="font-serif text-2xl font-semibold"
                >
                  候选新闻
                </h2>
                <p className="mt-1 text-sm text-muted-ink">
                  “{searchedKeyword}”共找到 {articles.length} 条演示结果
                </p>
              </div>
              <p className="text-xs leading-5 text-muted-ink">
                请选择 {MIN_TOPIC_ARTICLES}～{MAX_TOPIC_ARTICLES} 篇不同角度的新闻
              </p>
            </div>
            <div className="space-y-3">
              {articles.map((article, index) => (
                <NewsSelector
                  key={article.id}
                  article={article}
                  priority={index === 0}
                  selected={selectedIds.includes(article.id)}
                  disabled={
                    isGenerating ||
                    (selectedIds.length >= MAX_TOPIC_ARTICLES &&
                      !selectedIds.includes(article.id))
                  }
                  onToggle={() => toggleArticle(article.id)}
                />
              ))}
            </div>
          </section>

          <aside className="rounded-lg border border-line bg-paper-deep/55 p-5 xl:sticky xl:top-24">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="font-serif text-xl font-semibold">
                  已选新闻 {selectedIds.length}/{MAX_TOPIC_ARTICLES}
                </p>
                <p className="mt-1 text-xs text-muted-ink">
                  已覆盖 {distinctAngleCount} 个报道角度
                </p>
              </div>
              <Sparkles className="size-5 text-brand" aria-hidden="true" />
            </div>

            <div className="mt-5">
              <SelectedNewsPanel
                articles={selectedArticles}
                onRemove={toggleArticle}
                onMove={(id, direction) =>
                  setSelectedIds((current) =>
                    moveSelectedArticle(current, id, direction),
                  )
                }
              />
            </div>

            <div
              className={cn(
                "mt-5 rounded-md border p-3 text-xs leading-5",
                canGenerateTopicPoster(selectedIds)
                  ? "border-success/30 bg-success/6 text-success"
                  : "border-line bg-surface text-muted-ink",
              )}
              role="status"
            >
              {canGenerateTopicPoster(selectedIds)
                ? "数量符合要求，可以生成专题海报。"
                : `还需选择至少 ${Math.max(
                    0,
                    MIN_TOPIC_ARTICLES - selectedIds.length,
                  )} 篇新闻。`}
            </div>

            <Button
              type="button"
              size="lg"
              className="mt-4 w-full"
              disabled={
                !canGenerateTopicPoster(selectedIds) || isGenerating
              }
              onClick={() => void generatePoster()}
            >
              {isGenerating ? (
                <LoaderCircle className="animate-spin" />
              ) : (
                <Sparkles />
              )}
              {isGenerating ? "正在生成…" : "生成专题海报"}
            </Button>
          </aside>
        </div>
      )}

      {toast && (
        <Toast
          message={toast.message}
          variant={toast.variant}
          onDismiss={() => setToast(null)}
        />
      )}
    </div>
  );
}
