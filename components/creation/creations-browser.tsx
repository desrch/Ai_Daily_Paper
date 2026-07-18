"use client";

import { CalendarDays, Search, SlidersHorizontal, X } from "lucide-react";
import { useEffect, useState } from "react";

import { CreationCard } from "@/components/creation/creation-card";
import { ErrorState } from "@/components/states/error-state";
import { LoadingState } from "@/components/states/loading-state";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { apiClient, toApiError } from "@/lib/api/client";
import { cn } from "@/lib/utils";
import type {
  Creation,
  CreationFilters,
  CreationType,
} from "@/types";

type TypeFilter = CreationType | "all";

type LocalFilters = {
  type: TypeFilter;
  keyword: string;
  dateFrom: string;
  dateTo: string;
};

const initialFilters: LocalFilters = {
  type: "all",
  keyword: "",
  dateFrom: "",
  dateTo: "",
};

const tabs: Array<{ value: TypeFilter; label: string }> = [
  { value: "all", label: "全部" },
  { value: "daily_issue", label: "每日日报" },
  { value: "theme_poster", label: "主题海报" },
  { value: "topic_poster", label: "专题海报" },
];

function toApiFilters(
  filters: LocalFilters,
  offset = 0,
): CreationFilters {
  return {
    type: filters.type,
    keyword: filters.keyword.trim() || undefined,
    dateFrom: filters.dateFrom || undefined,
    dateTo: filters.dateTo || undefined,
    offset,
    limit: 6,
  };
}

