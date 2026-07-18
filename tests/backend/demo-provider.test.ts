import { describe, expect, it } from "vitest";
import {
  DemoNewsProvider,
  getDemoArticles,
} from "@/lib/news/providers/demo-provider";

const NOW = Date.parse("2026-07-18T12:00:00.000Z");

describe("DemoNewsProvider", () => {
  it("从 demo JSON 读取并规范化", () => {
    const articles = getDemoArticles();
    expect(articles.length).toBeGreaterThan(0);
    for (const article of articles) {
      expect(article.id.length).toBeGreaterThan(0);
      expect(article.title.length).toBeGreaterThan(0);
      expect(article.publishedAt).toMatch(/^\d{4}-\d{2}-\d{2}T/);
    }
  });

  it("ID 稳定不随启动变化", () => {
    const first = getDemoArticles().map((a) => a.id);
    const second = getDemoArticles().map((a) => a.id);
    expect(first).toEqual(second);
  });

  it("按关键词返回匹配文章", async () => {
    const provider = new DemoNewsProvider();
    const result = await provider.search({ query: "人工智能教育" });
    expect(result.length).toBeGreaterThan(0);
  });

  it("无匹配返回空数组", async () => {
    const provider = new DemoNewsProvider();
    const result = await provider.search({ query: "zzznomatchzzz" });
    expect(result).toEqual([]);
  });

  it("按时间范围过滤", async () => {
    const provider = new DemoNewsProvider();
    const recent = await provider.search({
      query: "人工智能教育",
      from: new Date(NOW - 3 * 24 * 3_600_000).toISOString(),
      to: new Date(NOW).toISOString(),
    });
    const older = await provider.search({
      query: "人工智能教育",
      from: new Date(NOW - 30 * 24 * 3_600_000).toISOString(),
      to: new Date(NOW).toISOString(),
    });
    expect(older.length).toBeGreaterThanOrEqual(recent.length);
  });

  it("limit 限制返回数量", async () => {
    const provider = new DemoNewsProvider();
    const result = await provider.search({
      query: "人工智能教育",
      limit: 2,
    });
    expect(result.length).toBeLessThanOrEqual(2);
  });
});
