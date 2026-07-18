import { databaseEnabled } from "@/lib/env";
import { getSupabaseServerClient, toCamelDate } from "@/lib/db/supabase";
import type { DeliverySettings, Subscription, SubscriptionBundle } from "@/types";

interface SubscriptionRow {
  id: string;
  user_id: string;
  topic: string;
  keywords: string[];
  enabled: boolean;
  today_update_count: number;
  created_at: string;
  updated_at: string;
}

interface DeliverySettingsRow {
  user_id: string;
  email: string;
  daily_delivery: boolean;
  delivery_time: "08:00";
  updated_at: string;
}

export async function getSubscriptionBundleFromDb(userId: string) {
  if (!databaseEnabled()) return null;

  const supabase = getSupabaseServerClient();
  const [subscriptionsResult, settingsResult] = await Promise.all([
    supabase.from("subscriptions").select("*").eq("user_id", userId).order("created_at"),
    supabase.from("delivery_settings").select("*").eq("user_id", userId).maybeSingle()
  ]);

  if (subscriptionsResult.error) throw subscriptionsResult.error;
  if (settingsResult.error) throw settingsResult.error;

  const settings = settingsResult.data as DeliverySettingsRow | null;
  return {
    subscriptions: ((subscriptionsResult.data ?? []) as SubscriptionRow[]).map(rowToSubscription),
    deliverySettings: settings ? rowToDeliverySettings(settings) : defaultDeliverySettings()
  };
}

export async function saveSubscriptionBundleToDb(userId: string, bundle: SubscriptionBundle) {
  if (!databaseEnabled()) return null;

  const supabase = getSupabaseServerClient();
  const now = new Date().toISOString();

  const subscriptionRows = bundle.subscriptions.map((subscription, index) => ({
    id: subscription.id || `sub_${index + 1}`,
    user_id: subscription.userId || userId,
    topic: subscription.topic,
    keywords: subscription.keywords,
    enabled: subscription.enabled,
    today_update_count: subscription.todayUpdateCount,
    created_at: subscription.createdAt || now,
    updated_at: now
  }));

  const { error: deleteError } = await supabase.from("subscriptions").delete().eq("user_id", userId);
  if (deleteError) throw deleteError;

  if (subscriptionRows.length > 0) {
    const { error: insertError } = await supabase.from("subscriptions").insert(subscriptionRows);
    if (insertError) throw insertError;
  }

  const { error: settingsError } = await supabase.from("delivery_settings").upsert({
    user_id: userId,
    email: bundle.deliverySettings.email,
    daily_delivery: bundle.deliverySettings.dailyDelivery,
    delivery_time: "08:00",
    updated_at: now
  });
  if (settingsError) throw settingsError;

  return getSubscriptionBundleFromDb(userId);
}

function rowToSubscription(row: SubscriptionRow): Subscription {
  return {
    id: row.id,
    userId: row.user_id,
    topic: row.topic,
    keywords: row.keywords ?? [],
    enabled: row.enabled,
    todayUpdateCount: row.today_update_count,
    createdAt: toCamelDate(row.created_at),
    updatedAt: toCamelDate(row.updated_at)
  };
}

function rowToDeliverySettings(row: DeliverySettingsRow): DeliverySettings {
  return {
    email: row.email ?? "",
    dailyDelivery: row.daily_delivery,
    deliveryTime: "08:00"
  };
}

function defaultDeliverySettings(): DeliverySettings {
  return {
    email: "",
    dailyDelivery: true,
    deliveryTime: "08:00"
  };
}
