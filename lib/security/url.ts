/**
 * URL 安全处理。仅允许 http/https；不抓取用户传入的任意 URL，避免 SSRF。
 */

/** 判断字符串是否为合法 http/https URL。 */
export function isHttpUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

/**
 * 规范化 sourceUrl / imageUrl：仅当合法 http(s) 时保留，否则返回 undefined。
 * 非法 imageUrl 不应让整篇文章失败，调用方对 undefined 容错。
 */
export function sanitizeHttpUrl(value: string | undefined): string | undefined {
  if (typeof value !== "string") {
    return undefined;
  }
  const trimmed = value.trim();
  if (trimmed.length === 0) {
    return undefined;
  }
  return isHttpUrl(trimmed) ? trimmed : undefined;
}

/**
 * 图片地址校验：允许 http(s) URL 或以 / 开头的本地绝对路径（与前端 imageLocationSchema 对齐）。
 */
export function sanitizeImageUrl(value: string | undefined): string | undefined {
  if (typeof value !== "string") {
    return undefined;
  }
  const trimmed = value.trim();
  if (trimmed.length === 0) {
    return undefined;
  }
  if (trimmed.startsWith("/")) {
    return trimmed;
  }
  return isHttpUrl(trimmed) ? trimmed : undefined;
}
