import type {
  Creation,
  DailyIssue,
  DeliverySettings,
  Subscription,
  SubscriptionBundle,
  ThemePosterContent,
  TopicPosterContent
} from "@/types";

const now = "2026-07-18T01:30:00.000Z";

export const store = {
  subscriptions: new Map<string, SubscriptionBundle>(),
  dailyIssues: new Map<string, DailyIssue>(),
  themePosters: new Map<string, ThemePosterContent>(),
  topicPosters: new Map<string, TopicPosterContent>(),
  creations: new Map<string, Creation>()
};

export const DEFAULT_USER_ID = "user_01";

export function getDefaultSubscriptionBundle(userId = DEFAULT_USER_ID): SubscriptionBundle {
  const existing = store.subscriptions.get(userId);
  if (existing) return existing;

  const createdAt = now;
  const subscriptions: Subscription[] = ["人工智能", "科技数码", "商业财经"].map((topic, index) => ({
    id: `sub_${index + 1}`,
    userId,
    topic,
    keywords: topic === "人工智能" ? ["大模型", "多模态"] : [topic],
    enabled: true,
    todayUpdateCount: 0,
    createdAt,
    updatedAt: createdAt
  }));

  const deliverySettings: DeliverySettings = {
    email: "",
    dailyDelivery: true,
    deliveryTime: "08:00"
  };

  const bundle = { subscriptions, deliverySettings };
  store.subscriptions.set(userId, bundle);
  return bundle;
}

export function upsertCreation(creation: Creation) {
  const existing = Array.from(store.creations.values()).find((item) => item.href === creation.href);
  if (existing) {
    const merged = { ...existing, ...creation };
    store.creations.set(existing.id, merged);
    return merged;
  }
  store.creations.set(creation.id, creation);
  return creation;
}