export function CreationsBrowser() {
  const [filters, setFilters] = useState<LocalFilters>(initialFilters);
  const [items, setItems] = useState<Creation[]>([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isFiltering, setIsFiltering] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    apiClient
      .getCreations(toApiFilters(initialFilters))
      .then((result) => {
        if (!active) {
          return;
        }

        setItems(result.items);
        setTotal(result.total);
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
  }, []);

  async function applyFilters(
    nextFilters: LocalFilters,
    append = false,
  ) {
    setIsFiltering(true);
    setError(null);

    try {
      const offset = append ? items.length : 0;
      const result = await apiClient.getCreations(
        toApiFilters(nextFilters, offset),
      );
      setItems((currentItems) =>
        append ? [...currentItems, ...result.items] : result.items,
      );
      setTotal(result.total);
      setFilters(nextFilters);
    } catch (loadError) {
      setError(toApiError(loadError).message);
    } finally {
      setIsFiltering(false);
    }
  }

  function updateType(type: TypeFilter) {
    const nextFilters = { ...filters, type };
    void applyFilters(nextFilters);
  }

  function resetFilters() {
    void applyFilters(initialFilters);
  }

  const hasActiveFilters =
    filters.type !== "all" ||
    Boolean(filters.keyword || filters.dateFrom || filters.dateTo);

  if (isLoading) {
    return (
      <LoadingState
        title="正在整理历史作品"
        description="正在读取日报和海报记录。"
      />
    );
  }

  if (error && items.length === 0) {
    return (
      <ErrorState
        title="历史作品读取失败"
        description={error}
        onRetry={resetFilters}
      />
    );
  }

  return (
    <>
      <div
        className="flex flex-wrap gap-2 border-b border-line"
        role="tablist"
        aria-label="作品分类"
      >
        {tabs.map((tab) => (
          <button
            key={tab.value}
            type="button"
            role="tab"
            aria-selected={filters.type === tab.value}
            onClick={() => updateType(tab.value)}
            className={cn(
              "relative min-w-24 px-5 py-3 text-sm font-medium text-muted-ink transition-colors hover:text-brand",
              filters.type === tab.value && "text-brand",
            )}
          >
            {tab.label}
            <span
              className={cn(
                "absolute inset-x-0 bottom-0 h-0.5 scale-x-0 bg-brand transition-transform",
                filters.type === tab.value && "scale-x-100",
              )}
              aria-hidden="true"
            />
          </button>
        ))}
      </div>

      <form
        className="mt-5 grid gap-3 rounded-lg border border-line bg-surface p-4 shadow-card lg:grid-cols-[11rem_11rem_11rem_1fr_auto]"
        onSubmit={(event) => {
          event.preventDefault();
          void applyFilters(filters);
        }}
      >
        <div>
          <Label htmlFor="creation-type" className="sr-only">
            作品类型
          </Label>
          <select
            id="creation-type"
            value={filters.type}
            onChange={(event) =>
              setFilters((current) => ({
                ...current,
                type: event.target.value as TypeFilter,
              }))
            }
            className="h-10 w-full rounded-md border border-line-strong bg-surface px-3 text-sm text-ink outline-none focus-visible:border-brand focus-visible:ring-2 focus-visible:ring-brand/15"
          >
            {tabs.map((tab) => (
              <option key={tab.value} value={tab.value}>
                {tab.label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <Label htmlFor="creation-date-from" className="sr-only">
            起始日期
          </Label>
          <div className="relative">
            <CalendarDays
              className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-ink"
              aria-hidden="true"
            />
            <Input
              id="creation-date-from"
              type="date"
              value={filters.dateFrom}
              onChange={(event) =>
                setFilters((current) => ({
                  ...current,
                  dateFrom: event.target.value,
                }))
              }
              className="pl-9"
            />
          </div>
        </div>
        <div>
          <Label htmlFor="creation-date-to" className="sr-only">
            结束日期
          </Label>
          <div className="relative">
            <CalendarDays
              className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-ink"
              aria-hidden="true"
            />
            <Input
              id="creation-date-to"
              type="date"
              value={filters.dateTo}
              onChange={(event) =>
                setFilters((current) => ({
                  ...current,
                  dateTo: event.target.value,
                }))
              }
              className="pl-9"
            />
          </div>
        </div>
        <div>
          <Label htmlFor="creation-keyword" className="sr-only">
            作品名称或关键词
          </Label>
          <div className="relative">
            <Search
              className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-ink"
              aria-hidden="true"
            />
            <Input
              id="creation-keyword"
              value={filters.keyword}
              onChange={(event) =>
                setFilters((current) => ({
                  ...current,
                  keyword: event.target.value,
                }))
              }
              placeholder="搜索作品名称或关键词"
              className="pl-9"
            />
          </div>
        </div>
        <Button type="submit" disabled={isFiltering}>
          <SlidersHorizontal />
          {isFiltering ? "筛选中…" : "应用筛选"}
        </Button>
      </form>

      {error && (
        <p
          className="mt-4 rounded-md border border-danger/35 bg-surface p-4 text-sm text-danger"
          role="alert"
        >
          {error}
        </p>
      )}

      <div className="mt-6 flex items-center justify-between gap-4">
        <p className="text-sm text-muted-ink">共 {total} 件作品</p>
        {hasActiveFilters && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={resetFilters}
          >
            <X />
            清空筛选
          </Button>
        )}
      </div>

      {items.length > 0 ? (
        <>
          <div
            className={cn(
              "mt-5 grid gap-5 sm:grid-cols-2 lg:grid-cols-3",
              isFiltering && "opacity-60",
            )}
            aria-busy={isFiltering}
          >
            {items.map((creation, index) => (
              <CreationCard
                key={creation.id}
                creation={creation}
                priority={index === 0}
              />
            ))}
          </div>
          {items.length < total && (
            <div className="mt-8 text-center">
              <Button
                type="button"
                variant="secondary"
                disabled={isFiltering}
                onClick={() => void applyFilters(filters, true)}
              >
                {isFiltering ? "正在加载…" : "加载更多"}
              </Button>
            </div>
          )}
        </>
      ) : (
        <div className="mt-5 rounded-lg border border-dashed border-line-strong bg-surface p-10 text-center">
          <Search className="mx-auto size-7 text-brand" aria-hidden="true" />
          <h2 className="mt-4 font-serif text-2xl font-semibold">
            没有找到匹配的作品
          </h2>
          <p className="mt-2 text-sm text-muted-ink">
            请调整类型、日期或关键词后重新筛选。
          </p>
          <Button
            type="button"
            variant="secondary"
            className="mt-5"
            onClick={resetFilters}
          >
            清空筛选
          </Button>
        </div>
      )}
    </>
  );
}
