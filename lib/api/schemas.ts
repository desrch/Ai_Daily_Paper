import { z } from "zod";

const dateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);
const dateTimeSchema = z.string().datetime({ offset: true });
const imageLocationSchema = z
  .string()
  .refine(
    (value) => value.startsWith("/") || URL.canParse(value),
    "图片地址必须是本地绝对路径或有效 URL",
  );

export const newsAngleSchema = z.enum([
  "政策",
  "技术",
  "产业",
  "应用",
  "市场",
]);

export const newsArticleSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  description: z.string().min(1),
  content: z.string().min(1).optional(),
  source: z.string().min(1),
  sourceUrl: z.string().url().optional(),
  publishedAt: dateTimeSchema,
  category: z.string().min(1),
  imageUrl: imageLocationSchema.optional(),
  keywords: z.array(z.string().min(1)),
  relevanceScore: z.number().min(0).max(100).optional(),
});

export const dailyIssueSchema = z
  .object({
    id: z.string().min(1),
    userId: z.string().min(1),
    issueDate: dateSchema,
    newspaperName: z.string().min(1),
    topics: z.array(z.string().min(1)).min(1),
    leadArticleId: z.string().min(1),
    dailyBriefing: z.string().min(1),
    sections: z
      .array(
        z.object({
          title: z.string().min(1),
          articles: z.array(newsArticleSchema).min(1),
        }),
      )
      .min(1),
    quickNews: z.array(z.string().min(1)),
    watchNext: z.array(z.string().min(1)),
    createdAt: dateTimeSchema,
  })
  .superRefine((issue, context) => {
    const articleIds = new Set(
      issue.sections.flatMap((section) =>
        section.articles.map((article) => article.id),
      ),
    );

    if (!articleIds.has(issue.leadArticleId)) {
      context.addIssue({
        code: "custom",
        path: ["leadArticleId"],
        message: "头条文章必须存在于日报栏目中",
      });
    }
  });

export const topicPosterContentSchema = z.object({
  id: z.string().min(1),
  keyword: z.string().min(1),
  topicTitle: z.string().min(1),
  introduction: z.string().min(1),
  articles: z
    .array(
      z.object({
        id: z.string().min(1),
        headline: z.string().min(1),
        summary: z.string().min(1),
        angle: newsAngleSchema,
        source: z.string().min(1),
        sourceUrl: z.string().url().optional(),
        publishedAt: dateTimeSchema,
        imageUrl: imageLocationSchema.optional(),
        relevanceScore: z.number().min(0).max(100),
      }),
    )
    .min(3)
    .max(5),
  trendSummary: z.string().min(1),
  keyTakeaways: z.array(z.string().min(1)).min(1),
  keywords: z.array(z.string().min(1)).min(1),
  template: z.enum(["classic", "modern"]),
  createdAt: dateTimeSchema,
});

export const themePosterContentSchema = z.object({
  id: z.string().min(1),
  theme: z.string().min(1),
  title: z.string().min(1),
  introduction: z.string().min(1),
  articles: z.array(newsArticleSchema).min(3).max(5),
  trendSummary: z.string().min(1),
  keywords: z.array(z.string().min(1)).min(1),
  template: z.enum(["classic", "modern"]),
  createdAt: dateTimeSchema,
});

export const subscriptionSchema = z.object({
  id: z.string().min(1),
  userId: z.string().min(1),
  topic: z.string().min(1),
  keywords: z.array(z.string().min(1)),
  enabled: z.boolean(),
  todayUpdateCount: z.number().int().nonnegative(),
  createdAt: dateTimeSchema,
  updatedAt: dateTimeSchema,
});

export const deliverySettingsSchema = z.object({
  email: z.union([z.literal(""), z.string().email()]),
  dailyDelivery: z.boolean(),
  deliveryTime: z.literal("08:00"),
});

export const subscriptionBundleSchema = z.object({
  subscriptions: z.array(subscriptionSchema),
  deliverySettings: deliverySettingsSchema,
});

export const creationTypeSchema = z.enum([
  "daily_issue",
  "theme_poster",
  "topic_poster",
]);

