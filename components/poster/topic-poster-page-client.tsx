"use client";

import { useEffect, useState } from "react";

import { TopicPosterResultView } from "@/components/poster/topic-poster-result-view";
import { ErrorState } from "@/components/states/error-state";
import { LoadingState } from "@/components/states/loading-state";
import { apiClient, toApiError } from "@/lib/api/client";
import type { TopicPosterContent } from "@/types";

async function fetchTopicPosterResult(posterId: string) {
  const [poster, creations] = await Promise.all([
    apiClient.getTopicPoster(posterId),
    apiClient.getCreations({ type: "topic_poster", limit: 50 }),
  ]);

  return {
    poster,
    isSaved: creations.items.some(
      (creation) => creation.href === `/topic-poster/${posterId}`,
    ),
  };
}

export function TopicPosterPageClient({
  posterId,
}: {
  posterId: string;
}) {
  const [poster, setPoster] = useState<TopicPosterContent | null>(null);
  const [isSaved, setIsSaved] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notFound, setNotFound] = useState(false);

  async function loadPoster() {
    try {
      const result = await fetchTopicPosterResult(posterId);

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

    fetchTopicPosterResult(posterId)
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
        title="正在展开专题海报"
        description="正在读取报道角度、关键结论与完整来源。"
      />
    );
  }

  if (error) {
    return (
      <ErrorState
        title="专题海报读取失败"
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
        title="没有找到这张专题海报"
        description="作品可能尚未生成，或当前浏览器中的演示数据已经重置。"
      />
    );
  }

  return (
    <TopicPosterResultView
      poster={poster}
      isSaved={isSaved}
      demoMode={posterId === "demo-topic"}
      onSave={async () => {
        try {
          await apiClient.saveCreation({
            href: `/topic-poster/${poster.id}`,
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
