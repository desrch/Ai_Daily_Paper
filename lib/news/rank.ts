import type { NewsArticle, NewsTimeRange, SearchNewsItem } from "@/types";
import type {
  DataMode,
  RankedNewsArticle,
  RankedSearchResult,
} from "@/types/backend";
import { ERROR_CODES } from "@/types/backend";
import { BackendError } from "@/lib/errors";
import { classifyAngle, diversifySelection } from "@/lib/news/angles";
import { deduplicateArticles } from "@/lib/news/dedup";
import { scoreArticle } from "@/lib/news/ranking";

/** 时间范围到毫秒。 */
export function timeRangeToMs(range: NewsTimeRange): number {
  switch (range) {
    case "24h":
      return 24 * 3_600_000;
    case "7d":
      return 7 * 24 * 3_600_000;
    case "30d":
      return 30 * 24 * 3_600_000;
    default:
      return 7 * 24 * 3_600_000;
  }
}

export interface RankNewsInput {
  query: string;
  timeRange: NewsTimeRange;
  provider: { search: (input: import("@/types/backend").NewsSearchInput) => Promise<NewsArticle[]> };
  now: number;
  limit?: number;
  dataMode?: DataMode;
}

/**
 * 排序去重编排：搜索 → 过滤时间范围 → 评分 → 角度分类 → 去重 → 排序。
 * 空查询返回参数错误，不返回全量新闻。
 */
export async function rankNews(input: RankNewsInput): Promise<RankedSearchResult> {
  const query = input.query.trim();
  if (query.length === 0) {
    throw new BackendError({
      code: ERROR_CODES.INVALID_INPUT,
      message: "请输入有效的搜索关键词。",
      retryable: false,
    });
  }

  const rangeMs = timeRangeToMs(input.timeRange);
  const from = new Date(input.now - rangeMs).toISOString();
  const to = new Date(input.now).toISOString();

  const articles = await input.provider.search({
    query,
    from,
    to,
    limit: input.limit,
  });

  // 服务端二次过滤时间范围，保证 provider 实现不完美时仍正确。
  const inRange = articles.filter((article) => {
    const published = Date.parse(article.publishedAt);
    if (Number.isNaN(published)) {
      return false;
    }
    return published >= input.now - rangeMs && published <= input.now;
  });

  const ranked: RankedNewsArticle[] = inRange.map((article) => ({
    article,
    score: scoreArticle(query, article, input.now),
    angle:
      article.angle ??
      classifyAngle({
        title: article.title,
        description: article.description,
        keywords: article.keywords,
        category: article.category,
      }),
  }));

  const deduped = deduplicateArticles(ranked).sort(
    (a, b) => b.score.total - a.score.total,
  );

  const items: SearchNewsItem[] = deduped.map((entry) => ({
    ...entry.article,
    angle: entry.angle,
    relevanceScore: entry.score.total,
  }));

  return {
    items,
    ranked: deduped,
    dataMode: input.dataMode ?? "demo",
  };
}

/**
 * 多样性选择辅助：在已排序结果上选 3～5 篇覆盖不同角度的文章。
 */
export function selectDiverseArticles(
  ranked: RankedNewsArticle[],
  targetCount = 4,
): RankedNewsArticle[] {
  return diversifySelection(ranked, { targetCount });
}
