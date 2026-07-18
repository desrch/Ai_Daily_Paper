import { apiError, json, readJsonBody } from "@/lib/api/http";
import { getSubscriptionBundleFromDb, saveSubscriptionBundleToDb } from "@/lib/db/subscriptions";
import { DEFAULT_USER_ID, getDefaultSubscriptionBundle, store } from "@/lib/demo/store";
import type { SubscriptionBundle } from "@/types";

export async function GET() {
  try {
    const dbBundle = await getSubscriptionBundleFromDb(DEFAULT_USER_ID);
    if (dbBundle) return json(dbBundle);
  } catch {
    // Fall back to local demo state.
  }
  return json(getDefaultSubscriptionBundle(DEFAULT_USER_ID));
}

export async function POST(request: Request) {
  const body = await readJsonBody<SubscriptionBundle>(request);
  if (!body) {
    return apiError(400, "INVALID_JSON", "请求体必须是合法 JSON。", false);
  }

  if (!Array.isArray(body.subscriptions)) {
    return apiError(400, "INVALID_SUBSCRIPTIONS", "subscriptions 必须是数组。", false);
  }
  if (!body.deliverySettings || body.deliverySettings.deliveryTime !== "08:00") {
    return apiError(400, "INVALID_DELIVERY_SETTINGS", "投递时间目前固定为 08:00。", false);
  }
  if (body.deliverySettings.dailyDelivery && body.deliverySettings.email) {
    const ok = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(body.deliverySettings.email);
    if (!ok) {
      return apiError(400, "INVALID_EMAIL", "请输入合法邮箱地址。", false);
    }
  }

  const now = new Date().toISOString();
  const subscriptions = body.subscriptions.map((subscription, index) => ({
    id: subscription.id || `sub_${index + 1}`,
    userId: subscription.userId || DEFAULT_USER_ID,
    topic: subscription.topic,
    keywords: Array.isArray(subscription.keywords) ? subscription.keywords : [],
    enabled: Boolean(subscription.enabled),
    todayUpdateCount: Math.max(0, Math.round(subscription.todayUpdateCount ?? 0)),
    createdAt: subscription.createdAt || now,
    updatedAt: now
  }));

  const bundle: SubscriptionBundle = {
    subscriptions,
    deliverySettings: {
      email: body.deliverySettings.email || "",
      dailyDelivery: Boolean(body.deliverySettings.dailyDelivery),
      deliveryTime: "08:00"
    }
  };

  store.subscriptions.set(DEFAULT_USER_ID, bundle);
  try {
    const dbBundle = await saveSubscriptionBundleToDb(DEFAULT_USER_ID, bundle);
    if (dbBundle) return json(dbBundle);
  } catch {
    // Keep local save usable when Supabase is not configured or temporarily fails.
  }
  return json(bundle);
}
