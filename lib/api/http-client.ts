import { TodayPaperApiError } from "@/lib/api/errors";
import {
  apiErrorSchema,
  creationFiltersSchema,
  creationListResponseSchema,
  creationSchema,
  dailyIssueSchema,
  deliveryResultSchema,
  generateDailyIssueInputSchema,
  generateThemePosterInputSchema,
  generateTopicPosterInputSchema,
  saveCreationInputSchema,
  saveSubscriptionsInputSchema,
  searchNewsParamsSchema,
  searchNewsResponseSchema,
  simulateDailyDeliveryInputSchema,
  subscriptionBundleSchema,
  themePosterContentSchema,
  topicPosterContentSchema,
} from "@/lib/api/schemas";
import type { TodayPaperApiClient } from "@/lib/api/contracts";
import type { ZodType } from "zod";

type HttpClientOptions = {
  baseUrl?: string;
  fetcher?: typeof fetch;
};

function resolveUrl(path: string, baseUrl?: string) {
  if (baseUrl) {
    return new URL(path, baseUrl).toString();
  }

  if (typeof window !== "undefined") {
    return path;
  }

  throw new TodayPaperApiError({
    code: "API_BASE_URL_MISSING",
    message:
      "服务端使用真实 API 时必须配置 NEXT_PUBLIC_APP_URL。",
    retryable: false,
  });
}

export function createHttpClient(
  options: HttpClientOptions = {},
): TodayPaperApiClient {
  const fetcher = options.fetcher ?? fetch;

  async function request<T>(
    path: string,
    schema: ZodType<T>,
    init?: RequestInit,
  ): Promise<T> {
    const response = await fetcher(resolveUrl(path, options.baseUrl), {
      ...init,
      credentials: "same-origin",
      headers: {
        "Content-Type": "application/json",
        ...init?.headers,
      },
    });

    const payload: unknown = await response.json().catch(() => null);

    if (!response.ok) {
      const parsedError = apiErrorSchema.safeParse(payload);

      throw new TodayPaperApiError(
        parsedError.success
          ? parsedError.data
          : {
              code: `HTTP_${response.status}`,
              message: "请求失败，请稍后重试。",
              retryable: response.status >= 500,
            },
      );
    }

    return schema.parse(payload);
  }

  return {
    async searchNews(params) {
      const input = searchNewsParamsSchema.parse(params);
      const searchParams = new URLSearchParams({
        keyword: input.keyword,
        timeRange: input.timeRange,
      });

      return request(
        `/api/news/search?${searchParams.toString()}`,
        searchNewsResponseSchema,
      );
    },

    async generateDailyIssue(input) {
      const body = generateDailyIssueInputSchema.parse(input);

      return request("/api/daily-issue/generate", dailyIssueSchema, {
        method: "POST",
        body: JSON.stringify(body),
      });
    },

    async generateThemePoster(input) {
      const body = generateThemePosterInputSchema.parse(input);

      return request(
        "/api/theme-poster/generate",
        themePosterContentSchema,
        {
          method: "POST",
          body: JSON.stringify(body),
        },
      );
    },

    async generateTopicPoster(input) {
      const body = generateTopicPosterInputSchema.parse(input);

      return request(
        "/api/topic-poster/generate",
        topicPosterContentSchema,
        {
          method: "POST",
          body: JSON.stringify(body),
        },
      );
    },

    async getThemePoster(id) {
      return request(
        `/api/theme-posters/${encodeURIComponent(id)}`,
        themePosterContentSchema.nullable(),
      );
    },

    async getTopicPoster(id) {
      return request(
        `/api/topic-posters/${encodeURIComponent(id)}`,
        topicPosterContentSchema.nullable(),
      );
    },

    async saveCreation(input) {
      const body = saveCreationInputSchema.parse(input);

      return request("/api/creations/save", creationSchema, {
        method: "POST",
        body: JSON.stringify(body),
      });
    },

    async getSubscriptions() {
      return request("/api/subscriptions", subscriptionBundleSchema);
    },

    async saveSubscriptions(input) {
      const body = saveSubscriptionsInputSchema.parse(input);

      return request("/api/subscriptions", subscriptionBundleSchema, {
        method: "POST",
        body: JSON.stringify(body),
      });
    },

    async getDailyIssues() {
      return request("/api/daily-issues", dailyIssueSchema.array());
    },

    async getCreations(filters = {}) {
      const parsedFilters = creationFiltersSchema.parse(filters);
      const searchParams = new URLSearchParams();

      Object.entries(parsedFilters).forEach(([key, value]) => {
        if (value !== undefined) {
          searchParams.set(key, String(value));
        }
      });

      return request(
        `/api/creations?${searchParams.toString()}`,
        creationListResponseSchema,
      );
    },

    async simulateDailyDelivery(input) {
      const body = simulateDailyDeliveryInputSchema.parse(input);

      return request("/api/delivery/simulate", deliveryResultSchema, {
        method: "POST",
        body: JSON.stringify(body),
      });
    },
  };
}