export const creationSchema = z.object({
  id: z.string().min(1),
  type: creationTypeSchema,
  title: z.string().min(1),
  description: z.string().min(1),
  coverImageUrl: imageLocationSchema,
  createdAt: dateTimeSchema,
  href: z.string().startsWith("/"),
  saved: z.boolean(),
});

export const generationStageSchema = z.enum([
  "fetching",
  "ranking",
  "summarizing",
  "layout",
]);

export const generationStatusSchema = z.object({
  state: z.enum([
    "idle",
    "loading",
    "success",
    "partial_success",
    "error",
  ]),
  stage: generationStageSchema.optional(),
  completedStages: z.array(generationStageSchema),
  message: z.string().min(1),
});

export const apiErrorSchema = z.object({
  code: z.string().min(1),
  message: z.string().min(1),
  retryable: z.boolean(),
});

export const searchNewsItemSchema = newsArticleSchema.extend({
  angle: newsAngleSchema,
});

export const searchNewsParamsSchema = z.object({
  keyword: z.string().trim().min(1).max(50),
  timeRange: z.enum(["24h", "7d", "30d"]).default("7d"),
});

export const searchNewsResponseSchema = z.object({
  query: z.string().min(1),
  timeRange: z.enum(["24h", "7d", "30d"]),
  items: z.array(searchNewsItemSchema),
  total: z.number().int().nonnegative(),
});

export const generateDailyIssueInputSchema = z.object({
  userId: z.string().min(1),
  topics: z.array(z.string().trim().min(1)).min(1),
  issueDate: dateSchema.optional(),
});

export const generateThemePosterInputSchema = z.object({
  theme: z.string().trim().min(1).max(50),
  articleCount: z.union([z.literal(3), z.literal(4), z.literal(5)]),
  summaryLength: z.enum(["brief", "standard"]),
  template: z.enum(["classic", "modern"]),
});

export const generateTopicPosterInputSchema = z.object({
  keyword: z.string().trim().min(1).max(50),
  articleIds: z.array(z.string().min(1)).min(3).max(5),
  template: z.enum(["classic", "modern"]),
});

export const saveSubscriptionsInputSchema = z.object({
  subscriptions: z.array(
    z.object({
      id: z.string().min(1).optional(),
      topic: z.string().trim().min(1).max(50),
      keywords: z.array(z.string().trim().min(1).max(50)),
      enabled: z.boolean(),
    }),
  ),
  deliverySettings: deliverySettingsSchema,
});

export const saveCreationInputSchema = z.object({
  href: z.string().startsWith("/"),
});

export const creationFiltersSchema = z.object({
  type: creationTypeSchema.or(z.literal("all")).optional(),
  keyword: z.string().trim().optional(),
  dateFrom: dateSchema.optional(),
  dateTo: dateSchema.optional(),
  offset: z.number().int().nonnegative().default(0),
  limit: z.number().int().positive().max(50).default(12),
});

export const creationListResponseSchema = z.object({
  items: z.array(creationSchema),
  total: z.number().int().nonnegative(),
  offset: z.number().int().nonnegative(),
  limit: z.number().int().positive(),
});

export const simulateDailyDeliveryInputSchema = z.object({
  userId: z.string().min(1),
  issueDate: dateSchema.optional(),
});

export const deliveryResultSchema = z.object({
  issue: dailyIssueSchema,
  emailSent: z.boolean(),
  status: z.enum(["completed", "partial"]),
  message: z.string().min(1),
});

export const demoScenariosSchema = z.object({
  loading: generationStatusSchema,
  empty: z.object({
    title: z.string().min(1),
    description: z.string().min(1),
  }),
  error: apiErrorSchema,
  partialSuccess: z.object({
    emailSent: z.literal(false),
    status: z.literal("partial"),
    message: z.string().min(1),
  }),
});

export const mockStoreStateSchema = z.object({
  subscriptions: z.array(subscriptionSchema),
  deliverySettings: deliverySettingsSchema,
  dailyIssues: z.array(dailyIssueSchema),
  creations: z.array(creationSchema),
  themePosters: z.array(themePosterContentSchema),
  topicPosters: z.array(topicPosterContentSchema),
  lastDeliveryDate: dateSchema.nullable(),
});
