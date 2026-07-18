import { describe, expect, it } from "vitest";
import type { NewsAngle } from "@/types";
import type { RankedNewsArticle } from "@/types/backend";
import {
  characterNgrams,
  deduplicateArticles,
  findDuplicateGroups,
  isDuplicate,
  jaccardSimilarity,
  normalizeTitle,
} from "@/lib/news/dedup";

function ranked(opts: {
  id: string;
  title: string;
  description?: string;
  sourceUrl?: string;
  total?: number;
  relevance?: number;
  completeness?: number;
  angle?: NewsAngle;
}): RankedNewsArticle {
  return {
    article: {
      id: opts.id,
      title: opts.title,
      description: opts.description ?? "演示描述内容",
      source: "TodayPaper 演示资料库",
      publishedAt: "2026-07-18T01:30:00.000Z",
      category: "人工智能教育",
      keywords: [],
      sourceUrl: opts.sourceUrl,
    },
    score: {
      relevance: opts.relevance ?? 50,
      recency: 50,
      sourceQuality: 60,
      completeness: opts.completeness ?? 40,
      total: opts.total ?? 50,
    },
    angle: opts.angle ?? "技术",
  };
}

describe("characterNgrams / jaccardSimilarity", () => {
  it("生成 2-gram 集合", () => {
    expect(characterNgrams("abcd", 2)).toEqual(new Set(["ab", "bc", "cd"]));
  });

  it("短文本退化为整体", () => {
    expect(characterNgrams("a", 2)).toEqual(new Set(["a"]));
  });

  it("jaccard 相似度计算", () => {
    const a = new Set(["ab", "bc", "cd"]);
    const b = new Set(["ab", "bc", "de"]);
    // 交集 2，并集 4 → 0.5
    expect(jaccardSimilarity(a, b)).toBeCloseTo(0.5, 5);
  });

  it("空集合相似度为 0", () => {
    expect(jaccardSimilarity(new Set(), new Set())).toBe(0);
  });
});

describe("完全重复 URL 去重", () => {
  it("相同规范化 URL 判定重复", () => {
    const a = ranked({ id: "a", title: "标题甲", sourceUrl: "https://x.com/news/1?from=home" });
    const b = ranked({ id: "b", title: "标题乙", sourceUrl: "https://x.com/news/1" });
    expect(isDuplicate(a, b)).toBe(true);
  });

  it("被 findDuplicateGroups 合并为一组", () => {
    const a = ranked({ id: "a", title: "甲", sourceUrl: "https://x.com/1" });
    const b = ranked({ id: "b", title: "乙", sourceUrl: "https://x.com/1" });
    const groups = findDuplicateGroups([a, b]);
    expect(groups.length).toBe(1);
    expect(groups[0]).toHaveLength(2);
  });

  it("deduplicateArticles 保留一篇", () => {
    const a = ranked({ id: "a", title: "甲", sourceUrl: "https://x.com/1", total: 40 });
    const b = ranked({ id: "b", title: "乙", sourceUrl: "https://x.com/1", total: 80 });
    const kept = deduplicateArticles([a, b]);
    expect(kept).toHaveLength(1);
    expect(kept[0].article.id).toBe("b");
  });
});

describe("高相似标题去重", () => {
  it("标题 2-gram Jaccard >= 0.82 判定重复", () => {
    const a = ranked({ id: "a", title: "人工智能教育质量框架进入公开讨论" });
    const b = ranked({ id: "b", title: "人工智能教育质量框架公开讨论" });
    expect(isDuplicate(a, b)).toBe(true);
  });

  it("标题完全一致判定重复", () => {
    const a = ranked({ id: "a", title: "完全相同的标题" });
    const b = ranked({ id: "b", title: "完全相同的标题" });
    expect(isDuplicate(a, b)).toBe(true);
  });

  it("不相关标题不判定重复", () => {
    const a = ranked({ id: "a", title: "人工智能教育新进展" });
    const b = ranked({ id: "b", title: "商业财经周报观察" });
    expect(isDuplicate(a, b)).toBe(false);
  });
});

describe("重复组保留高质量文章", () => {
  it("保留 total 更高的文章", () => {
    const low = ranked({ id: "low", title: "同一事件报道", total: 30 });
    const high = ranked({ id: "high", title: "同一事件报道", total: 90 });
    const kept = deduplicateArticles([low, high]);
    expect(kept).toHaveLength(1);
    expect(kept[0].article.id).toBe("high");
  });

  it("total 相同时保留更完整的文章", () => {
    const less = ranked({ id: "less", title: "重复标题", total: 60, completeness: 40 });
    const more = ranked({ id: "more", title: "重复标题", total: 60, completeness: 90 });
    const kept = deduplicateArticles([less, more]);
    expect(kept[0].article.id).toBe("more");
  });

  it("保留有 sourceUrl 的文章", () => {
    const noUrl = ranked({ id: "nourl", title: "重复标题", total: 60 });
    const withUrl = ranked({ id: "withurl", title: "重复标题", total: 60, completeness: 40, sourceUrl: "https://x.com/1" });
    const kept = deduplicateArticles([noUrl, withUrl]);
    expect(kept[0].article.id).toBe("withurl");
  });
});
