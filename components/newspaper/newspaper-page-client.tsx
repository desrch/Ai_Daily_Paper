"use client";

import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

import { DailyNewspaper } from "@/components/newspaper/daily-newspaper";
import { NewspaperActions } from "@/components/newspaper/newspaper-actions";
import { ErrorState } from "@/components/states/error-state";
import { LoadingState } from "@/components/states/loading-state";
import { Button } from "@/components/ui/button";
import { apiClient, toApiError } from "@/lib/api/client";
import type { DailyIssue } from "@/types";

export function NewspaperPageClient({ issueId }: { issueId: string }) {
  const [issue, setIssue] = useState<DailyIssue | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notFound, setNotFound] = useState(false);

  const loadIssue = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    setNotFound(false);

    try {
      const issues = await apiClient.getDailyIssues();
      const matchedIssue = issues.find((item) => item.id === issueId);

      if (!matchedIssue) {
        setNotFound(true);
        setIssue(null);
        return;
      }

      setIssue(matchedIssue);
    } catch (loadError) {
      setError(toApiError(loadError).message);
    } finally {
      setIsLoading(false);
    }
  }, [issueId]);

  useEffect(() => {
    let active = true;

    apiClient
      .getDailyIssues()
      .then((issues) => {
        if (!active) {
          return;
        }

        const matchedIssue = issues.find((item) => item.id === issueId);

        if (!matchedIssue) {
          setNotFound(true);
          setIssue(null);
        } else {
          setIssue(matchedIssue);
        }
        setIsLoading(false);
      })
      .catch((loadError: unknown) => {
        if (!active) {
          return;
        }

        setError(toApiError(loadError).message);
        setIsLoading(false);
      });

    return () => {
      active = false;
    };
  }, [issueId]);

  if (isLoading) {
    return (
      <LoadingState
        title="正在展开今日报纸"
        description="正在读取报头、栏目和来源信息。"
      />
    );
  }

  if (error) {
    return (
      <ErrorState
        title="日报读取失败"
        description={error}
        onRetry={() => void loadIssue()}
      />
    );
  }

  if (notFound || !issue) {
    return (
      <ErrorState
        title="没有找到这份日报"
        description="这份日报可能尚未生成，或当前浏览器中的演示数据已经重置。"
      />
    );
  }

  return (
    <>
      <div
        className="mb-5 flex flex-wrap items-center justify-between gap-3"
        data-print-hidden
      >
        <Button asChild variant="ghost">
          <Link href="/dashboard">
            <ArrowLeft />
            返回主页
          </Link>
        </Button>
        <NewspaperActions title={`${issue.issueDate} 今日报纸`} />
      </div>
      <DailyNewspaper issue={issue} />
    </>
  );
}
