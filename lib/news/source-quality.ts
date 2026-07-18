/**
 * 来源质量等级表。可维护、可测试。未知来源使用中性默认分，不直接判低质量。
 * 评分仅用于排序加权，不代表事实核查结论。
 */

export interface SourceQualityRule {
  match: string;
  quality: number;
}

/** 中性默认分（0～100）。 */
export const DEFAULT_SOURCE_QUALITY = 60;

/** 服务端配置的来源等级表。键为规范化后小写来源名。 */
const SOURCE_QUALITY_TABLE: SourceQualityRule[] = [
  { match: "todaypaper 演示资料库", quality: 82 },
  { match: "新华社", quality: 88 },
  { match: "人民日报", quality: 87 },
  { match: "新华网", quality: 85 },
  { match: "央视网", quality: 84 },
  { match: "财新网", quality: 83 },
  { match: "第一财经", quality: 78 },
  { match: "36氪", quality: 74 },
  { match: "机器之心", quality: 76 },
];

function normalizeSourceName(source: string): string {
  return source.trim().toLocaleLowerCase("zh-CN");
}

/** 获取来源质量分。精确匹配优先，否则前缀包含，否则中性默认。 */
export function getSourceQuality(source: string | undefined): number {
  if (!source) {
    return DEFAULT_SOURCE_QUALITY;
  }
  const normalized = normalizeSourceName(source);
  if (normalized.length === 0) {
    return DEFAULT_SOURCE_QUALITY;
  }

  const exact = SOURCE_QUALITY_TABLE.find((rule) => rule.match === normalized);
  if (exact) {
    return exact.quality;
  }

  const partial = SOURCE_QUALITY_TABLE.find((rule) =>
    normalized.includes(rule.match),
  );
  if (partial) {
    return partial.quality;
  }

  return DEFAULT_SOURCE_QUALITY;
}
