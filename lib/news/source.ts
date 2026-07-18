import { createHash } from "crypto";
import { readdirSync, readFileSync } from "fs";
import path from "path";
import type { NewsArticle, SearchNewsItem, TimeRange } from "@/types";

type RawArticle = Record<string, unknown>;

interface RawNewsBatch {
  articles?: RawArticle[];
}

const RAW_DATA_DIR = path.join(process.cwd(), "data", "raw");
const DEFAULT_IMAGE_URL = "/images/demo/news-placeholder.svg";
const ANGLES = ["政策", "技术", "产业", "应用", "市场"] as const;

let cachedArticles: NewsArticle[] | null = null;

export function getAllNewsArticles() {
  if (cachedArticles) {
    return cachedArticles;
  }

  let rawArticles: RawArticle[] = [];
  try {
    const files = readdirSync(RAW_DATA_DIR).filter((file) => file.endsWith(".json"));
    rawArticles = files.flatMap((file) => {
      const content = readFileSync(path.join(RAW_DATA_DIR, file), "utf8");
      const parsed = JSON.parse(content) as RawNewsBatch;
      return Array.isArray(parsed.articles) ? parsed.articles : [];
    });
  } catch {
    rawArticles = [];
  }

  const byId = new Map<string, NewsArticle>();
  rawArticles.map(normalizeNewsArticle).forEach((article) => {
    byId.set(article.id, article);
  });

  cachedArticles = Array.from(byId.values()).sort(
    (a, b) => Date.parse(b.publishedAt) - Date.parse(a.publishedAt)
  );

  return cachedArticles;
}

export function normalizeNewsArticle(raw: RawArticle): NewsArticle {
  const title = cleanText(raw.title) || cleanText(raw.originalTitle) || "未命名新闻";
  const source = cleanText(raw.source) || "Unknown";
  const sourceUrl = cleanOptionalUrl(raw.sourceUrl);
  const publishedAt = normalizeDate(raw.publishedAt);
  const content = cleanText(raw.content);
  const description =
    cleanText(raw.description) ||
    truncateText(content, 180) ||
    "该新闻暂缺摘要，后端将使用标题和来源信息参与排序。";
  const category = cleanText(raw.category) || inferCategory(title, description);
  const keywords = normalizeKeywords(raw.keywords, category, title);
  const id =
    cleanText(raw.id) ||
    stableId([source, sourceUrl || title, publishedAt].filter(Boolean).join("|"));
  const imageUrl = cleanOptionalUrl(raw.imageUrl) || DEFAULT_IMAGE_URL;

  return {
    id,
    title,
    description,
    ...(content ? { content } : {}),
    source,
    ...(sourceUrl ? { sourceUrl } : {}),
    publishedAt,
    category,
    imageUrl,
    keywords
  };
}

export function searchNews(keyword: string, timeRange: TimeRange): SearchNewsItem[] {
  const articles = filterByTimeRange(getAllNewsArticles(), timeRange);
  const ranked = articles
    .map((article) => {
      const relevanceScore = scoreArticle(article, keyword);
      return {
        ...article,
        relevanceScore,
        angle: inferAngle(article)
      };
    })
    .filter((article) => article.relevanceScore > 18)
    .sort((a, b) => (b.relevanceScore ?? 0) - (a.relevanceScore ?? 0));

  return diversifyAngles(dedupeArticles(ranked), 12);
}

export function rankArticles(
  articles: NewsArticle[],
  keyword: string,
  limit: number,
  requireAngleDiversity = false
): SearchNewsItem[] {
  const ranked = dedupeArticles(
    articles.map((article) => ({
      ...article,
      relevanceScore: scoreArticle(article, keyword),
      angle: inferAngle(article)
    }))
  ).sort((a, b) => (b.relevanceScore ?? 0) - (a.relevanceScore ?? 0));

  return requireAngleDiversity ? diversifyAngles(ranked, limit) : ranked.slice(0, limit);
}

export function findArticlesByIds(ids: string[]) {
  const all = getAllNewsArticles();
  const byId = new Map(all.map((article) => [article.id, article]));
  return ids.map((id) => byId.get(id)).filter((article): article is NewsArticle => Boolean(article));
}

export function pickArticles(query: string, count: number, timeRange: TimeRange = "7d") {
  const found = searchNews(query, timeRange);
  if (found.length >= count) {
    return found.slice(0, count);
  }

  const fallback = getAllNewsArticles()
    .map((article) => ({
      ...article,
      relevanceScore: Math.max(scoreArticle(article, query), 45),
      angle: inferAngle(article)
    }))
    .filter((article) => !found.some((item) => item.id === article.id));

  return [...found, ...fallback].slice(0, count);
}

function filterByTimeRange(articles: NewsArticle[], timeRange: TimeRange) {
  const now = Date.now();
  const days = timeRange === "24h" ? 1 : timeRange === "7d" ? 7 : 30;
  const minTime = now - days * 24 * 60 * 60 * 1000;
  const filtered = articles.filter((article) => Date.parse(article.publishedAt) >= minTime);
  return filtered.length >= 6 ? filtered : articles;
}

function scoreArticle(article: NewsArticle, keyword: string) {
  const tokens = tokenize(keyword);
  const title = article.title.toLowerCase();
  const description = article.description.toLowerCase();
  const content = (article.content ?? "").toLowerCase();
  const keywordText = article.keywords.join(" ").toLowerCase();

  let score = 18;
  for (const token of tokens) {
    if (title.includes(token)) score += 22;
    if (description.includes(token)) score += 14;
    if (content.includes(token)) score += 8;
    if (keywordText.includes(token)) score += 12;
  }

  score += freshnessScore(article.publishedAt) * 0.2;
  score += sourceScore(article.source) * 0.15;
  score += completenessScore(article) * 0.15;

  if (article.category.includes(keyword)) {
    score += 20;
  }

  return Math.max(0, Math.min(100, Math.round(score)));
}

