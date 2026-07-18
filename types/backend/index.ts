import type { NewsAngle, NewsArticle, SearchNewsItem } from "@/types";

/**
 * 后端内部类型。不向前端导出，前端不得依赖这些字段。
 * 与冻结类型 {@link NewsArticle}、{@link SearchNewsItem} 保持兼容。
 */

/** 综合分数的子项拆解，用于可解释排序。所有子分数范围 0～100。 */
export interface ScoreBreakdown {
  relevance: number;
  recency: number;
  sourceQuality: number;
  completeness: number;
  total: number;
}

/** 评分权重集中配置，避免散落在代码中。 */
export const SCORE_WEIGHTS = {
  relevance: 0.5,
  recency: 0.2,
  sourceQuality: 0.15,
  completeness: 0.15,
} as const;

/** 去重阈值集中配置。 */
export const DEDUP_THRESHOLDS = {
  /** 标题字符 2-gram Jaccard 达到此值判定高概率重复。 */
  titleNgram: 0.82,
  /** 标题相似度达标后，再要求摘要相似度达标才判定重复。 */
  titleSimilarity: 0.72,
  summarySimilarity: 0.75,
} as const;

/** 已评分、已标注角度且可能标记重复的文章。 */
export interface RankedNewsArticle {
  article: NewsArticle;
  score: ScoreBreakdown;
  angle: NewsAngle;
  duplicateOf?: string;
}

/** 搜索输入，进入 NewsProvider 前。 */
export interface NewsSearchInput {
  query: string;
  from?: string;
  to?: string;
  limit?: number;
  language?: string;
}

/** 外部新闻数据源适配器接口。领域服务只依赖此接口，不依赖具体 SDK。 */
export interface NewsProvider {
  readonly name: string;
  search(input: NewsSearchInput, signal?: AbortSignal): Promise<NewsArticle[]>;
}

/** 来源质量等级表条目。未知来源使用中性默认分，不直接判低质量。 */
export interface NewsSourceQualityEntry {
  /** 来源名称规范化后的小写匹配键。 */
  match: string;
  quality: number;
}

/** 数据模式，用于响应 meta.dataMode。 */
export type DataMode = "live" | "cache" | "demo";

/** 统一响应 meta。 */
export interface ApiMeta {
  requestId: string;
  dataMode: DataMode;
  generatedAt: string;
}

/** 后端扩展错误结构，在前端 ApiError 基础上增加 requestId。 */
export interface BackendApiError {
  code: string;
  message: string;
  retryable: boolean;
  requestId?: string;
}

/** 错误码集中定义，与前端 ApiError.code 对齐。 */
export const ERROR_CODES = {
  INVALID_INPUT: "INVALID_INPUT",
  UNAUTHORIZED: "UNAUTHORIZED",
  NOT_FOUND: "NOT_FOUND",
  CONFLICT: "CONFLICT",
  DAILY_ISSUE_EXISTS: "DAILY_ISSUE_EXISTS",
  GENERATION_IN_PROGRESS: "GENERATION_IN_PROGRESS",
  NEWS_PROVIDER_UNAVAILABLE: "NEWS_PROVIDER_UNAVAILABLE",
  INSUFFICIENT_ARTICLES: "INSUFFICIENT_ARTICLES",
  AI_UNAVAILABLE: "AI_UNAVAILABLE",
  AI_INVALID_OUTPUT: "AI_INVALID_OUTPUT",
  DATABASE_UNAVAILABLE: "DATABASE_UNAVAILABLE",
  RATE_LIMITED: "RATE_LIMITED",
  INTERNAL_ERROR: "INTERNAL_ERROR",
} as const;

export type ErrorCode = (typeof ERROR_CODES)[keyof typeof ERROR_CODES];

/** 排序、去重所需的候选结果。 */
export interface RankedSearchResult {
  items: SearchNewsItem[];
  ranked: RankedNewsArticle[];
  dataMode: DataMode;
}
