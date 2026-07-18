import { describe, expect, it } from "vitest";
import type { NewsAngle } from "@/types";
import type { RankedNewsArticle } from "@/types/backend";
import { classifyAngle, diversifySelection } from "@/lib/news/angles";

function ranked(
  id: string,
  angle: NewsAngle,
  total: number,
  relevance = 50,
): RankedNewsArticle {
  return {
    article: {
      id,
      title: id,
      description: id,
      source: "TodayPaper 演示资料库",
      publishedAt: "2026-07-18T01:30:00.000Z",
      category: "人工智能教育",
      keywords: [],
    },
    score: {
      relevance,
      recency: 50,
      sourceQuality: 60,
      completeness: 40,
      total,
    },
    angle,
  };
}

describe("classifyAngle", () => {
  it("政策关键词分类为政策", () => {
    expect(
      classifyAngle({
        title: "教育部发布规划",
        description: "",
        keywords: [],
      }),
    ).toBe("政策");
  });

  it("技术关键词分类为技术", () => {
    expect(
      classifyAngle({ title: "新模型与算法", description: "", keywords: [] }),
    ).toBe("技术");
  });

  it("市场关键词分类为市场", () => {
    expect(
      classifyAngle({ title: "融资与投资增长", description: "", keywords: [] }),
    ).toBe("市场");
  });

  it("无匹配回退到默认角度技术", () => {
    expect(
      classifyAngle({ title: "天气晴朗", description: "今日天气", keywords: [] }),
    ).toBe("技术");
  });
});

describe("diversifySelection", () => {
  it("优先覆盖不同角度", () => {
    const input = [
      ranked("a", "政策", 90),
      ranked("b", "技术", 85),
      ranked("c", "产业", 80),
      ranked("d", "应用", 75),
      ranked("e", "市场", 70),
    ];
    const result = diversifySelection(input, { targetCount: 4 });
    expect(result).toHaveLength(4);
    const angles = new Set(result.map((r) => r.angle));
    expect(angles.size).toBe(4);
  });

  it("低相关内容不因角度不同被错误选中", () => {
    const input = [
      ranked("high-policy", "政策", 80, 80),
      ranked("high-tech", "技术", 80, 80),
      ranked("high-industry", "产业", 80, 80),
      ranked("high-app", "应用", 80, 80),
      ranked("low-market", "市场", 60, 5),
    ];
    const result = diversifySelection(input, { targetCount: 4 });
    expect(result).toHaveLength(4);
    expect(result.map((r) => r.article.id)).not.toContain("low-market");
  });

  it("targetCount 被限制在 3～5", () => {
    const input = [
      ranked("a", "政策", 90),
      ranked("b", "技术", 85),
      ranked("c", "产业", 80),
      ranked("d", "应用", 75),
      ranked("e", "市场", 70),
    ];
    expect(diversifySelection(input, { targetCount: 1 })).toHaveLength(3);
    expect(diversifySelection(input, { targetCount: 99 })).toHaveLength(5);
  });

  it("同角度后续文章被惩罚", () => {
    const input = [
      ranked("a", "政策", 90),
      ranked("b", "政策", 88),
      ranked("c", "技术", 70),
    ];
    const result = diversifySelection(input, { targetCount: 2 });
    // a 与 c（不同角度）应优先于第二个政策 b。
    const ids = result.map((r) => r.article.id);
    expect(ids).toContain("a");
    expect(ids).toContain("c");
    expect(ids).not.toContain("b");
  });
});
