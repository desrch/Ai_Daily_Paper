import type { NewsArticle } from "@/types";
import demoNewsJson from "@/data/demo/news-articles.json";
import type { NewsProvider, NewsSearchInput } from "@/types/backend";
import { normalizeArticles, type RawArticle } from "@/lib/news/normalize";

/**
 * 演示新闻源。从 data/demo/news-articles.json 读取，无网络即可工作。
 * 用于演示、测试和外部服务降级。支持 query、时间范围和 limit。
 */

// 模块级缓存，保证稳定且不每次重新解析。
const demoArticles: NewsArticle[] = normalizeArticles(
  demoNewsJson as ReadonlyArray<RawArticle>,
);

function matchesQuery(article: NewsArticle, query: string): boolean {
  const keyword = query.trim().toLocaleLowerCase("zh-CN");
  if (keyword.length === 0) {
    return true;
  }
  const haystack = [
    article.title,
    article.description,
    article.category,
    ...article.keywords,
  ]
    .join(" ")
    .toLocaleLowerCase("zh-CN");
  return haystack.includes(keyword);
}

function withinTimeRange(
  article: NewsArticle,
  from?: string,
  to?: string,
): boolean {
  const published = Date.parse(article.publishedAt);
  if (Number.isNaN(published)) {
    return false;
  }
  if (from) {
    const fromMs = Date.parse(from);
    if (!Number.isNaN(fromMs) && published < fromMs) {
      return false;
    }
  }
  if (to) {
    const toMs = Date.parse(to);
    if (!Number.isNaN(toMs) && published > toMs) {
      return false;
    }
  }
  return true;
}

export class DemoNewsProvider implements NewsProvider {
  readonly name = "demo";

  async search(
    input: NewsSearchInput,
    _signal?: AbortSignal,
  ): Promise<NewsArticle[]> {
    const limit = clampLimit(input.limit);
    const result = demoArticles.filter(
      (article) =>
        matchesQuery(article, input.query) &&
        withinTimeRange(article, input.from, input.to),
    );
    return result.slice(0, limit);
  };
}

function clampLimit(limit?: number): number {
  if (typeof limit !== "number" || !Number.isFinite(limit) || limit <= 0) {
    return 50;
  }
  return Math.min(Math.floor(limit), 50);
}

/** 供测试与其他模块直接读取已规范化的演示文章。 */
export function getDemoArticles(): NewsArticle[] {
  return demoArticles.map((article) => ({ ...article }));
}
