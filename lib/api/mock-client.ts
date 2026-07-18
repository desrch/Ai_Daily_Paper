import creationsJson from "@/data/demo/creations.json";
import dailyIssueJson from "@/data/demo/daily-issue.json";
import newsArticlesJson from "@/data/demo/news-articles.json";
import scenariosJson from "@/data/demo/scenarios.json";
import themePosterJson from "@/data/demo/theme-poster.json";
import topicPosterJson from "@/data/demo/topic-poster.json";
import { TodayPaperApiError } from "@/lib/api/errors";
import {
  creationFiltersSchema,
  creationListResponseSchema,
  creationSchema,
  dailyIssueSchema,
  deliveryResultSchema,
  demoScenariosSchema,
  generateDailyIssueInputSchema,
  generateThemePosterInputSchema,
  generateTopicPosterInputSchema,
  saveCreationInputSchema,
  saveSubscriptionsInputSchema,
  searchNewsItemSchema,
  searchNewsParamsSchema,
  searchNewsResponseSchema,
  subscriptionBundleSchema,
  themePosterContentSchema,
  topicPosterContentSchema,
} from "@/lib/api/schemas";
import { MOCK_USER_ID } from "@/lib/mock/constants";
import {
  markMockCreationSaved,
  readMockStore,
  updateMockStore,
} from "@/lib/mock/store";
import type {
  Creation,
  DailyIssue,
  SearchNewsItem,
  Subscription,
  ThemePosterContent,
  TopicPosterContent,
} from "@/types";

import type { ApiOperation, TodayPaperApiClient } from "./contracts";

type MockClientOptions = {
  delayMs?: number;
  shouldFail?: boolean | ((operation: ApiOperation) => boolean);
};

const demoArticles = searchNewsItemSchema.array().parse(newsArticlesJson);
const demoDailyIssue = dailyIssueSchema.parse(dailyIssueJson);
const demoThemePoster = themePosterContentSchema.parse(themePosterJson);
const demoTopicPoster = topicPosterContentSchema.parse(topicPosterJson);
const demoScenarios = demoScenariosSchema.parse(scenariosJson);
const demoCreations = creationSchema.array().parse(creationsJson);

function isConfiguredToFail(operation: ApiOperation) {
  const configuredValue = process.env.NEXT_PUBLIC_MOCK_API_ERROR ?? "false";
  const configuredFailures = configuredValue
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);

  return (
    configuredFailures.includes("true") ||
    configuredFailures.includes("all") ||
    configuredFailures.includes(operation)
  );
}

function shouldFail(
  operation: ApiOperation,
  option: MockClientOptions["shouldFail"],
) {
  if (typeof option === "function") {
    return option(operation);
  }

  return option === true || isConfiguredToFail(operation);
}

async function wait(delayMs: number) {
  await new Promise<void>((resolve) => {
    windowOrNodeTimeout(resolve, delayMs);
  });
}

function windowOrNodeTimeout(callback: () => void, delayMs: number) {
  return setTimeout(callback, delayMs);
}

function clone<T>(value: T): T {
  return structuredClone(value);
}

function createId(prefix: string) {
  const randomPart =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : `${Date.now()}`;

  return `${prefix}-${randomPart}`;
}

function dateOnly(value: string) {
  return value.slice(0, 10);
}

function includesKeyword(article: SearchNewsItem, keyword: string) {
  const normalizedKeyword = keyword.toLocaleLowerCase("zh-CN");
  const broadDemoQuery =
    normalizedKeyword.includes("人工智能") ||
    normalizedKeyword.includes("ai") ||
    normalizedKeyword.includes("教育");

  if (broadDemoQuery) {
    return true;
  }

  const searchableText = [
    article.title,
    article.description,
    article.category,
    ...article.keywords,
  ]
    .join(" ")
    .toLocaleLowerCase("zh-CN");

  return searchableText.includes(normalizedKeyword);
}