function freshnessScore(publishedAt: string) {
  const ageMs = Date.now() - Date.parse(publishedAt);
  const ageHours = Math.max(0, ageMs / 1000 / 60 / 60);
  if (ageHours <= 24) return 100;
  if (ageHours <= 24 * 7) return 75;
  if (ageHours <= 24 * 30) return 45;
  return 20;
}

function sourceScore(source: string) {
  if (/人民网|人民日报|新华社|央视|BBC|科技日报|光明日报/.test(source)) return 90;
  if (/原创|日报|新闻/.test(source)) return 75;
  if (source === "Unknown") return 35;
  return 60;
}

function completenessScore(article: NewsArticle) {
  let score = 40;
  if (article.description.length > 30) score += 20;
  if (article.content && article.content.length > 100) score += 15;
  if (article.sourceUrl) score += 10;
  if (article.imageUrl) score += 10;
  if (article.publishedAt) score += 5;
  return score;
}

function dedupeArticles<T extends NewsArticle>(articles: T[]) {
  const result: T[] = [];
  const seenUrls = new Set<string>();

  for (const article of articles) {
    const urlKey = article.sourceUrl ? normalizeUrl(article.sourceUrl) : "";
    if (urlKey && seenUrls.has(urlKey)) continue;
    if (result.some((item) => titleSimilarity(item.title, article.title) > 0.82)) continue;
    if (urlKey) seenUrls.add(urlKey);
    result.push(article);
  }

  return result;
}

function diversifyAngles(articles: SearchNewsItem[], limit: number) {
  const selected: SearchNewsItem[] = [];
  for (const angle of ANGLES) {
    const candidate = articles.find(
      (article) => article.angle === angle && !selected.some((item) => item.id === article.id)
    );
    if (candidate) selected.push(candidate);
    if (selected.length >= limit) return selected;
  }

  for (const article of articles) {
    if (!selected.some((item) => item.id === article.id)) selected.push(article);
    if (selected.length >= limit) break;
  }

  return selected;
}

function inferAngle(article: NewsArticle): SearchNewsItem["angle"] {
  const text = `${article.title} ${article.description} ${article.keywords.join(" ")}`;
  if (/政策|监管|治理|标准|规则|安全|责任|政府|工信部|联合国/.test(text)) return "政策";
  if (/模型|芯片|算法|语料|系统|技术|研究|数据|算力|开源/.test(text)) return "技术";
  if (/产业|企业|公司|银行|制造|医药|商业|规模|供应链/.test(text)) return "产业";
  if (/应用|课堂|教育|农业|医疗|办公|手机|助手|机器人/.test(text)) return "应用";
  return "市场";
}

function inferCategory(title: string, description: string) {
  const text = `${title} ${description}`;
  if (/AI|人工智能|大模型|机器人/.test(text)) return "人工智能";
  if (/财经|商业|银行|投资|市场/.test(text)) return "商业财经";
  return "科技数码";
}

function normalizeKeywords(value: unknown, category: string, title: string) {
  const base = Array.isArray(value) ? value.map(cleanText).filter(Boolean) : [];
  const inferred = [category];
  if (/AI|人工智能|大模型/.test(title)) inferred.push("人工智能");
  if (/机器人/.test(title)) inferred.push("机器人");
  return Array.from(new Set([...base, ...inferred])).slice(0, 8);
}

function cleanText(value: unknown) {
  return typeof value === "string" ? value.replace(/\s+/g, " ").trim() : "";
}

function cleanOptionalUrl(value: unknown) {
  const url = cleanText(value);
  if (!url) return "";
  try {
    const parsed = new URL(url);
    return parsed.toString();
  } catch {
    return url.startsWith("/") ? url : "";
  }
}

function normalizeDate(value: unknown) {
  const raw = cleanText(value);
  const date = raw ? new Date(raw) : new Date();
  if (Number.isNaN(date.getTime())) {
    return new Date().toISOString();
  }
  return date.toISOString();
}

function stableId(input: string) {
  return `news_${createHash("sha1").update(input).digest("hex").slice(0, 12)}`;
}

function truncateText(value: string, length: number) {
  return value.length > length ? `${value.slice(0, length)}...` : value;
}

function tokenize(keyword: string) {
  const normalized = keyword.trim().toLowerCase();
  const tokens = normalized
    .split(/[\s,，、]+/)
    .map((item) => item.trim())
    .filter(Boolean);
  return Array.from(new Set([normalized, ...tokens])).filter(Boolean);
}

function normalizeUrl(url: string) {
  try {
    const parsed = new URL(url);
    parsed.search = "";
    parsed.hash = "";
    return parsed.toString();
  } catch {
    return url;
  }
}

function titleSimilarity(a: string, b: string) {
  const aSet = new Set(a.replace(/[^\p{L}\p{N}]/gu, "").split(""));
  const bSet = new Set(b.replace(/[^\p{L}\p{N}]/gu, "").split(""));
  if (!aSet.size || !bSet.size) return 0;
  const intersection = Array.from(aSet).filter((char) => bSet.has(char)).length;
  return (2 * intersection) / (aSet.size + bSet.size);
}
