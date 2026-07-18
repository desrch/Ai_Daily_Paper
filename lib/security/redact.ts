/**
 * 日志脱敏。不在日志记录 Authorization、API Key、Cookie、完整邮箱、完整新闻正文。
 */

const SECRET_PATTERNS: Array<{
  pattern: RegExp;
  replacement: string | ((match: string) => string);
}> = [
  { pattern: /authorization:\s*[^\s]+/gi, replacement: "authorization: ***" },
  { pattern: /api[_-]?key=([^\s&]+)/gi, replacement: "api_key=***" },
  { pattern: /sk-[A-Za-z0-9]{8,}/g, replacement: "sk-***" },
  {
    pattern: /([A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,})/g,
    replacement: (match: string) => maskEmail(match),
  },
];

function maskEmail(email: string): string {
  const [local, domain] = email.split("@");
  if (!domain) {
    return "***";
  }
  const visible = local.slice(0, Math.min(2, local.length));
  return `${visible}***@${domain}`;
}

/** 对日志字符串脱敏。 */
export function redactLog(input: string): string {
  let result = input;
  for (const { pattern, replacement } of SECRET_PATTERNS) {
    result =
      typeof replacement === "string"
        ? result.replace(pattern, replacement)
        : result.replace(pattern, replacement);
  }
  return result;
}

/** 截断长正文，避免完整新闻正文进入日志。 */
export function truncateForLog(value: string, max = 200): string {
  if (value.length <= max) {
    return value;
  }
  return `${value.slice(0, max)}…(${value.length} chars)`;
}
