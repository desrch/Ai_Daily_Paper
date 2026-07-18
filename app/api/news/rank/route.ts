import { apiError, json, readJsonBody } from "@/lib/api/http";
import { normalizeNewsArticle, rankArticles } from "@/lib/news/source";
import type { NewsArticle } from "@/types";

interface RankRequest {
  keyword?: string;
  articles?: NewsArticle[];
  limit?: number;
  requireAngleDiversity?: boolean;
}

export async function POST(request: Request) {
  const body = await readJsonBody<RankRequest>(request);
  if (!body) {
    return apiError(400, "INVALID_JSON", "请求体必须是合法 JSON。", false);
  }

  const keyword = typeof body.keyword === "string" ? body.keyword.trim() : "";
  if (!keyword || keyword.length > 50) {
    return apiError(400, "INVALID_INPUT", "请输入 1 到 50 个字符的排序关键词。", false);
  }

  if (!Array.isArray(body.articles)) {
    return apiError(400, "INVALID_ARTICLES", "articles 必须是新闻数组。", false);
  }

  const limit = Math.max(1, Math.min(30, Math.round(body.limit ?? 10)));
  const articles = body.articles.map((article) => normalizeNewsArticle(article as unknown as Record<string, unknown>));

  return json(rankArticles(articles, keyword, limit, Boolean(body.requireAngleDiversity)));
}
