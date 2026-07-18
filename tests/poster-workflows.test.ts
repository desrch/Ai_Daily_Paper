import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { createMockClient } from "@/lib/api/mock-client";
import { resetMockStore } from "@/lib/mock/store";
import {
  canGenerateTopicPoster,
  moveSelectedArticle,
  toggleSelectedArticle,
} from "@/lib/workflow/selection";

async function resolveMockRequest<T>(request: Promise<T>) {
  await vi.advanceTimersByTimeAsync(300);
  return request;
}

beforeEach(() => {
  resetMockStore();
});

afterEach(() => {
  resetMockStore();
  vi.useRealTimers();
});

describe("topic poster selection", () => {
  it("enforces the 3–5 article constraint", () => {
    expect(canGenerateTopicPoster(["a", "b"])).toBe(false);
    expect(canGenerateTopicPoster(["a", "b", "c"])).toBe(true);
    expect(canGenerateTopicPoster(["a", "b", "c", "d", "e"])).toBe(true);
    expect(
      canGenerateTopicPoster(["a", "b", "c", "d", "e", "f"]),
    ).toBe(false);
  });

  it("caps selection and preserves explicit ordering", () => {
    const capped = toggleSelectedArticle(
      ["a", "b", "c", "d", "e"],
      "f",
    );
    expect(capped).toEqual(["a", "b", "c", "d", "e"]);
    expect(moveSelectedArticle(["a", "b", "c"], "c", "up")).toEqual([
      "a",
      "c",
      "b",
    ]);
    expect(moveSelectedArticle(["a", "b", "c"], "a", "up")).toEqual([
      "a",
      "b",
      "c",
    ]);
  });
});

describe("poster generation and saving", () => {
  it("supports five theme articles and reveals the work only after saving", async () => {
    vi.useFakeTimers();
    const client = createMockClient({ delayMs: 300 });
    const poster = await resolveMockRequest(
      client.generateThemePoster({
        theme: "人工智能",
        articleCount: 5,
        summaryLength: "standard",
        template: "classic",
      }),
    );

    expect(poster.articles).toHaveLength(5);

    const beforeSave = await resolveMockRequest(
      client.getCreations({ type: "theme_poster", limit: 50 }),
    );
    expect(
      beforeSave.items.some(
        (creation) => creation.href === `/theme-poster/${poster.id}`,
      ),
    ).toBe(false);

    await resolveMockRequest(
      client.saveCreation({ href: `/theme-poster/${poster.id}` }),
    );
    const afterSave = await resolveMockRequest(
      client.getCreations({ type: "theme_poster", limit: 50 }),
    );
    expect(
      afterSave.items.some(
        (creation) => creation.href === `/theme-poster/${poster.id}`,
      ),
    ).toBe(true);
  });

  it("keeps the selected topic-news order", async () => {
    vi.useFakeTimers();
    const client = createMockClient({ delayMs: 300 });
    const articleIds = [
      "demo-news-tech-01",
      "demo-news-policy-01",
      "demo-news-market-01",
    ];
    const poster = await resolveMockRequest(
      client.generateTopicPoster({
        keyword: "人工智能教育",
        articleIds,
        template: "classic",
      }),
    );

    expect(poster.articles.map((article) => article.id)).toEqual(
      articleIds,
    );
  });
});
