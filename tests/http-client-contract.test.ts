import creationsJson from "@/data/demo/creations.json";
import dailyIssueJson from "@/data/demo/daily-issue.json";
import newsArticlesJson from "@/data/demo/news-articles.json";
import subscriptionsJson from "@/data/demo/subscriptions.json";
import themePosterJson from "@/data/demo/theme-poster.json";
import topicPosterJson from "@/data/demo/topic-poster.json";
import { TodayPaperApiError } from "@/lib/api/errors";
import { createHttpClient } from "@/lib/api/http-client";
import { describe, expect, it, vi } from "vitest";

const baseUrl = "https://todaypaper.example";

function jsonResponse(payload: unknown, status = 200) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

function createTestClient() {
  const fetcher = vi.fn();
  const client = createHttpClient({
    baseUrl,
    fetcher: fetcher as unknown as typeof fetch,
  });

  return { client, fetcher };
}

function requestAt(fetcher: ReturnType<typeof vi.fn>, index: number) {
  const [url, init] = fetcher.mock.calls[index] as [
    string,
    RequestInit | undefined,
  ];

  return {
    url,
    method: init?.method ?? "GET",
    body: init?.body ? JSON.parse(String(init.body)) : undefined,
  };
}

describe("HttpClient 接口契约", () => {
  it("映射新闻搜索与带筛选条件的查询接口", async () => {
    const { client, fetcher } = createTestClient();
    const newsItems = newsArticlesJson.slice(0, 4);
    const creationItems = creationsJson.slice(0, 2);

    fetcher
      .mockResolvedValueOnce(
        jsonResponse({
          query: "人工智能教育",
          timeRange: "7d",
          items: newsItems,
          total: newsItems.length,
        }),
      )
      .mockResolvedValueOnce(
        jsonResponse({
          items: creationItems,
          total: creationItems.length,
          offset: 2,
          limit: 5,
        }),
      );

    await client.searchNews({
      keyword: " 人工智能教育 ",
      timeRange: "7d",
    });
    await client.getCreations({
      type: "topic_poster",
      keyword: "教育",
      dateFrom: "2026-07-01",
      dateTo: "2026-07-18",
      offset: 2,
      limit: 5,
    });

    expect(requestAt(fetcher, 0)).toEqual({
      url: `${baseUrl}/api/news/search?keyword=${encodeURIComponent("人工智能教育")}&timeRange=7d`,
      method: "GET",
      body: undefined,
    });
    expect(requestAt(fetcher, 1)).toEqual({
      url: `${baseUrl}/api/creations?type=topic_poster&keyword=${encodeURIComponent("教育")}&dateFrom=2026-07-01&dateTo=2026-07-18&offset=2&limit=5`,
      method: "GET",
      body: undefined,
    });
  });

  it("映射生成、保存与模拟投递的 POST 请求", async () => {
    const { client, fetcher } = createTestClient();
    const savedCreation = { ...creationsJson[0], saved: true };
    const deliveryResult = {
      issue: dailyIssueJson,
      emailSent: true,
      status: "completed",
      message: "今日份日报已生成并完成演示投递。",
    };

    fetcher
      .mockResolvedValueOnce(jsonResponse(dailyIssueJson))
      .mockResolvedValueOnce(jsonResponse(themePosterJson))
      .mockResolvedValueOnce(jsonResponse(topicPosterJson))
      .mockResolvedValueOnce(jsonResponse(subscriptionsJson))
      .mockResolvedValueOnce(jsonResponse(savedCreation))
      .mockResolvedValueOnce(jsonResponse(deliveryResult));

    await client.generateDailyIssue({
      userId: "demo-user",
      topics: ["人工智能"],
      issueDate: "2026-07-18",
    });
    await client.generateThemePoster({
      theme: "人工智能",
      articleCount: 4,
      summaryLength: "standard",
      template: "classic",
    });
    await client.generateTopicPoster({
      keyword: "人工智能教育",
      articleIds: newsArticlesJson
        .slice(0, 4)
        .map((article) => article.id),
      template: "modern",
    });
    await client.saveSubscriptions({
      subscriptions: subscriptionsJson.subscriptions.map((subscription) => ({
        id: subscription.id,
        topic: subscription.topic,
        keywords: subscription.keywords,
        enabled: subscription.enabled,
      })),
      deliverySettings: {
        ...subscriptionsJson.deliverySettings,
        deliveryTime: "08:00",
      },
    });
    await client.saveCreation({ href: savedCreation.href });
    await client.simulateDailyDelivery({
      userId: "demo-user",
      issueDate: "2026-07-18",
    });

    expect(
      fetcher.mock.calls.map((_, index) => requestAt(fetcher, index)),
    ).toEqual([
      {
        url: `${baseUrl}/api/daily-issue/generate`,
        method: "POST",
        body: {
          userId: "demo-user",
          topics: ["人工智能"],
          issueDate: "2026-07-18",
        },
      },
      {
        url: `${baseUrl}/api/theme-poster/generate`,
        method: "POST",
        body: {
          theme: "人工智能",
          articleCount: 4,
          summaryLength: "standard",
          template: "classic",
        },
      },
      {
        url: `${baseUrl}/api/topic-poster/generate`,
        method: "POST",
        body: {
          keyword: "人工智能教育",
          articleIds: newsArticlesJson
            .slice(0, 4)
            .map((article) => article.id),
          template: "modern",
        },
      },
      {
        url: `${baseUrl}/api/subscriptions`,
        method: "POST",
        body: {
          subscriptions: subscriptionsJson.subscriptions.map(
            (subscription) => ({
              id: subscription.id,
              topic: subscription.topic,
              keywords: subscription.keywords,
              enabled: subscription.enabled,
            }),
          ),
          deliverySettings: subscriptionsJson.deliverySettings,
        },
      },
      {
        url: `${baseUrl}/api/creations/save`,
        method: "POST",
        body: { href: savedCreation.href },
      },
      {
        url: `${baseUrl}/api/delivery/simulate`,
        method: "POST",
        body: {
          userId: "demo-user",
          issueDate: "2026-07-18",
        },
      },
    ]);
  });

  it("映射列表与海报详情 GET 请求并安全编码 ID", async () => {
    const { client, fetcher } = createTestClient();

    fetcher
      .mockResolvedValueOnce(jsonResponse(subscriptionsJson))
      .mockResolvedValueOnce(jsonResponse([dailyIssueJson]))
      .mockResolvedValueOnce(jsonResponse(themePosterJson))
      .mockResolvedValueOnce(jsonResponse(topicPosterJson));

    await client.getSubscriptions();
    await client.getDailyIssues();
    await client.getThemePoster("theme/中文");
    await client.getTopicPoster("topic/中文");

    expect(
      fetcher.mock.calls.map((_, index) => requestAt(fetcher, index).url),
    ).toEqual([
      `${baseUrl}/api/subscriptions`,
      `${baseUrl}/api/daily-issues`,
      `${baseUrl}/api/theme-posters/theme%2F%E4%B8%AD%E6%96%87`,
      `${baseUrl}/api/topic-posters/topic%2F%E4%B8%AD%E6%96%87`,
    ]);
  });

  it("把约定错误结构转换为可重试的 TodayPaperApiError", async () => {
    const { client, fetcher } = createTestClient();

    fetcher.mockResolvedValueOnce(
      jsonResponse(
        {
          code: "NEWS_PROVIDER_UNAVAILABLE",
          message: "新闻服务暂时不可用。",
          retryable: true,
        },
        503,
      ),
    );

    await expect(
      client.searchNews({
        keyword: "人工智能教育",
        timeRange: "7d",
      }),
    ).rejects.toMatchObject({
      name: TodayPaperApiError.name,
      code: "NEWS_PROVIDER_UNAVAILABLE",
      message: "新闻服务暂时不可用。",
      retryable: true,
    });
  });

  it("在发起网络请求前拒绝无效的模拟投递日期", async () => {
    const { client, fetcher } = createTestClient();

    await expect(
      client.simulateDailyDelivery({
        userId: "demo-user",
        issueDate: "2026/07/18",
      }),
    ).rejects.toThrow();
    expect(fetcher).not.toHaveBeenCalled();
  });
});
