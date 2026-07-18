import { describe, expect, it } from "vitest";
import type { NewsArticle } from "@/types";
import { SCORE_WEIGHTS } from "@/types/backend";
import {
  clampCandidates,
  scoreArticle,
  scoreCompleteness,
  scoreRecency,
  scoreRelevance,
} from "@/lib/news/ranking";

const NOW = Date.parse("2026-07-18T12:00:00.000Z");

function article(opts: Partial<NewsArticle>): NewsArticle {
  return {
    id: opts.id ?? "a",
    title: opts.title ?? "标题",
    description: opts.description ?? "描述",
    source: opts.source ?? "TodayPaper 演示资料库",
    publishedAt: opts.publishedAt ?? "2026-07-18T10:00:00.000Z",
    category: opts.category ?? "人工智能教育",
    keywords: opts.keywords ?? [],
    content: opts.content,
    sourceUrl: opts.sourceUrl,
    imageUrl: opts.imageUrl,
  };
}

describe("scoreRelevance", () => {
  it("标题匹配权重大于描述", () => {
    const query = "人工智能教育";
    const inTitle = article({
      title: "人工智能教育新进展",
      description: "不相关描述",
      keywords: [],
      category: "其他",
    });
    const inDescription = article({
      title: "不相关标题",
      description: "人工智能教育相关讨论",
      keywords: [],
      category: "其他",
    });
    expect(scoreRelevance(query, inTitle)).toBeGreaterThan(
      scoreRelevance(query, inDescription),
    );
  });

  it("空查询返回 0", () => {
    expect(scoreRelevance("", article({}))).toBe(0);
  });

  it("完全出现在标题中给最高权重", () => {
    expect(scoreRelevance("人工智能教育", article({ title: "人工智能教育" }))).toBe(
      100,
    );
  });
});

describe("scoreRecency（注入时间）", () => {
  it("12 小时内高于 100 小时", () => {
    const recent = scoreRecency("2026-07-18T06:00:00.000Z", NOW);
    const older = scoreRecency("2026-07-14T08:00:00.000Z", NOW);
    expect(recent).toBeGreaterThan(older);
  });

  it("24 小时内在 80～100 之间", () => {
    const score = scoreRecency("2026-07-18T00:00:00.000Z", NOW);
    expect(score).toBeGreaterThanOrEqual(80);
    expect(score).toBeLessThanOrEqual(100);
  });

  it("7 天外在 0～20 之间", () => {
    const score = scoreRecency("2026-07-01T00:00:00.000Z", NOW);
    expect(score).toBeGreaterThanOrEqual(0);
    expect(score).toBeLessThanOrEqual(20);
  });

  it("无效时间返回 0", () => {
    expect(scoreRecency("bad", NOW)).toBe(0);
  });
});

describe("综合分数权重", () => {
  it("权重为 50/20/15/15 且和为 1", () => {
    expect(SCORE_WEIGHTS.relevance).toBe(0.5);
    expect(SCORE_WEIGHTS.recency).toBe(0.2);
    expect(SCORE_WEIGHTS.sourceQuality).toBe(0.15);
    expect(SCORE_WEIGHTS.completeness).toBe(0.15);
    const sum =
      SCORE_WEIGHTS.relevance +
      SCORE_WEIGHTS.recency +
      SCORE_WEIGHTS.sourceQuality +
      SCORE_WEIGHTS.completeness;
    expect(sum).toBeCloseTo(1, 5);
  });

  it("total 符合权重公式并四舍五入到 0～100", () => {
    const a = article({
      title: "人工智能教育",
      description: "人工智能教育质量框架讨论",
      publishedAt: "2026-07-18T10:00:00.000Z",
      keywords: ["人工智能教育"],
      sourceUrl: "https://x.com/1",
      imageUrl: "/images/demo/ai-lab.svg",
      content: "正文内容",
    });
    const score = scoreArticle("人工智能教育", a, NOW);
    const expected = Math.round(
      score.relevance * SCORE_WEIGHTS.relevance +
        score.recency * SCORE_WEIGHTS.recency +
        score.sourceQuality * SCORE_WEIGHTS.sourceQuality +
        score.completeness * SCORE_WEIGHTS.completeness,
    );
    expect(score.total).toBe(Math.max(0, Math.min(100, expected)));
    expect(score.total).toBeGreaterThanOrEqual(0);
    expect(score.total).toBeLessThanOrEqual(100);
  });
});

describe("scoreCompleteness", () => {
  it("字段齐全得分高", () => {
    const full = article({
      description: "合理的描述内容",
      content: "正文",
      sourceUrl: "https://x.com/1",
      imageUrl: "/images/demo/ai-lab.svg",
      keywords: ["人工智能教育"],
    });
    expect(scoreCompleteness(full)).toBe(100);
  });

  it("仅有描述得分较低", () => {
    const minimal = article({ description: "短" });
    expect(scoreCompleteness(minimal)).toBeLessThan(50);
  });
});

describe("clampCandidates", () => {
  it("负数或非法回退到上限", () => {
    expect(clampCandidates(-1)).toBe(50);
    expect(clampCandidates(NaN)).toBe(50);
  });

  it("超过上限截断", () => {
    expect(clampCandidates(999)).toBe(50);
  });
});
