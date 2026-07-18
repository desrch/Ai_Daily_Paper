"use client";

import {
  Clock3,
  Mail,
  Plus,
  Save,
  Trash2,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import { ErrorState } from "@/components/states/error-state";
import { LoadingState } from "@/components/states/loading-state";
import { SubscriptionCard } from "@/components/subscription/subscription-card";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Toast } from "@/components/ui/toast";
import { apiClient, toApiError } from "@/lib/api/client";
import { deliverySettingsSchema } from "@/lib/api/schemas";
import { MOCK_DELIVERY_TIME } from "@/lib/mock/constants";
import {
  normalizeKeywords,
  subscriptionFormSchema,
} from "@/lib/validation/subscription";
import { cn } from "@/lib/utils";
import type {
  DeliverySettings as DeliverySettingsType,
  Subscription,
  SubscriptionBundle,
} from "@/types";

const presetTopics = [
  "人工智能",
  "科技数码",
  "商业财经",
  "体育赛事",
  "校园生活",
  "电影娱乐",
  "健康生活",
] as const;

type ToastState = {
  message: string;
  variant: "success" | "error" | "info";
};

export function SubscriptionsManager() {
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [deliverySettings, setDeliverySettings] =
    useState<DeliverySettingsType>({
      email: "",
      dailyDelivery: true,
      deliveryTime: "08:00",
    });
  const [customKeywords, setCustomKeywords] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [emailError, setEmailError] = useState<string | null>(null);
  const [isEmailEditing, setIsEmailEditing] = useState(false);
  const [showAddPanel, setShowAddPanel] = useState(false);
  const [newTopic, setNewTopic] = useState("");
  const [pendingDelete, setPendingDelete] =
    useState<Subscription | null>(null);
  const [clearDialogOpen, setClearDialogOpen] = useState(false);
  const [toast, setToast] = useState<ToastState | null>(null);

  useEffect(() => {
    let active = true;

    apiClient
      .getSubscriptions()
      .then((bundle) => {
        if (!active) {
          return;
        }

        const customSubscription = bundle.subscriptions.find(
          (subscription) => subscription.topic === "自定义关注",
        );
        setSubscriptions(
          bundle.subscriptions.filter(
            (subscription) => subscription.topic !== "自定义关注",
          ),
        );
        setCustomKeywords(customSubscription?.keywords.join("，") ?? "");
        setDeliverySettings(bundle.deliverySettings);
        setIsLoading(false);
      })
      .catch((error: unknown) => {
        if (!active) {
          return;
        }

        setLoadError(toApiError(error).message);
        setIsLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  const availableTopics = useMemo(
    () =>
      presetTopics.filter(
        (topic) =>
          !subscriptions.some(
            (subscription) => subscription.topic === topic,
          ),
      ),
    [subscriptions],
  );

  function toggleSubscription(id: string) {
    setSubscriptions((current) =>
      current.map((subscription) =>
        subscription.id === id
          ? { ...subscription, enabled: !subscription.enabled }
          : subscription,
      ),
    );
  }

  function addSubscription() {
    const topic = newTopic.trim();

    if (
      !topic ||
      subscriptions.some((subscription) => subscription.topic === topic)
    ) {
      return;
    }

    const now = new Date().toISOString();
    setSubscriptions((current) => [
      ...current,
      {
        id: `local-subscription-${Date.now()}`,
        userId: "todaypaper-local-user",
        topic,
        keywords: [],
        enabled: true,
        todayUpdateCount: 0,
        createdAt: now,
        updatedAt: now,
      },
    ]);
    setNewTopic("");
    setShowAddPanel(false);
  }

  async function saveSubscriptions(
    nextSubscriptions = subscriptions,
    nextCustomKeywords = customKeywords,
  ) {
    const parsedDeliverySettings =
      deliverySettingsSchema.safeParse(deliverySettings);
    const parsedEmailRule = subscriptionFormSchema.safeParse({
      topics: ["订阅管理"],
      customKeywords: "",
      email: deliverySettings.email,
      dailyDelivery: deliverySettings.dailyDelivery,
    });

    if (!parsedDeliverySettings.success || !parsedEmailRule.success) {
      setEmailError(
        deliverySettings.dailyDelivery
          ? "请输入有效的接收邮箱"
          : "邮箱格式不正确",
      );
      return false;
    }

    setEmailError(null);
    setIsSaving(true);

    try {
      const normalizedCustomKeywords =
        normalizeKeywords(nextCustomKeywords);
      const payload: SubscriptionBundle["subscriptions"] =
        nextSubscriptions.map((subscription) => ({ ...subscription }));

      if (normalizedCustomKeywords.length > 0) {
        const now = new Date().toISOString();
        payload.push({
          id: "local-subscription-custom",
          userId: "todaypaper-local-user",
          topic: "自定义关注",
          keywords: normalizedCustomKeywords,
          enabled: true,
          todayUpdateCount: 0,
          createdAt: now,
          updatedAt: now,
        });
      }

      const savedBundle = await apiClient.saveSubscriptions({
        subscriptions: payload.map((subscription) => ({
          id: subscription.id,
          topic: subscription.topic,
          keywords: subscription.keywords,
          enabled: subscription.enabled,
        })),
        deliverySettings,
      });

      setSubscriptions(
        savedBundle.subscriptions.filter(
          (subscription) => subscription.topic !== "自定义关注",
        ),
      );
      setCustomKeywords(
        savedBundle.subscriptions
          .find((subscription) => subscription.topic === "自定义关注")
          ?.keywords.join("，") ?? "",
      );
      setToast({
        message: "订阅设置已保存到当前浏览器。",
        variant: "success",
      });
      return true;
    } catch (error) {
      setToast({
        message: toApiError(error).message,
        variant: "error",
      });
      return false;
    } finally {
      setIsSaving(false);
    }
  }

  async function clearAllSubscriptions() {
    setSubscriptions([]);
    setCustomKeywords("");
    await saveSubscriptions([], "");
  }

  if (isLoading) {
    return (
      <LoadingState
        title="正在读取订阅设置"
        description="正在同步当前浏览器中的关注方向。"
      />
    );
  }

  if (loadError) {
    return (
      <ErrorState
        title="订阅设置读取失败"
        description={loadError}
      />
    );
  }

  return (
    <>
      <section>
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="font-serif text-2xl font-semibold">我的订阅主题</h2>
            <p className="mt-2 text-sm text-muted-ink">
              暂停订阅不会删除历史日报。
            </p>
          </div>
          <Button
            type="button"
            variant="secondary"
            onClick={() => setShowAddPanel((current) => !current)}
          >
            <Plus />
            添加订阅
          </Button>
        </div>

        {showAddPanel && (
          <div className="mt-5 rounded-lg border border-brand/30 bg-brand/5 p-5">
            <Label htmlFor="new-subscription-topic">新增关注方向</Label>
            <div className="mt-2 flex flex-col gap-2 sm:flex-row">
              <Input
                id="new-subscription-topic"
                list="available-subscription-topics"
                value={newTopic}
                onChange={(event) => setNewTopic(event.target.value)}
                maxLength={50}
                placeholder="选择或输入一个方向"
              />
              <datalist id="available-subscription-topics">
                {availableTopics.map((topic) => (
                  <option key={topic} value={topic} />
                ))}
              </datalist>
              <Button
                type="button"
                disabled={!newTopic.trim()}
                onClick={addSubscription}
              >
                添加
              </Button>
            </div>
          </div>
        )}

        <div className="mt-5 space-y-3">
          {subscriptions.length > 0 ? (
            subscriptions.map((subscription) => (
              <SubscriptionCard
                key={subscription.id}
                subscription={subscription}
                onToggle={() => toggleSubscription(subscription.id)}
                onDelete={() => setPendingDelete(subscription)}
              />
            ))
          ) : (
            <div className="rounded-lg border border-dashed border-line-strong bg-surface p-8 text-center">
              <p className="font-serif text-xl font-semibold">暂无订阅主题</p>
              <p className="mt-2 text-sm text-muted-ink">
                点击“添加订阅”重新建立关注方向。
              </p>
            </div>
          )}
        </div>
      </section>

      <section className="mt-8 rounded-lg border border-line bg-surface p-5 shadow-card sm:p-6">
        <div className="flex items-center justify-between gap-4">
          <Label htmlFor="managed-custom-keywords">自定义关键词</Label>
          <span className="text-xs text-muted-ink">
            {customKeywords.length}/50
          </span>
        </div>
        <Input
          id="managed-custom-keywords"
          value={customKeywords}
          onChange={(event) => setCustomKeywords(event.target.value)}
          maxLength={50}
          className="mt-2"
          placeholder="例如：大模型、芯片、人工智能教育"
        />
        <p className="mt-2 text-xs text-muted-ink">
          使用中文或英文逗号分隔，保存时会自动去重。
        </p>
      </section>

      <section className="mt-5 rounded-lg border border-line bg-surface shadow-card">
        <div className="border-b border-line p-5 sm:p-6">
          <h2 className="font-serif text-2xl font-semibold">投递设置</h2>
        </div>
        <div className="space-y-0">
          <div className="flex flex-col gap-4 border-b border-line p-5 sm:flex-row sm:items-end sm:p-6">
            <div className="flex-1">
              <Label htmlFor="managed-email">接收邮箱</Label>
              <div className="relative mt-2">
                <Mail
                  className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-ink"
                  aria-hidden="true"
                />
                <Input
                  id="managed-email"
                  type="email"
                  disabled={!isEmailEditing}
                  value={deliverySettings.email}
                  onChange={(event) =>
                    setDeliverySettings((current) => ({
                      ...current,
                      email: event.target.value,
                    }))
                  }
                  className="pl-10"
                  aria-invalid={Boolean(emailError)}
                  aria-describedby={
                    emailError ? "managed-email-error" : undefined
                  }
                />
              </div>
              {emailError && (
                <p
                  id="managed-email-error"
                  className="mt-2 text-sm text-danger"
                  role="alert"
                >
                  {emailError}
                </p>
              )}
            </div>
            <Button
              type="button"
              variant="secondary"
              onClick={() => setIsEmailEditing((current) => !current)}
            >
              {isEmailEditing ? "完成修改" : "修改邮箱"}
            </Button>
          </div>

          <div className="flex items-center justify-between gap-5 border-b border-line p-5 sm:p-6">
            <div>
              <p className="font-medium">每日送达</p>
              <p className="mt-1 text-xs text-muted-ink">
                关闭后保留订阅与历史内容
              </p>
            </div>
            <button
              type="button"
              role="switch"
              aria-label="每日送达"
              aria-checked={deliverySettings.dailyDelivery}
              onClick={() =>
                setDeliverySettings((current) => ({
                  ...current,
                  dailyDelivery: !current.dailyDelivery,
                }))
              }
              className={cn(
                "relative h-7 w-12 shrink-0 rounded-full bg-line-strong transition-colors",
                deliverySettings.dailyDelivery && "bg-info",
              )}
            >
              <span
                className={cn(
                  "absolute top-1 left-1 size-5 rounded-full bg-white shadow-sm transition-transform",
                  deliverySettings.dailyDelivery && "translate-x-5",
                )}
              />
            </button>
          </div>

          <div className="flex items-center justify-between gap-5 p-5 sm:p-6">
            <div className="flex items-center gap-2">
              <Clock3 className="size-4 text-muted-ink" aria-hidden="true" />
              <div>
                <p className="font-medium">送达时间</p>
                <p className="mt-1 text-xs text-muted-ink">
                  MVP 固定时间，不可修改
                </p>
              </div>
            </div>
            <span className="rounded-sm border border-line-strong bg-soft px-4 py-1.5 font-mono text-sm text-muted-ink">
              {MOCK_DELIVERY_TIME}
            </span>
          </div>
        </div>
      </section>

      <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:justify-center">
        <Button
          type="button"
          size="lg"
          className="sm:min-w-60"
          disabled={isSaving}
          onClick={() => void saveSubscriptions()}
        >
          <Save />
          {isSaving ? "正在保存…" : "保存修改"}
        </Button>
        <Button
          type="button"
          size="lg"
          variant="danger"
          disabled={
            isSaving ||
            (subscriptions.length === 0 && customKeywords.length === 0)
          }
          onClick={() => setClearDialogOpen(true)}
        >
          <Trash2 />
          清空所有订阅
        </Button>
      </div>

      <ConfirmDialog
        open={Boolean(pendingDelete)}
        onOpenChange={(open) => {
          if (!open) {
            setPendingDelete(null);
          }
        }}
        title={`删除“${pendingDelete?.topic ?? ""}”订阅？`}
        description="删除后，该方向不会继续进入新日报，但不会影响历史作品。"
        confirmLabel="确认删除"
        onConfirm={() => {
          if (pendingDelete) {
            setSubscriptions((current) =>
              current.filter(
                (subscription) => subscription.id !== pendingDelete.id,
              ),
            );
          }
          setPendingDelete(null);
        }}
      />

      <ConfirmDialog
        open={clearDialogOpen}
        onOpenChange={setClearDialogOpen}
        title="准备清空全部订阅？"
        description="这会移除所有关注方向和自定义关键词。历史日报仍会保留。"
        secondTitle="最后一次确认"
        secondDescription="清空后需要重新添加订阅方向。确认继续清空全部订阅吗？"
        confirmLabel="确认清空全部"
        doubleConfirm
        onConfirm={() => void clearAllSubscriptions()}
      />

      {toast && (
        <Toast
          message={toast.message}
          variant={toast.variant}
          onDismiss={() => setToast(null)}
        />
      )}
    </>
  );
}