export function createMockClient(
  options: MockClientOptions = {},
): TodayPaperApiClient {
  const delayMs = Math.min(800, Math.max(300, options.delayMs ?? 450));

  async function respond<T>(
    operation: ApiOperation,
    producer: () => T,
  ): Promise<T> {
    await wait(delayMs);

    if (shouldFail(operation, options.shouldFail)) {
      throw new TodayPaperApiError(demoScenarios.error);
    }

    return clone(producer());
  }

  return {
    async searchNews(params) {
      const input = searchNewsParamsSchema.parse(params);

      return respond("searchNews", () => {
        const items = demoArticles.filter((article) =>
          includesKeyword(article, input.keyword),
        );

        return searchNewsResponseSchema.parse({
          query: input.keyword,
          timeRange: input.timeRange,
          items,
          total: items.length,
        });
      });
    },

    async generateDailyIssue(input) {
      const parsedInput = generateDailyIssueInputSchema.parse(input);

      return respond("generateDailyIssue", () => {
        const issueDate = parsedInput.issueDate ?? demoDailyIssue.issueDate;
        const state = readMockStore();
        const existingIssue = state.dailyIssues.find(
          (issue) =>
            issue.userId === parsedInput.userId &&
            issue.issueDate === issueDate,
        );

        if (existingIssue) {
          if (
            !state.creations.some(
              (creation) =>
                creation.id === `creation-${existingIssue.id}`,
            )
          ) {
            const existingCreation = creationSchema.parse({
              id: `creation-${existingIssue.id}`,
              type: "daily_issue",
              title: `${existingIssue.issueDate} 个人日报`,
              description: existingIssue.dailyBriefing,
              coverImageUrl: "/images/demo/cover-daily.svg",
              createdAt: existingIssue.createdAt,
              href: `/newspaper/${existingIssue.id}`,
              saved: true,
            });

            updateMockStore((currentState) => ({
              ...currentState,
              creations: [existingCreation, ...currentState.creations],
            }));
          }

          return dailyIssueSchema.parse(existingIssue);
        }

        const issue = dailyIssueSchema.parse({
          ...demoDailyIssue,
          id: createId("daily"),
          userId: parsedInput.userId,
          issueDate,
          topics: parsedInput.topics,
          createdAt: new Date().toISOString(),
        });
        const creation = creationSchema.parse({
          id: `creation-${issue.id}`,
          type: "daily_issue",
          title: `${issue.issueDate} 个人日报`,
          description: issue.dailyBriefing,
          coverImageUrl: "/images/demo/cover-daily.svg",
          createdAt: issue.createdAt,
          href: `/newspaper/${issue.id}`,
          saved: true,
        });

        updateMockStore((currentState) => ({
          ...currentState,
          dailyIssues: [issue, ...currentState.dailyIssues],
          creations: [creation, ...currentState.creations],
        }));

        return issue;
      });
    },

    async generateThemePoster(input) {
      const parsedInput = generateThemePosterInputSchema.parse(input);

      return respond("generateThemePoster", () => {
        const articles = demoArticles
          .slice(0, parsedInput.articleCount)
          .map((article) => ({
            ...article,
            description:
              parsedInput.summaryLength === "brief" &&
              article.description.length > 52
                ? `${article.description.slice(0, 52)}…`
                : article.description,
          }));
        const poster = themePosterContentSchema.parse({
          ...demoThemePoster,
          id: createId("theme"),
          theme: parsedInput.theme,
          title: `${parsedInput.theme} · 主题海报`,
          introduction: `从技术、产业、市场与应用等角度，整理 ${parsedInput.theme} 的代表资讯与趋势信号。`,
          articles,
          template: parsedInput.template,
          createdAt: new Date().toISOString(),
        });

        const creation: Creation = {
          id: `creation-${poster.id}`,
          type: "theme_poster",
          title: poster.title,
          description: `${poster.articles.length} 篇演示新闻的主题聚合`,
          coverImageUrl: "/images/demo/cover-theme.svg",
          createdAt: poster.createdAt,
          href: `/theme-poster/${poster.id}`,
          saved: false,
        };

        updateMockStore((state) => ({
          ...state,
          themePosters: [poster, ...state.themePosters],
          creations: [creationSchema.parse(creation), ...state.creations],
        }));

        return poster;
      });
    },

    async generateTopicPoster(input) {
      const parsedInput = generateTopicPosterInputSchema.parse(input);

      return respond("generateTopicPoster", () => {
        const selectedArticles = parsedInput.articleIds
          .map((id) => demoArticles.find((article) => article.id === id))
          .filter((article): article is SearchNewsItem => Boolean(article));

        if (selectedArticles.length !== parsedInput.articleIds.length) {
          throw new TodayPaperApiError({
            code: "INVALID_NEWS_SELECTION",
            message: "部分候选新闻不存在，请刷新后重新选择。",
            retryable: false,
          });
        }

        const poster = topicPosterContentSchema.parse({
          ...demoTopicPoster,
          id: createId("topic"),
          keyword: parsedInput.keyword,
          topicTitle: `${parsedInput.keyword} · 专题海报`,
          articles: selectedArticles.map((article) => ({
            id: article.id,
            headline: article.title,
            summary: article.description,
            angle: article.angle,
            source: article.source,
            sourceUrl: article.sourceUrl,
            publishedAt: article.publishedAt,
            imageUrl: article.imageUrl,
            relevanceScore: article.relevanceScore ?? 0,
          })),
          template: parsedInput.template,
          createdAt: new Date().toISOString(),
        });

        const creation: Creation = {
          id: `creation-${poster.id}`,
          type: "topic_poster",
          title: poster.topicTitle,
          description: `${poster.articles.length} 个报道角度的演示专题`,
          coverImageUrl: "/images/demo/cover-topic.svg",
          createdAt: poster.createdAt,
          href: `/topic-poster/${poster.id}`,
          saved: false,
        };

        updateMockStore((state) => ({
          ...state,
          topicPosters: [poster, ...state.topicPosters],
          creations: [creationSchema.parse(creation), ...state.creations],
        }));

        return poster;
      });
    },

    async getThemePoster(id) {
      return respond("getThemePoster", () => {
        return (
          readMockStore().themePosters.find((poster) => poster.id === id) ??
          null
        );
      });
    },

    async getTopicPoster(id) {
      return respond("getTopicPoster", () => {
        return (
          readMockStore().topicPosters.find((poster) => poster.id === id) ??
          null
        );
      });
    },

    async saveCreation(input) {
      const parsedInput = saveCreationInputSchema.parse(input);

      return respond("saveCreation", () => {
        const savedCreation = markMockCreationSaved(parsedInput.href);

        if (!savedCreation) {
          throw new TodayPaperApiError({
            code: "CREATION_NOT_FOUND",
            message: "没有找到可保存的作品，请重新生成后再试。",
            retryable: false,
          });
        }

        return creationSchema.parse(savedCreation);
      });
    },

    async getSubscriptions() {
      return respond("getSubscriptions", () => {
        const state = readMockStore();

        return subscriptionBundleSchema.parse({
          subscriptions: state.subscriptions,
          deliverySettings: state.deliverySettings,
        });
      });
    },

    async saveSubscriptions(input) {
      const parsedInput = saveSubscriptionsInputSchema.parse(input);

      return respond("saveSubscriptions", () => {
        const state = readMockStore();
        const now = new Date().toISOString();

        const subscriptions: Subscription[] =
          parsedInput.subscriptions.map((subscription, index) => {
            const existingSubscription = state.subscriptions.find(
              (item) =>
                item.id === subscription.id ||
                item.topic === subscription.topic,
            );

            return {
              id:
                subscription.id ??
                existingSubscription?.id ??
                `demo-subscription-${index + 1}`,
              userId: MOCK_USER_ID,
              topic: subscription.topic,
              keywords: Array.from(new Set(subscription.keywords)),
              enabled: subscription.enabled,
              todayUpdateCount:
                existingSubscription?.todayUpdateCount ?? 0,
              createdAt: existingSubscription?.createdAt ?? now,
              updatedAt: now,
            };
          });

        const nextState = updateMockStore((currentState) => ({
          ...currentState,
          subscriptions,
          deliverySettings: parsedInput.deliverySettings,
        }));

        return subscriptionBundleSchema.parse({
          subscriptions: nextState.subscriptions,
          deliverySettings: nextState.deliverySettings,
        });
      });
    },

    async getDailyIssues() {
      return respond("getDailyIssues", () =>
        dailyIssueSchema
          .array()
          .parse(readMockStore().dailyIssues)
          .sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
      );
    },

    async getCreations(filters = {}) {
      const parsedFilters = creationFiltersSchema.parse(filters);

      return respond("getCreations", () => {
        const stateItems =
          readMockStore().creations.length > 0
            ? readMockStore().creations
            : demoCreations;
        const normalizedKeyword =
          parsedFilters.keyword?.toLocaleLowerCase("zh-CN");

        const filteredItems = stateItems.filter((creation) => {
          if (!creation.saved) {
            return false;
          }

          if (
            parsedFilters.type &&
            parsedFilters.type !== "all" &&
            creation.type !== parsedFilters.type
          ) {
            return false;
          }

          if (
            normalizedKeyword &&
            !`${creation.title} ${creation.description}`
              .toLocaleLowerCase("zh-CN")
              .includes(normalizedKeyword)
          ) {
            return false;
          }

          const createdDate = dateOnly(creation.createdAt);

          if (
            parsedFilters.dateFrom &&
            createdDate < parsedFilters.dateFrom
          ) {
            return false;
          }

          if (parsedFilters.dateTo && createdDate > parsedFilters.dateTo) {
            return false;
          }

          return true;
        });

        const items = filteredItems.slice(
          parsedFilters.offset,
          parsedFilters.offset + parsedFilters.limit,
        );

        return creationListResponseSchema.parse({
          items,
          total: filteredItems.length,
          offset: parsedFilters.offset,
          limit: parsedFilters.limit,
        });
      });
    },

    async simulateDailyDelivery(input) {
      const parsedInput = generateDailyIssueInputSchema.pick({
        userId: true,
        issueDate: true,
      }).parse(input);

      return respond("simulateDailyDelivery", () => {
        const issueDate = parsedInput.issueDate ?? demoDailyIssue.issueDate;
        const state = readMockStore();
        const existingIssue = state.dailyIssues.find(
          (issue) =>
            issue.userId === parsedInput.userId &&
            issue.issueDate === issueDate,
        );

        const issue: DailyIssue =
          existingIssue ??
          dailyIssueSchema.parse({
            ...demoDailyIssue,
            id: createId("daily"),
            userId: parsedInput.userId,
            issueDate,
            createdAt: new Date().toISOString(),
          });

        const creation = creationSchema.parse({
          id: `creation-${issue.id}`,
          type: "daily_issue",
          title: `${issue.issueDate} 个人日报`,
          description: issue.dailyBriefing,
          coverImageUrl: "/images/demo/cover-daily.svg",
          createdAt: issue.createdAt,
          href: `/newspaper/${issue.id}`,
          saved: true,
        });
        const hasCreation = state.creations.some(
          (item) => item.id === creation.id,
        );

        if (!existingIssue || !hasCreation) {
          updateMockStore((currentState) => ({
            ...currentState,
            dailyIssues: existingIssue
              ? currentState.dailyIssues
              : [issue, ...currentState.dailyIssues],
            creations: hasCreation
              ? currentState.creations
              : [creation, ...currentState.creations],
            lastDeliveryDate: issueDate,
          }));
        }

        const emailFailed =
          process.env.NEXT_PUBLIC_MOCK_EMAIL_ERROR === "true";

        return deliveryResultSchema.parse({
          issue,
          emailSent: !emailFailed,
          status: emailFailed ? "partial" : "completed",
          message: existingIssue
            ? "今日份日报已生成，已返回现有内容。"
            : emailFailed
              ? demoScenarios.partialSuccess.message
              : "今日份日报已生成并完成演示投递。",
        });
      });
    },
  };
}

export const mockApiClient = createMockClient();

export type { MockClientOptions };
export type { ThemePosterContent, TopicPosterContent };
