"use client";

import { useEffect, useState } from "react";

import { ThemePosterResultView } from "@/components/poster/theme-poster-result-view";
import { ErrorState } from "@/components/states/error-state";
import { LoadingState } from "@/components/states/loading-state";
import { apiClient, toApiError } from "@/lib/api/client";
import type { ThemePosterContent } from "@/types";

async function fetchThemePosterResult(posterId: string) {
  const [poster, creations] = await Promise.all([
    apiClient.getThemePoster(posterId),
    apiClient.getCreations({ type: "theme_poster", limit: 50 }),
  ]);

  return {
    poster,
    isSaved: creations.items.some(
      (creation) => creation.href === `/theme-poster/${posterId}`,
    ),
  };
}

export function ThemePosterPageClient({
  posterId,
}: {
  posterId: string;
}) {
  const [poster, setPoster] = useState<ThemePosterContent | null>(null);
  const [isSaved, setIsSaved] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notFound, setNotFound] = useState(false);

  async function loadPoster() {
    try {
      const result = await fetchThemePosterResult(posterId);

      if (!result.poster) {
        setPoster(null);
        setNotFound(true);
        return;
      }

      setPoster(result.poster);
      setIsSaved(result.isSaved);
    } catch (loadError) {
      setError(toApiError(loadError).message);
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    let active = true;

    fetchThemePosterResult(posterId)
      .then((result) => {
        if (!active) {
          return;
        }

        if (!result.poster) {
          setPoster(null);
          setNotFound(true);
        } else {
          setPoster(result.poster);
          setIsSaved(result.isSaved);
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
  }, [posterId]);

  if (isLoading) {
    return (
      <LoadingState
        title="正在展开主题海报"
        description="正在读取专题摘要、代表新闻与排版结果。"
      />
    );
  }

  if (error) {
    return (
      <ErrorState
        title="主题海报读取失败"
        description={error}
        onRetry={() => {
          setIsLoading(true);
          setError(null);
          setNotFound(false);
          void loadPoster();
        }}
      />
    );
  }

  if (notFound || !poster) {
    return (
      <ErrorState
        title="没有找到这张主题海报"
        description="作品可能尚未生成，或当前浏览器中的演示数据已经重置。"
      />
    );
  }

  return (
    <ThemePosterResultView
      poster={poster}
      isSaved={isSaved}
      demoMode={posterId === "demo-theme"}
      onSave={async () => {
        try {
          await apiClient.saveCreation({
            href: `/theme-poster/${poster.id}`,
          });
          setIsSaved(true);
          return true;
        } catch {
          return false;
        }
      }}
    />
  );
}
