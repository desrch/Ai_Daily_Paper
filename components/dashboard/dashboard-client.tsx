"use client";

import {
  CalendarClock,
  CheckCircle2,
  Clock3,
  Newspaper,
  RotateCcw,
  Settings2,
  Sparkles,
} from "lucide-react";
import Link from "next/link";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import { DailyIssueCard } from "@/components/dashboard/daily-issue-card";
import { DemoModeBadge } from "@/components/demo/demo-mode-badge";
import { ErrorState } from "@/components/states/error-state";
import { LoadingState } from "@/components/states/loading-state";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Toast } from "@/components/ui/toast";
import { GenerationSteps } from "@/components/workflow/generation-steps";
import { apiClient, toApiError } from "@/lib/api/client";
import {
  MOCK_DELIVERY_TIME,
  MOCK_ISSUE_DATE,
  MOCK_USER_ID,
} from "@/lib/mock/constants";
import {
  runGenerationWorkflow,
  type GenerationProgress,
} from "@/lib/workflow/generation";
import type {
  DailyIssue,
  SubscriptionBundle,
} from "@/types";

type ToastState = {
  message: string;
  variant: "success" | "error" | "info";
};

const initialProgress: GenerationProgress = {
  currentStage: "fetching",
  completedStages: [],
};

export function DashboardClient({
  demoData,
  demoMode = false,
}: {
  demoData?: {
    subscriptions: SubscriptionBundle;
    issues: DailyIssue[];
  };
  demoMode?: boolean;
}) {
  const [subscriptions, setSubscriptions] =
    useState<SubscriptionBundle | null>(demoData?.subscriptions ?? null);
  const [issues, setIssues] = useState<DailyIssue[]>(
    demoData?.issues ?? [],
  );
  const [isLoading, setIsLoading] = useState(!demoData);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationError, setGenerationError] = useState<string | null>(
    null,
  );
  const [progress, setProgress] =
    useState<GenerationProgress>(initialProgress);
  const [toast, setToast] = useState<ToastState | null>(null);
  const generationController = useRef<AbortController | null>(null);

  const loadDashboard = useCallback(async () => {
    if (demoData) {
      setSubscriptions(demoData.subscriptions);
      setIssues(demoData.issues);
      setLoadError(null);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setLoadError(null);

    try {
      const [subscriptionData, issueData] = await Promise.all([
        apiClient.getSubscriptions(),
        apiClient.getDailyIssues(),
      ]);
      setSubscriptions(subscriptionData);
      setIssues(issueData);
    } catch (error) {
      setLoadError(toApiError(error).message);
    } finally {
      setIsLoading(false);
    }
  }, [demoData]);

  useEffect(() => {
    if (demoData) {
      return () => {
        generationController.current?.abort();
      };
    }

    let active = true;

    Promise.all([apiClient.getSubscriptions(), apiClient.getDailyIssues()])
      .then(([subscriptionData, issueData]) => {
        if (!active) {
          return;
        }

        setSubscriptions(subscriptionData);
        setIssues(issueData);
        setIsLoading(false);
      })
      .catch((error: unknown) => {
        if (!active) {
          return;
        }

        setLoadError(toApiError(error).message);
        setIsLoading(false);
      });

    return () => {
      active = false;
      generationController.current?.abort();
    };
  }, [demoData]);

  const todayIssue = useMemo(
    () =>
      issues.find(
        (issue) =>
          (demoMode || issue.userId === MOCK_USER_ID) &&
          issue.issueDate === MOCK_ISSUE_DATE,
      ),
    [demoMode, issues],
  );
  const historicalIssues = useMemo(
    () => issues.filter((issue) => issue.id !== todayIssue?.id),
    [issues, todayIssue?.id],
  );
  const enabledTopics =
    subscriptions?.subscriptions
      .filter((subscription) => subscription.enabled)
      .map((subscription) => subscription.topic) ?? [];

  async function simulateDelivery() {
    if (demoMode) {
      setToast({
        message: "当前为固定演示模式，页面不会写入浏览器数据。",
        variant: "info",
      });
      return;
    }

    if (todayIssue) {
      setToast({
        message: "今日份日报已生成，可直接查看完整内容。",
        variant: "info",
      });
      return;
    }

    generationController.current?.abort();
    const controller = new AbortController();
    generationController.current = controller;
    setIsGenerating(true);
    setGenerationError(null);
    setProgress(initialProgress);

    try {
      const result = await runGenerationWorkflow({
        signal: controller.signal,
        onProgress: setProgress,
        operation: () =>
          apiClient.simulateDailyDelivery({
            userId: MOCK_USER_ID,
            issueDate: MOCK_ISSUE_DATE,
          }),
      });

      setIssues((currentIssues) => [
        result.issue,
        ...currentIssues.filter((issue) => issue.id !== result.issue.id),
      ]);
      setToast({
        message: result.message,
        variant: result.status === "partial" ? "info" : "success",
      });
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") {
        return;
      }

      const apiError = toApiError(error);
      setGenerationError(apiError.message);
      setToast({
        message: apiError.message,
        variant: "error",
      });
    } finally {
      if (!controller.signal.aborted) {
        setIsGenerating(false);
      }
    }
  }

  if (isLoading) {
    return (
      <LoadingState
        title="正在打开日报收件箱"
        description="正在读取订阅和历史日报。"
      />
    );
  }

  if (loadError) {
    return (
      <ErrorState
        title="无法打开日报收件箱"
        description={loadError}
        onRetry={() => void loadDashboard()}
      />
    );
  }

  return (
    <>
      <div className="grid gap-5 lg:grid-cols-[1fr_auto] lg:items-start">
        <div>
          <div className="flex flex-wrap items-center gap-3">
            <p className="text-xs font-semibold tracking-[0.22em] text-brand uppercase">
              Morning Edition
            </p>
            {demoMode && <DemoModeBadge />}
          </div>
          <h1 className="mt-3 font-serif text-4xl font-semibold tracking-tight sm:text-5xl">
            {todayIssue
              ? "早上好，今日报纸已送达"
              : "早上好，准备生成今日报纸"}
          </h1>
          <p className="mt-4 text-sm leading-7 text-muted-ink">
            {todayIssue
              ? "你的专属日报已经完成，祝你有美好的一天。"
              : "订阅设置已就绪，点击模拟投递即可生成今天的演示日报。"}
          </p>
        </div>
        <Card className="min-w-64">
          <CardContent className="flex items-start gap-3 p-4">
            <span
              className={`grid size-9 shrink-0 place-items-center rounded-full ${
                todayIssue
                  ? "bg-success/10 text-success"
                  : "bg-soft text-muted-ink"
              }`}
            >
              {todayIssue ? (
                <CheckCircle2 className="size-5" aria-hidden="true" />
              ) : (
                <Clock3 className="size-5" aria-hidden="true" />
              )}
            </span>
            <div>
              <p className="text-sm font-semibold">
                {todayIssue ? "已送达" : "等待投递"}
              </p>
              <p className="mt-1 text-xs text-muted-ink">
                今天 {MOCK_DELIVERY_TIME}
              </p>
              <p className="mt-1 text-xs text-muted-ink">
                {subscriptions?.deliverySettings.email || "未设置邮箱"}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {isGenerating && (
        <section className="mt-8 rounded-lg border border-brand/30 bg-brand/5 p-4 sm:p-5">
          <div className="mb-4 flex items-center gap-2">
            <Sparkles className="size-5 text-brand" aria-hidden="true" />
            <h2 className="font-serif text-xl font-semibold">
              正在生成今日份日报
            </h2>
          </div>
          <GenerationSteps
            currentStage={progress.currentStage}
            completedStages={progress.completedStages}
          />
        </section>
      )}

      {generationError && !isGenerating && (
        <section className="mt-8 rounded-lg border border-danger/35 bg-surface p-5">
          <p className="font-semibold text-danger">本次生成未完成</p>
          <p className="mt-2 text-sm text-muted-ink">{generationError}</p>
          <Button
            type="button"
            variant="secondary"
            className="mt-4"
            onClick={() => void simulateDelivery()}
          >
            <RotateCcw />
            重试生成
          </Button>
        </section>
      )}

      <div className="mt-8 grid gap-6 xl:grid-cols-[minmax(0,1fr)_22rem]">
        <DailyIssueCard
          issue={todayIssue}
          href={demoMode ? "/demo/newspaper" : undefined}
        />

        <aside className="space-y-5">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2 text-info">
                <Sparkles className="size-5" aria-hidden="true" />
                <CardTitle className="text-lg">AI 为你简报</CardTitle>
              </div>
              <CardDescription>
                {todayIssue
                  ? todayIssue.dailyBriefing
                  : "生成日报后，这里会展示今日事件之间的联系、趋势与关注重点。"}
              </CardDescription>
            </CardHeader>
            {todayIssue && (
              <CardContent>
                <ul className="space-y-3 text-sm leading-6 text-muted-ink">
                  {todayIssue.watchNext.slice(0, 3).map((item) => (
                    <li key={item} className="flex gap-2">
                      <span className="mt-2 size-1.5 shrink-0 rounded-full bg-info" />
                      {item}
                    </li>
                  ))}
                </ul>
              </CardContent>
            )}
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">我的订阅</CardTitle>
              <CardDescription>当前启用的演示关注方向</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-2">
              {enabledTopics.map((topic) => (
                <Badge key={topic}>{topic}</Badge>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardContent className="space-y-4 p-5">
              <div className="flex items-start gap-3">
                <CalendarClock
                  className="mt-0.5 size-5 text-brand"
                  aria-hidden="true"
                />
                <div>
                  <p className="text-sm font-semibold">下一次投递</p>
                  <p className="mt-1 text-xs text-muted-ink">
                    明日 {MOCK_DELIVERY_TIME}
                  </p>
                </div>
              </div>
              <Button
                type="button"
                className="w-full"
                disabled={isGenerating}
                onClick={() => void simulateDelivery()}
              >
                <Clock3 />
                {isGenerating
                  ? "正在生成…"
                  : demoMode
                    ? "查看固定投递说明"
                    : "模拟每日 8 点投递"}
              </Button>
              <Button asChild variant="secondary" className="w-full">
                <Link href="/subscriptions">
                  <Settings2 />
                  管理订阅
                </Link>
              </Button>
            </CardContent>
          </Card>
        </aside>
      </div>

      <section className="mt-12 border-t border-line pt-8">
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="text-xs font-semibold tracking-[0.2em] text-brand uppercase">
              Archive
            </p>
            <h2 className="mt-2 font-serif text-3xl font-semibold">历史日报</h2>
          </div>
          <Link
            href="/creations"
            className="text-sm font-medium text-brand hover:underline"
          >
            查看全部
          </Link>
        </div>
        {historicalIssues.length > 0 ? (
          <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {historicalIssues.slice(0, 3).map((issue) => (
              <Link
                key={issue.id}
                href={
                  demoMode ? "/demo/newspaper" : `/newspaper/${issue.id}`
                }
                className="group rounded-md border border-line bg-surface p-4 shadow-card transition-transform hover:-translate-y-0.5"
              >
                <Newspaper
                  className="size-5 text-brand"
                  aria-hidden="true"
                />
                <p className="mt-5 font-serif text-lg font-semibold">
                  {issue.issueDate} 日报
                </p>
                <p className="mt-2 line-clamp-2 text-xs leading-5 text-muted-ink">
                  {issue.dailyBriefing}
                </p>
              </Link>
            ))}
          </div>
        ) : (
          <p className="mt-5 rounded-md border border-dashed border-line-strong p-5 text-sm text-muted-ink">
            暂无历史日报，完成首次模拟投递后会保存在这里。
          </p>
        )}
      </section>

      {toast && (
        <Toast
          message={toast.message}
          variant={toast.variant}
          onDismiss={() => setToast(null)}
        />
      )}
    </>
  );
}
