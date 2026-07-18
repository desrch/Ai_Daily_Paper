import type { NewsAngle } from "@/types";
import type { RankedNewsArticle } from "@/types/backend";

/**
 * 报道角度分类与多样性选择。先关键词规则确定性分类，AI 分类只作可选增强。
 * 角度枚举与前端冻结类型一致：政策/技术/产业/应用/市场。
 */

const ANGLE_RULES: Array<{ angle: NewsAngle; keywords: string[] }> = [
  {
    angle: "政策",
    keywords: ["政策", "法规", "监管", "规划", "教育部", "政府", "原则", "框架", "合规"],
  },
  {
    angle: "技术",
    keywords: ["模型", "算法", "芯片", "系统", "研发", "推理", "多模态", "轻量模型"],
  },
  {
    angle: "产业",
    keywords: ["企业", "产业链", "商业化", "公司", "供给", "人机协同", "内容生产", "行业"],
  },
  {
    angle: "应用",
    keywords: ["课堂", "学校", "医疗", "产品", "场景", "试点", "课后", "校园"],
  },
  {
    angle: "市场",
    keywords: ["投资", "融资", "规模", "增长", "股价", "市场观察", "商业模式", "续费"],
  },
];

const DEFAULT_ANGLE: NewsAngle = "技术";

function normalizeText(text: string): string {
  return text.normalize("NFKC").toLocaleLowerCase("zh-CN");
}

/** 关键词规则确定性分类。无匹配时回退到默认角度（技术）。 */
export function classifyAngle(input: {
  title: string;
  description: string;
  keywords: string[];
  category?: string;
}): NewsAngle {
  const haystack = normalizeText(
    [input.title, input.description, input.category ?? "", ...input.keywords].join(
      " ",
    ),
  );

  for (const rule of ANGLE_RULES) {
    if (rule.keywords.some((keyword) => haystack.includes(normalizeText(keyword)))) {
      return rule.angle;
    }
  }
  return DEFAULT_ANGLE;
}

export interface DiversifyOptions {
  targetCount?: number;
  /** 同角度重复出现的惩罚分。 */
  sameAnglePenalty?: number;
  /** 低于此相关度且角度已覆盖时不强行凑数。 */
  minRelevance?: number;
}

function clampCount(value: number | undefined, fallback: number): number {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return fallback;
  }
  return Math.min(Math.max(Math.floor(value), 3), 5);
}

/**
 * 多样性选择：优先覆盖不同角度；同角度后续文章施加惩罚。
 * 不为了角度多样性选择明显低相关内容。
 */
export function diversifySelection(
  ranked: RankedNewsArticle[],
  options: DiversifyOptions = {},
): RankedNewsArticle[] {
  const targetCount = clampCount(options.targetCount, 4);
  const penalty = options.sameAnglePenalty ?? 25;
  const minRelevance = options.minRelevance ?? 20;

  const remaining = [...ranked].sort((a, b) => b.score.total - a.score.total);
  const picked: RankedNewsArticle[] = [];
  const angleCount = new Map<NewsAngle, number>();

  while (picked.length < targetCount && remaining.length > 0) {
    let bestIndex = 0;
    let bestScore = Number.NEGATIVE_INFINITY;

    for (let i = 0; i < remaining.length; i += 1) {
      const candidate = remaining[i];
      const seen = angleCount.get(candidate.angle) ?? 0;
      const effective = candidate.score.total - seen * penalty;
      if (effective > bestScore) {
        bestScore = effective;
        bestIndex = i;
      }
    }

    // 已有足够覆盖且剩余明显低相关时不强行凑数。
    if (
      picked.length >= 3 &&
      remaining[bestIndex].score.relevance < minRelevance
    ) {
      break;
    }

    const [chosen] = remaining.splice(bestIndex, 1);
    picked.push(chosen);
    angleCount.set(chosen.angle, (angleCount.get(chosen.angle) ?? 0) + 1);
  }

  return picked;
}
