import type { RankedNewsArticle } from "@/types/backend";
import { DEDUP_THRESHOLDS } from "@/types/backend";

/**
 * 去重纯函数。不依赖网络或数据库。阈值集中在 DEDUP_THRESHOLDS。
 *
 * 判定规则：
 * - 规范化 URL 完全相同 → 重复
 * - 规范化标题完全一致 → 重复
 * - 标题字符 2-gram Jaccard >= 0.82 → 高概率重复
 * - 标题相似度 >= 0.72 且摘要相似度 >= 0.75 → 重复
 *
 * 每个重复组保留 total 更高、内容更完整、来源 URL 可用的文章。
 */

const PUNCTUATION_PATTERN = /[\s\p{P}\p{S}]/gu;

/** 规范化标题用于相似度比较：Unicode 规范化、小写、去标点与空白。 */
export function normalizeTitle(text: string): string {
  return text
    .normalize("NFKC")
    .toLocaleLowerCase("zh-CN")
    .replace(PUNCTUATION_PATTERN, "");
}

/** 生成字符 n-gram 集合。中文按字符切分适合 2-gram。 */
export function characterNgrams(text: string, n = 2): Set<string> {
  const normalized = normalizeTitle(text);
  const grams = new Set<string>();
  if (normalized.length < n) {
    if (normalized.length > 0) {
      grams.add(normalized);
    }
    return grams;
  }
  for (let i = 0; i <= normalized.length - n; i += 1) {
    grams.add(normalized.slice(i, i + n));
  }
  return grams;
}

/** Jaccard 相似度：|A∩B| / |A∪B|。输入为 n-gram 集合。 */
export function jaccardSimilarity(a: Set<string>, b: Set<string>): number {
  if (a.size === 0 && b.size === 0) {
    return 0;
  }
  let intersection = 0;
  for (const gram of a) {
    if (b.has(gram)) {
      intersection += 1;
    }
  }
  const union = a.size + b.size - intersection;
  return union === 0 ? 0 : intersection / union;
}

function titleSimilarity(a: string, b: string): number {
  return jaccardSimilarity(characterNgrams(a, 2), characterNgrams(b, 2));
}

function summarySimilarity(a: string, b: string): number {
  return jaccardSimilarity(characterNgrams(a, 2), characterNgrams(b, 2));
}

function normalizeUrlKey(url?: string): string | null {
  if (!url) {
    return null;
  }
  try {
    const parsed = new URL(url);
    return `${parsed.protocol}//${parsed.host}${parsed.pathname.replace(/\/$/, "")}`;
  } catch {
    return null;
  }
}

/**
 * 判定两篇文章是否重复。
 */
export function isDuplicate(a: RankedNewsArticle, b: RankedNewsArticle): boolean {
  const urlA = normalizeUrlKey(a.article.sourceUrl);
  const urlB = normalizeUrlKey(b.article.sourceUrl);
  if (urlA && urlB && urlA === urlB) {
    return true;
  }

  const titleA = normalizeTitle(a.article.title);
  const titleB = normalizeTitle(b.article.title);
  if (titleA.length > 0 && titleA === titleB) {
    return true;
  }

  const titleNgram = titleSimilarity(a.article.title, b.article.title);
  if (titleNgram >= DEDUP_THRESHOLDS.titleNgram) {
    return true;
  }

  if (titleNgram >= DEDUP_THRESHOLDS.titleSimilarity) {
    const summary = summarySimilarity(
      a.article.description,
      b.article.description,
    );
    if (summary >= DEDUP_THRESHOLDS.summarySimilarity) {
      return true;
    }
  }
  return false;
}

/**
 * 找出所有重复分组。返回每个分组的成员索引数组。
 * 使用并查集合并传递性重复。
 */
export function findDuplicateGroups(
  articles: RankedNewsArticle[],
): number[][] {
  const parent = articles.map((_, index) => index);

  function find(i: number): number {
    while (parent[i] !== i) {
      parent[i] = parent[parent[i]];
      i = parent[i];
    }
    return i;
  }

  function union(a: number, b: number): void {
    const ra = find(a);
    const rb = find(b);
    if (ra !== rb) {
      parent[ra] = rb;
    }
  }

  for (let i = 0; i < articles.length; i += 1) {
    for (let j = i + 1; j < articles.length; j += 1) {
      if (isDuplicate(articles[i], articles[j])) {
        union(i, j);
      }
    }
  }

  const groups = new Map<number, number[]>();
  for (let i = 0; i < articles.length; i += 1) {
    const root = find(i);
    const group = groups.get(root);
    if (group) {
      group.push(i);
    } else {
      groups.set(root, [i]);
    }
  }

  return Array.from(groups.values()).filter((group) => group.length > 0);
}

/** 比较两篇文章谁应保留。返回 true 表示 a 更优。 */
function isBetterKeeper(a: RankedNewsArticle, b: RankedNewsArticle): boolean {
  if (a.score.total !== b.score.total) {
    return a.score.total > b.score.total;
  }
  if (a.score.completeness !== b.score.completeness) {
    return a.score.completeness > b.score.completeness;
  }
  const aHasUrl = a.article.sourceUrl ? 1 : 0;
  const bHasUrl = b.article.sourceUrl ? 1 : 0;
  if (aHasUrl !== bHasUrl) {
    return aHasUrl > bHasUrl;
  }
  return a.article.id <= b.article.id;
}

/**
 * 去重：每个重复组保留最优文章，其余被丢弃。
 * 返回去重后的文章列表（保留原相对顺序）。
 */
export function deduplicateArticles(
  articles: RankedNewsArticle[],
): RankedNewsArticle[] {
  const groups = findDuplicateGroups(articles);
  const losers = new Set<number>();

  for (const group of groups) {
    if (group.length <= 1) {
      continue;
    }
    let keeper = group[0];
    for (let i = 1; i < group.length; i += 1) {
      if (isBetterKeeper(articles[group[i]], articles[keeper])) {
        keeper = group[i];
      }
    }
    for (const index of group) {
      if (index !== keeper) {
        losers.add(index);
      }
    }
  }

  return articles.filter((_, index) => !losers.has(index));
}
