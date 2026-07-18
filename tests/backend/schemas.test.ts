import { describe, expect, it } from "vitest";
import {
  generateTopicPosterInputSchema,
  searchNewsItemSchema,
  searchNewsParamsSchema,
  searchNewsResponseSchema,
} from "@/lib/api/schemas";

describe("searchNewsParamsSchema", () => {
  it("接受合法输入并填充默认 timeRange", () => {
    const parsed = searchNewsParamsSchema.parse({ keyword: "人工智能教育" });
    expect(parsed.timeRange).toBe("7d");
  });

  it("拒绝空关键词", () => {
    expect(() => searchNewsParamsSchema.parse({ keyword: "" })).toThrow();
    expect(() => searchNewsParamsSchema.parse({ keyword: "   " })).toThrow();
  });

  it("拒绝超长关键词", () => {
    expect(() =>
      searchNewsParamsSchema.parse({ keyword: "x".repeat(51) }),
    ).toThrow();
  });

  it("拒绝非法 timeRange", () => {
    expect(() =>
      searchNewsParamsSchema.parse({ keyword: "AI", timeRange: "3d" }),
    ).toThrow();
  });
});

describe("generateTopicPosterInputSchema（3～5 约束）", () => {
  it("拒绝少于 3 篇", () => {
    expect(() =>
      generateTopicPosterInputSchema.parse({
        keyword: "人工智能教育",
        articleIds: ["a", "b"],
        template: "classic",
      }),
    ).toThrow();
  });

  it("拒绝多于 5 篇", () => {
    expect(() =>
      generateTopicPosterInputSchema.parse({
        keyword: "人工智能教育",
        articleIds: ["a", "b", "c", "d", "e", "f"],
        template: "classic",
      }),
    ).toThrow();
  });

  it("接受 3～5 篇", () => {
    const parsed = generateTopicPosterInputSchema.parse({
      keyword: "人工智能教育",
      articleIds: ["a", "b", "c", "d"],
      template: "classic",
    });
    expect(parsed.articleIds).toHaveLength(4);
  });
});

describe("searchNewsItemSchema / response", () => {
  const demoItem = {
    id: "demo-news-policy-01",
    title: "演示｜智能教育质量框架进入公开讨论阶段",
    description: "这是一条演示内容",
    source: "TodayPaper 演示资料库",
    publishedAt: "2026-07-18T01:30:00.000Z",
    category: "人工智能教育",
    imageUrl: "/images/demo/education.svg",
    keywords: ["人工智能教育"],
    relevanceScore: 96,
    angle: "政策",
  };

  it("校验合法搜索结果项", () => {
    expect(searchNewsItemSchema.parse(demoItem).angle).toBe("政策");
  });

  it("拒绝非法角度", () => {
    expect(() =>
      searchNewsItemSchema.parse({ ...demoItem, angle: "其他" }),
    ).toThrow();
  });

  it("校验完整响应结构", () => {
    const parsed = searchNewsResponseSchema.parse({
      query: "人工智能教育",
      timeRange: "7d",
      items: [demoItem],
      total: 1,
    });
    expect(parsed.total).toBe(1);
  });
});
