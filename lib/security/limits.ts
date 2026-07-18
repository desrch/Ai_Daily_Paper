/**
 * 输入与内容长度上限，防止巨型响应进入 LLM 或数据库。
 */

export const INPUT_LIMITS = {
  /** 搜索关键词最大字符数。 */
  maxQueryLength: 50,
  /** 单篇文章 content 最大字符数。 */
  maxContentLength: 8000,
  /** 单篇文章 description 最大字符数。 */
  maxDescriptionLength: 1000,
  /** 单篇新闻标题最大字符数。 */
  maxTitleLength: 200,
  /** 候选新闻数量上限。 */
  maxCandidateArticles: 50,
  /** 进入 LLM 的文章数量上限。 */
  maxLlmArticles: 5,
  /** 并发新闻源数量上限。 */
  maxConcurrentProviders: 5,
} as const;

/** 截断文本到最大长度，超长时以省略号结尾。 */
export function truncateText(value: string, max: number): string {
  if (value.length <= max) {
    return value;
  }
  if (max <= 1) {
    return value.slice(0, max);
  }
  return `${value.slice(0, max - 1)}…`;
}
