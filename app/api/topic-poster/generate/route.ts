import { apiError, json, readJsonBody } from "@/lib/api/http";
import { enhanceTopicPosterWithAi } from "@/lib/ai/generate";
import { savePosterToDb, upsertCreationToDb } from "@/lib/db/creations";
import { generateTopicPoster, topicPosterCreation } from "@/lib/demo/generate";
import { isExternalNewsEnabled, findArticlesByIdsExternal } from "@/lib/news/external-source";
import { findArticlesByIds, pickArticles } from "@/lib/news/source";
import type { PosterTemplate } from "@/types";

interface GenerateTopicPosterRequest {
  keyword?: string;
  articleIds?: string[];
  template?: PosterTemplate;
}

const TEMPLATES = new Set(["classic", "modern"]);

export async function POST(request: Request) {
  const body = await readJsonBody<GenerateTopicPosterRequest>(request);
  if (!body) {
    return apiError(400, "INVALID_JSON", "请求体必须是合法 JSON。", false);
  }

  const keyword = typeof body.keyword === "string" ? body.keyword.trim() : "";
  const articleIds = Array.isArray(body.articleIds)
    ? body.articleIds.map((id) => (typeof id === "string" ? id.trim() : "")).filter(Boolean)
    : [];
  const template = body.template ?? "classic";

  if (!keyword || keyword.length > 50) {
    return apiError(400, "INVALID_KEYWORD", "请输入 1 到 50 个字符的专题关键词。", false);
  }
  if (articleIds.length < 3 || articleIds.length > 5) {
    return apiError(400, "INVALID_ARTICLE_COUNT", "专题海报必须选择 3 到 5 篇新闻。", false);
  }
  if (!TEMPLATES.has(template)) {
    return apiError(400, "INVALID_TEMPLATE", "海报模板只支持 classic 或 modern。", false);
  }

  let matched = isExternalNewsEnabled()
    ? await findArticlesByIdsExternal(keyword, articleIds)
    : findArticlesByIds(articleIds);
  const articles = matched.length === articleIds.length ? matched : pickArticles(keyword, articleIds.length, "7d");

  const fallbackPoster = generateTopicPoster(keyword, articleIds, articles, template);
  const poster = await enhanceTopicPosterWithAi(fallbackPoster);

  try {
    await savePosterToDb(poster, "topic");
    await upsertCreationToDb(topicPosterCreation(poster, false));
  } catch {
    // Keep generation usable without database persistence.
  }

  return json(poster);
}
