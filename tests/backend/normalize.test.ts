import { describe, expect, it } from "vitest";
import {
  collapseWhitespace,
  normalizeArticle,
  normalizeKeywords,
  normalizePublishedAt,
  normalizeTextField,
  stripHtml,
} from "@/lib/news/normalize";
import { normalizeTitle } from "@/lib/news/dedup";

describe("stripHtml / collapseWhitespace / normalizeTextField", () => {
  it("去除 HTML 标签并解码实体", () => {
    expect(stripHtml("<p>Hello &amp; <b>world</b></p>")).toBe("Hello & world");
  });

  it("折叠连续空白并 trim", () => {
    expect(collapseWhitespace("  人工智能   教育  ")).toBe("人工智能 教育");
  });

  it("normalizeTextField 组合处理", () => {
    expect(normalizeTextField("  <a>AI 教育</a>  ")).toBe("AI 教育");
  });
});

describe("normalizeTitle（用于相似度比较）", () => {
  it("中文：去标点与空白、小写", () => {
    expect(normalizeTitle("AI，教育！政策？")).toBe("ai教育政策");
  });

  it("英文：小写、去标点与空白", () => {
    expect(normalizeTitle("Hello, World!")).toBe("helloworld");
  });

  it("全角与半角归一", () => {
    expect(normalizeTitle("ＡＩ教育")).toBe("ai教育");
  });
});

describe("normalizeKeywords", () => {
  it("去重并清理空白", () => {
    expect(normalizeKeywords([" AI ", "ai", "教育", " 教育 "])).toEqual([
      "AI",
      "教育",
    ]);
  });

  it("非数组或空值返回空数组", () => {
    expect(normalizeKeywords(undefined)).toEqual([]);
    expect(normalizeKeywords([])).toEqual([]);
  });
});

describe("normalizePublishedAt", () => {
  it("ISO 字符串转 UTC ISO", () => {
    expect(normalizePublishedAt("2026-07-18T01:30:00.000Z")).toBe(
      "2026-07-18T01:30:00.000Z",
    );
  });

  it("无效时间返回 null", () => {
    expect(normalizePublishedAt("not-a-date")).toBeNull();
    expect(normalizePublishedAt(undefined)).toBeNull();
  });
});

describe("normalizeArticle", () => {
  const valid = {
    id: "demo-1",
    title: "演示标题",
    description: "演示描述内容",
    source: "TodayPaper 演示资料库",
    publishedAt: "2026-07-18T01:30:00.000Z",
    category: "人工智能教育",
    keywords: ["人工智能教育"],
  };

  it("保留提供 sourceId 作为稳定 id", () => {
    expect(normalizeArticle(valid)?.id).toBe("demo-1");
  });

  it("必填字段缺失返回 null", () => {
    expect(normalizeArticle({ ...valid, title: "" })).toBeNull();
    expect(normalizeArticle({ ...valid, publishedAt: "bad" })).toBeNull();
    expect(normalizeArticle({ ...valid, source: "  " })).toBeNull();
  });

  it("非法 imageUrl 被丢弃但不让文章失败", () => {
    const article = normalizeArticle({
      ...valid,
      imageUrl: "javascript:alert(1)",
    });
    expect(article).not.toBeNull();
    expect(article?.imageUrl).toBeUndefined();
  });

  it("非法 sourceUrl 被丢弃", () => {
    const article = normalizeArticle({ ...valid, sourceUrl: "ftp://x" });
    expect(article?.sourceUrl).toBeUndefined();
  });

  it("content 超长被截断", () => {
    const long = "x".repeat(10000);
    const article = normalizeArticle({ ...valid, content: long });
    expect(article?.content?.length).toBeLessThanOrEqual(8000);
  });
});
