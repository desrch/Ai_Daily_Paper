import type { NewsAngle, NewsArticle } from "@/types";
import { createArticleId } from "@/lib/security/stable-id";
import {
  sanitizeHttpUrl,
  sanitizeImageUrl,
} from "@/lib/security/url";
import { INPUT_LIMITS, truncateText } from "@/lib/security/limits";

const VALID_ANGLES: NewsAngle[] = ["政策", "技术", "产业", "应用", "市场"];

function normalizeAngle(value: unknown): NewsAngle | undefined {
  if (typeof value !== "string") return undefined;
  const normalized = value.trim();
  if (VALID_ANGLES.includes(normalized as NewsAngle)) {
    return normalized as NewsAngle;
  }
  return undefined;
}

/**
 * 新闻规范化。外部数据进入领域层前必须规范化与校验。
 * 非法 imageUrl 不让整篇文章失败；必填字段缺失才丢弃文章。
 */

/** 外部数据源可能传入的原始文章结构。字段宽松。 */
export interface RawArticle {
  id?: string;
  title?: string;
  description?: string;
  content?: string;
  source?: string;
  sourceUrl?: string;
  publishedAt?: string;
  category?: string;
  imageUrl?: string;
  keywords?: string[];
  relevanceScore?: number;
  angle?: NewsAngle;
}

const HTML_TAG_PATTERN = /<[^>]*>/g;
const WHITESPACE_PATTERN = /\s+/g;

const ENTITY_MAP: Record<string, string> = {
  "&amp;": "&",
  "&lt;": "<",
  "&gt;": ">",
  "&quot;": '"',
  "&#39;": "'",
  "&nbsp;": " ",
};

function decodeEntities(text: string): string {
  return text.replace(/&(amp|lt|gt|quot|#39|nbsp);/g, (match) => {
    return ENTITY_MAP[match] ?? match;
  });
}

/** 去除 HTML 标签并解码常见实体，得到安全纯文本。 */
export function stripHtml(text: string): string {
  return decodeEntities(text.replace(HTML_TAG_PATTERN, ""));
}

/** 折叠连续空白并 trim。 */
export function collapseWhitespace(text: string): string {
  return text.replace(WHITESPACE_PATTERN, " ").trim();
}

/** 规范化文本字段：去 HTML、折叠空白、trim。 */
export function normalizeTextField(value: unknown): string {
  if (typeof value !== "string") {
    return "";
  }
  return collapseWhitespace(stripHtml(value));
}

/**
 * 规范化时间到 ISO 8601（UTC）。无效时返回 null。
 * 接受 Date、ISO 字符串、带时区或本地时间字符串。
 */
export function normalizePublishedAt(value: unknown): string | null {
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return value.toISOString();
  }
  if (typeof value !== "string") {
    return null;
  }
  const trimmed = value.trim();
  if (trimmed.length === 0) {
    return null;
  }
  const date = new Date(trimmed);
  if (Number.isNaN(date.getTime())) {
    return null;
  }
  return date.toISOString();
}

/** 关键词去重并清理空白。 */
export function normalizeKeywords(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }
  const seen = new Set<string>();
  const result: string[] = [];
  for (const item of value) {
    if (typeof item !== "string") {
      continue;
    }
    const normalized = collapseWhitespace(item);
    if (normalized.length === 0) {
      continue;
    }
    const key = normalized.toLocaleLowerCase("zh-CN");
    if (seen.has(key)) {
      continue;
    }
    seen.add(key);
    result.push(normalized);
  }
  return result;
}

/**
 * 规范化单篇原始文章为 NewsArticle。
 * 必填字段（title、description、source、publishedAt、category）缺失返回 null。
 */
export function normalizeArticle(raw: RawArticle): NewsArticle | null {
  const title = normalizeTextField(raw.title).slice(
    0,
    INPUT_LIMITS.maxTitleLength,
  );
  const description = normalizeTextField(raw.description).slice(
    0,
    INPUT_LIMITS.maxDescriptionLength,
  );
  const source = normalizeTextField(raw.source);
  const category = normalizeTextField(raw.category);

  if (
    title.length === 0 ||
    description.length === 0 ||
    source.length === 0 ||
    category.length === 0
  ) {
    return null;
  }

  const publishedAt = normalizePublishedAt(raw.publishedAt);
  if (!publishedAt) {
    return null;
  }

  const sourceUrl = sanitizeHttpUrl(raw.sourceUrl);
  const imageUrl = sanitizeImageUrl(raw.imageUrl);

  const content =
    typeof raw.content === "string" && raw.content.trim().length > 0
      ? truncateText(
          collapseWhitespace(stripHtml(raw.content)),
          INPUT_LIMITS.maxContentLength,
        )
      : undefined;

  const keywords = normalizeKeywords(raw.keywords);
  const explicitAngle = normalizeAngle(raw.angle);

  const id = createArticleId({
    sourceId: raw.id,
    source,
    sourceUrl,
    title,
  });

  return {
    id,
    title,
    description,
    content,
    source,
    sourceUrl,
    publishedAt,
    category,
    imageUrl,
    keywords,
    relevanceScore:
      typeof raw.relevanceScore === "number" &&
      raw.relevanceScore >= 0 &&
      raw.relevanceScore <= 100
        ? raw.relevanceScore
        : undefined,
    angle: explicitAngle,
  };
}

/** 批量规范化并丢弃无效文章。 */
export function normalizeArticles(raw: ReadonlyArray<RawArticle>): NewsArticle[] {
  const result: NewsArticle[] = [];
  const seenIds = new Set<string>();
  for (const item of raw) {
    const article = normalizeArticle(item);
    if (!article) {
      continue;
    }
    if (seenIds.has(article.id)) {
      continue;
    }
    seenIds.add(article.id);
    result.push(article);
  }
  return result;
}
