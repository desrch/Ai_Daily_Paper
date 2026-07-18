/**
 * 确定性稳定 ID 生成。不使用随机数，保证同一输入在同一进程、不同运行产生相同 ID。
 * 用于没有源 ID 的新闻文章：优先 source + sourceUrl + title 组合。
 */

const FNV_OFFSET = 0x811c9dc5;
const FNV_PRIME = 0x01000193;

/** 32-bit FNV-1a 哈希，返回无符号整数。 */
function fnv1a(input: string): number {
  let hash = FNV_OFFSET;
  for (let i = 0; i < input.length; i += 1) {
    hash ^= input.charCodeAt(i);
    hash = Math.imul(hash, FNV_PRIME);
  }
  return hash >>> 0;
}

/** 对任意长度输入生成稳定 64-bit 风格 hex（两个 32-bit 拼接）。 */
export function stableHash(input: string): string {
  const first = fnv1a(input).toString(16).padStart(8, "0");
  const second = fnv1a(`${input}${first}`).toString(16).padStart(8, "0");
  return `${first}${second}`;
}

/**
 * 为新闻文章生成稳定 ID。
 * 优先使用提供的 sourceId；否则用 source + sourceUrl + title 组合哈希。
 */
export function createArticleId(parts: {
  sourceId?: string;
  source: string;
  sourceUrl?: string;
  title: string;
}): string {
  if (parts.sourceId && parts.sourceId.trim().length > 0) {
    return parts.sourceId.trim();
  }

  const material = [parts.source, parts.sourceUrl ?? "", parts.title]
    .map((value) => value.trim())
    .join("|");

  return `art-${stableHash(material)}`;
}
