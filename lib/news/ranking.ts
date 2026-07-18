import type { NewsArticle } from "@/types";
import type { ScoreBreakdown } from "@/types/backend";
import { SCORE_WEIGHTS } from "@/types/backend";
import { getSourceQuality } from "@/lib/news/source-quality";
import { INPUT_LIMITS } from "@/lib/security/limits";

/**
 * 排序纯函数。确定性、可解释、可测试。不依赖网络或真实系统时间。
 */

function normalizeForMatch(text: string): string {
  return text.normalize("NFKC").toLocaleLowerCase("zh-CN");
}

function tokenizeQuery(query: string): string[] {
  const normalized = normalizeForMatch(query);
  const tokens = normalized.split(/\s+/).filter((token) => token.length > 0);
  // 加入完整查询作为整体 token，支持"完整出现在标题中"。
  if (normalized.length > 0 && !tokens.includes(normalized)) {
    tokens.unshift(normalized);
  }
  return Array.from(new Set(tokens));
}

/**
 * 关键词相关度（0～100）。标题 > description > keywords。
 * 查询词完整出现在标题中给最高权重。
 */
export function scoreRelevance(query: string, article: NewsArticle): number {
  const tokens = tokenizeQuery(query);
  if (tokens.length === 0) {
    return 0;
  }

  const title = normalizeForMatch(article.title);
  const description = normalizeForMatch(article.description);
  const keywords = normalizeForMatch(article.keywords.join(" "));
  const category = normalizeForMatch(article.category);

  let score = 0;
  let maxScore = 0;

  for (const token of tokens) {
    // 标题权重 1.0；完整出现在标题中额外加成。
    maxScore += 1.0;
    if (title.includes(token)) {
      score += token === normalizeForMatch(query) && title.includes(token)
        ? 1.0
        : 0.7;
    } else if (description.includes(token)) {
      // 描述权重 0.6
      score += 0.6;
    } else if (keywords.includes(token)) {
      // 关键词权重 0.4
      score += 0.4;
    } else if (category.includes(token)) {
      score += 0.3;
    }
  }

  if (maxScore === 0) {
    return 0;
  }
  const ratio = score / maxScore;
  return Math.round(ratio * 100);
}

/**
 * 时效性（0～100）。注入 now 保证测试稳定。
 * 24 小时内高分；7 天内逐步衰减；超出时间范围的文章由服务层过滤。
 */
export function scoreRecency(publishedAt: string, now: number): number {
  const published = Date.parse(publishedAt);
  if (Number.isNaN(published)) {
    return 0;
  }
  const hours = (now - published) / 3_600_000;
  if (hours < 0) {
    // 未来时间视为高质量但不加分。
    return 100;
  }
  if (hours <= 24) {
    // 0h -> 100, 24h -> 80
    return Math.round(100 - (hours / 24) * 20);
  }
  if (hours <= 168) {
    // 24h -> 80, 168h -> 20
    return Math.round(80 - ((hours - 24) / 144) * 60);
  }
  // 超过 7 天缓慢下降，不低于 0。
  return Math.max(0, Math.round(20 - (hours - 168) * 0.02));
}

/**
 * 内容完整度（0～100）。根据字段可用性加权。
 */
export function scoreCompleteness(article: NewsArticle): number {
  let score = 0;

  if (article.description.trim().length >= 10) {
    score += 25;
  } else if (article.description.trim().length > 0) {
    score += 10;
  }

  if (article.content && article.content.trim().length > 0) {
    score += 20;
  }

  if (article.imageUrl) {
    score += 15;
  }

  if (article.sourceUrl) {
    score += 15;
  }

  if (article.keywords.length > 0) {
    score += 15;
  }

  if (article.publishedAt && !Number.isNaN(Date.parse(article.publishedAt))) {
    score += 10;
  }

  return Math.min(100, score);
}

/** 来源质量（0～100）。 */
export function scoreSourceQuality(article: NewsArticle): number {
  return getSourceQuality(article.source);
}

/** 综合分数 = relevance*0.5 + recency*0.2 + sourceQuality*0.15 + completeness*0.15。 */
export function scoreArticle(
  query: string,
  article: NewsArticle,
  now: number,
): ScoreBreakdown {
  const relevance = scoreRelevance(query, article);
  const recency = scoreRecency(article.publishedAt, now);
  const sourceQuality = scoreSourceQuality(article);
  const completeness = scoreCompleteness(article);

  const total = Math.round(
    relevance * SCORE_WEIGHTS.relevance +
      recency * SCORE_WEIGHTS.recency +
      sourceQuality * SCORE_WEIGHTS.sourceQuality +
      completeness * SCORE_WEIGHTS.completeness,
  );

  return {
    relevance,
    recency,
    sourceQuality,
    completeness,
    total: Math.max(0, Math.min(100, total)),
  };
}

/** 截断候选新闻数量。 */
export function clampCandidates(count: number): number {
  if (!Number.isFinite(count) || count <= 0) {
    return INPUT_LIMITS.maxCandidateArticles;
  }
  return Math.min(Math.floor(count), INPUT_LIMITS.maxCandidateArticles);
}
