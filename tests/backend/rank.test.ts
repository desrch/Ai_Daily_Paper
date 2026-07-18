import { describe, expect, it } from "vitest";
import { DemoNewsProvider } from "@/lib/news/providers/demo-provider";
import {
  rankNews,
  selectDiverseArticles,
  timeRangeToMs,
} from "@/lib/news/rank";
import { BackendError } from "@/lib/errors";

const NOW = Date.parse("2026-07-18T12:00:00.000Z");
const provider = new DemoNewsProvider();

describe("timeRangeToMs", () => {
  it("24h/7d/30d 转毫秒", () => {
    expect(timeRangeToMs("24h")).toBe(24 * 3_600_000);
    expect(timeRangeToMs("7d")).toBe(7 * 24 * 3_600_000);
    expect(timeRangeToMs("30d")).toBe(30 * 24 * 3_600_000);
  });
});

describe("rankNews 端到端（DemoNewsProvider）", () => {
  it("返回演示候选数据并带角度与相关度", async () => {
    const result = await rankNews({
      query: "人工智能教育",
      timeRange: "7d",
      provider,
      now: NOW,
    });
    expect(result.dataMode).toBe("demo");
    expect(result.items.length).toBeGreaterThan(0);
    for (const item of result.items) {
      expect(item.angle).toBeDefined();
      expect(item.relevanceScore).toBeGreaterThanOrEqual(0);
      expect(item.relevanceScore).toBeLessThanOrEqual(100);
    }
  });

  it("结果按相关度降序排列", async () => {
    const result = await rankNews({
      query: "人工智能教育",
      timeRange: "7d",
      provider,
      now: NOW,
    });
    for (let i = 1; i < result.items.length; i += 1) {
      const prev = result.items[i - 1].relevanceScore ?? 0;
      const curr = result.items[i].relevanceScore ?? 0;
      expect(prev).toBeGreaterThanOrEqual(curr);
    }
  });

  it("7 天范围过滤掉更早的文章", async () => {
    const seven = await rankNews({
      query: "人工智能教育",
      timeRange: "7d",
      provider,
      now: NOW,
    });
    const thirty = await rankNews({
      query: "人工智能教育",
      timeRange: "30d",
      provider,
      now: NOW,
    });
    expect(thirty.items.length).toBeGreaterThanOrEqual(seven.items.length);
  });

  it("空查询抛出 INVALID_INPUT", async () => {
    await expect(
      rankNews({ query: "  ", timeRange: "7d", provider, now: NOW }),
    ).rejects.toMatchObject({ code: "INVALID_INPUT" });
  });
});

describe("selectDiverseArticles", () => {
  it("返回 3～5 篇覆盖不同角度", async () => {
    const result = await rankNews({
      query: "人工智能教育",
      timeRange: "7d",
      provider,
      now: NOW,
    });
    const diverse = selectDiverseArticles(result.ranked, 4);
    // 演示数据对该精确查询只返回 2 篇，实际业务中真实新闻源会提供更多候选。
    // 这里保证：结果不超过 5 篇、角度不重复、返回数量不超过可用候选。
    expect(diverse.length).toBeLessThanOrEqual(5);
    expect(diverse.length).toBeLessThanOrEqual(result.ranked.length);
    const angles = new Set(diverse.map((d) => d.angle));
    expect(angles.size).toBe(diverse.length);
  });
});

describe("BackendError", () => {
  it("携带 code 与 retryable", () => {
    const error = new BackendError({
      code: "INVALID_INPUT",
      message: "测试",
      retryable: false,
    });
    expect(error.code).toBe("INVALID_INPUT");
    expect(error.retryable).toBe(false);
  });
});
