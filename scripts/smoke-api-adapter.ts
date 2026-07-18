import { TodayPaperApiError } from "@/lib/api/errors";
import { createMockClient } from "@/lib/api/mock-client";
import {
  normalizeKeywords,
  subscriptionFormSchema,
} from "@/lib/validation/subscription";

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) {
    throw new Error(message);
  }
}

async function main() {
  assert(
    !subscriptionFormSchema.safeParse({
      topics: [],
      customKeywords: "",
      email: "",
      dailyDelivery: false,
    }).success,
    "空订阅方向未被表单校验拦截",
  );
  assert(
    !subscriptionFormSchema.safeParse({
      topics: ["人工智能"],
      customKeywords: "",
      email: "invalid-email",
      dailyDelivery: true,
    }).success,
    "开启投递时无效邮箱未被拦截",
  );
  assert(
    subscriptionFormSchema.safeParse({
      topics: ["人工智能"],
      customKeywords: "",
      email: "",
      dailyDelivery: false,
    }).success,
    "关闭投递时空邮箱应当允许保存",
  );
  assert(
    normalizeKeywords("大模型，大模型， 芯片 ").join(",") ===
      "大模型,芯片",
    "自定义关键词未正确去重和清理空格",
  );

  const client = createMockClient({ delayMs: 300 });

  const searchResult = await client.searchNews({
    keyword: "人工智能教育",
    timeRange: "7d",
  });
  const angles = new Set(searchResult.items.map((article) => article.angle));

  assert(searchResult.items.length >= 6, "候选新闻数量少于 6 条");
  assert(angles.size >= 4, "候选新闻角度少于 4 种");

  const firstDelivery = await client.simulateDailyDelivery({
    userId: "demo-user",
    issueDate: "2026-07-18",
  });
  const repeatedDelivery = await client.simulateDailyDelivery({
    userId: "demo-user",
    issueDate: "2026-07-18",
  });

  assert(
    firstDelivery.issue.id === repeatedDelivery.issue.id,
    "同一用户同一天生成了重复日报",
  );

  const generatedIssue = await client.generateDailyIssue({
    userId: "smoke-user",
    topics: ["人工智能"],
    issueDate: "2026-07-19",
  });
  const creationsAfterGeneration = await client.getCreations({ limit: 50 });

  assert(
    creationsAfterGeneration.items.some(
      (creation) => creation.href === `/newspaper/${generatedIssue.id}`,
    ),
    "新生成的日报未同步写入历史作品",
  );

  const themePoster = await client.generateThemePoster({
    theme: "人工智能",
    articleCount: 4,
    summaryLength: "standard",
    template: "classic",
  });

  assert(themePoster.articles.length === 4, "主题海报文章数量不正确");
  const loadedThemePoster = await client.getThemePoster(themePoster.id);

  assert(loadedThemePoster?.id === themePoster.id, "主题海报无法按 ID 读取");

  const themesBeforeSave = await client.getCreations({
    type: "theme_poster",
    limit: 50,
  });
  assert(
    !themesBeforeSave.items.some(
      (creation) => creation.href === `/theme-poster/${themePoster.id}`,
    ),
    "未保存的主题海报不应出现在历史作品",
  );

  await client.saveCreation({
    href: `/theme-poster/${themePoster.id}`,
  });
  const themesAfterSave = await client.getCreations({
    type: "theme_poster",
    limit: 50,
  });
  assert(
    themesAfterSave.items.some(
      (creation) => creation.href === `/theme-poster/${themePoster.id}`,
    ),
    "保存的主题海报未出现在历史作品",
  );

  const topicPoster = await client.generateTopicPoster({
    keyword: "人工智能教育",
    articleIds: searchResult.items.slice(0, 4).map((article) => article.id),
    template: "classic",
  });

  assert(topicPoster.articles.length === 4, "关键词专题文章数量不正确");
  const loadedTopicPoster = await client.getTopicPoster(topicPoster.id);
  assert(loadedTopicPoster?.id === topicPoster.id, "关键词专题无法按 ID 读取");

  const subscriptions = await client.getSubscriptions();
  const creations = await client.getCreations({ limit: 5 });

  assert(subscriptions.subscriptions.length === 3, "默认订阅数量不正确");
  assert(creations.total >= 10, "历史作品数量少于 10 条");

  const failingClient = createMockClient({
    delayMs: 300,
    shouldFail: (operation) => operation === "searchNews",
  });
  let injectedError: TodayPaperApiError | null = null;

  try {
    await failingClient.searchNews({
      keyword: "人工智能教育",
      timeRange: "7d",
    });
  } catch (error) {
    if (error instanceof TodayPaperApiError) {
      injectedError = error;
    } else {
      throw error;
    }
  }

  assert(injectedError?.retryable, "Mock 错误注入未返回可重试错误");

  console.log(
    `API Adapter 冒烟通过：订阅校验、${searchResult.items.length} 条候选、${angles.size} 种角度、日报防重复与归档、主题/专题生成读取、保存回流和错误注入正常。`,
  );
}

main().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
