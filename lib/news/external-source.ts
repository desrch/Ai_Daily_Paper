import type { NewsArticle, NewsTimeRange, SearchNewsItem } from "@/types";
import { GenericNewsApiProvider } from "@/lib/news/providers/generic-api-provider";
import { inferAngle, scoreArticle, diversifyAngles, dedupeArticles } from "@/lib/news/source";

export function isExternalNewsEnabled(): boolean {
  return (
    process.env.NEWS_PROVIDER_MODE === "newsapi" &&
    Boolean(process.env.NEWS_API_KEY)
  );
}

function timeRangeToDays(range: NewsTimeRange): number {
  return range === "24h" ? 1 : range === "7d" ? 7 : 30;
}

export async function searchNewsExternal(
  keyword: string,
  timeRange: NewsTimeRange,
  limit = 12,
): Promise<SearchNewsItem[]> {
  const apiKey = process.env.NEWS_API_KEY;
  if (!apiKey) {
    throw new Error("NEWS_API_KEY 未配置");
  }

  const provider = new GenericNewsApiProvider({ apiKey });
  const now = Date.now();
  const days = timeRangeToDays(timeRange);
  const from = new Date(now - days * 24 * 60 * 60 * 1000).toISOString();
  const to = new Date(now).toISOString();

  const articles = await provider.search({ query: keyword, from, to, limit: limit * 2 });

  const ranked = articles
    .map((article) => ({
      ...article,
      relevanceScore: scoreArticle(article, keyword),
      angle: inferAngle(article),
    }))
    .filter((article) => article.relevanceScore > 18)
    .sort((a, b) => b.relevanceScore - a.relevanceScore);

  return diversifyAngles(dedupeArticles(ranked), limit);
}

export async function findArticlesByIdsExternal(
  keyword: string,
  articleIds: string[],
): Promise<NewsArticle[]> {
  const all = await searchNewsExternal(keyword, "7d", Math.max(articleIds.length * 2, 12));
  const byId = new Map(all.map((article) => [article.id, article]));
  return articleIds
    .map((id) => byId.get(id))
    .filter((article): article is NonNullable<typeof article> => Boolean(article));
}
