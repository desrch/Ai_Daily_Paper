"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import {
  Bot,
  BriefcaseBusiness,
  Clapperboard,
  GraduationCap,
  HeartPulse,
  Laptop,
  LockKeyhole,
  Trophy,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useForm, useWatch } from "react-hook-form";

import { DeliverySettings } from "@/components/subscription/delivery-settings";
import {
  TopicSelector,
  type TopicOption,
} from "@/components/subscription/topic-selector";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Toast } from "@/components/ui/toast";
import { apiClient, toApiError } from "@/lib/api/client";
import {
  normalizeKeywords,
  subscriptionFormSchema,
  type SubscriptionFormValues,
} from "@/lib/validation/subscription";
import type { SaveSubscriptionsInput } from "@/types";

const topicOptions: TopicOption[] = [
  {
    label: "人工智能",
    description: "大模型、智能应用与行业进展",
    icon: Bot,
  },
  {
    label: "科技数码",
    description: "芯片、产品与开发者工具",
    icon: Laptop,
  },
  {
    label: "商业财经",
    description: "产业趋势、公司与市场观察",
    icon: BriefcaseBusiness,
  },
  {
    label: "体育赛事",
    description: "赛事动态与运动焦点",
    icon: Trophy,
  },
  {
    label: "校园生活",
    description: "校园新闻与学习方式",
    icon: GraduationCap,
  },
  {
    label: "电影娱乐",
    description: "影视作品与文化观察",
    icon: Clapperboard,
    extra: true,
  },
  {
    label: "健康生活",
    description: "健康管理与生活方式",
    icon: HeartPulse,
    extra: true,
  },
] as const;

const defaultValues: SubscriptionFormValues = {
  topics: ["人工智能", "科技数码", "商业财经"],
  customKeywords: "",
  email: "reader@example.com",
  dailyDelivery: true,
};

export function OnboardingForm() {
  const router = useRouter();
  const [showMore, setShowMore] = useState(false);
  const [isLoadingDefaults, setIsLoadingDefaults] = useState(true);
  const [toast, setToast] = useState<{
    message: string;
    variant: "success" | "error";
  } | null>(null);
  const {
    control,
    formState: { errors, isSubmitting },
    handleSubmit,
    reset,
    setValue,
  } = useForm<SubscriptionFormValues>({
    resolver: zodResolver(subscriptionFormSchema),
    defaultValues,
  });

  const topics = useWatch({ control, name: "topics" });
  const customKeywords = useWatch({ control, name: "customKeywords" });
  const email = useWatch({ control, name: "email" });
  const dailyDelivery = useWatch({ control, name: "dailyDelivery" });
  const customKeywordCount = customKeywords.length;

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
        const selectedTopics = bundle.subscriptions
          .filter(
            (subscription) =>
              subscription.enabled &&
              topicOptions.some(
                (option) => option.label === subscription.topic,
              ),
          )
          .map((subscription) => subscription.topic);

        reset({
          topics:
            selectedTopics.length > 0
              ? selectedTopics
              : defaultValues.topics,
          customKeywords: customSubscription?.keywords.join("，") ?? "",
          email: bundle.deliverySettings.email,
          dailyDelivery: bundle.deliverySettings.dailyDelivery,
        });
        setShowMore(
          selectedTopics.some((topic) =>
            topicOptions.some(
              (option) => option.label === topic && option.extra,
            ),
          ),
        );
        setIsLoadingDefaults(false);
      })
      .catch(() => {
        if (active) {
          setIsLoadingDefaults(false);
        }
      });

    return () => {
      active = false;
    };
  }, [reset]);

  function toggleTopic(topic: string) {
    const nextTopics = topics.includes(topic)
      ? topics.filter((item) => item !== topic)
      : [...topics, topic];

    setValue("topics", nextTopics, {
      shouldDirty: true,
      shouldTouch: true,
      shouldValidate: true,
    });
  }

  const onSubmit = handleSubmit(async (values) => {
    try {
      const keywords = normalizeKeywords(values.customKeywords);
      const subscriptions: SaveSubscriptionsInput["subscriptions"] =
        values.topics.map((topic) => ({
          topic,
          keywords: [],
          enabled: true,
        }));

      if (keywords.length > 0) {
        subscriptions.push({
          topic: "自定义关注",
          keywords,
          enabled: true,
        });
      }

      await apiClient.saveSubscriptions({
        subscriptions,
        deliverySettings: {
          email: values.email.trim(),
          dailyDelivery: values.dailyDelivery,
          deliveryTime: "08:00",
        },
      });

      setToast({
        message: "订阅已保存，正在进入你的日报收件箱。",
        variant: "success",
      });
      router.push("/dashboard");
    } catch (error) {
      const apiError = toApiError(error);
      setToast({
        message: apiError.message,
        variant: "error",
      });
    }
  });

  return (
    <>
      <form
        onSubmit={onSubmit}
        className="mx-auto max-w-4xl rounded-lg border border-line bg-surface p-5 shadow-card sm:p-8"
        noValidate
      >
        <TopicSelector
          options={topicOptions}
          selectedTopics={topics}
          showMore={showMore}
          onShowMore={() => setShowMore(true)}
          onToggle={toggleTopic}
          error={errors.topics?.message}
        />

        <div className="mt-7 border-t border-line pt-6">
          <div className="flex items-center justify-between gap-4">
            <Label htmlFor="custom-keywords">自定义关键词</Label>
            <span
              className="text-xs text-muted-ink"
              aria-label={`已输入 ${customKeywordCount} 个字符，最多 50 个`}
            >
              {customKeywordCount}/50
            </span>
          </div>
          <Input
            id="custom-keywords"
            value={customKeywords}
            onChange={(event) =>
              setValue("customKeywords", event.target.value, {
                shouldDirty: true,
                shouldValidate: true,
              })
            }
            className="mt-2"
            maxLength={50}
            placeholder="例如：大模型、芯片、自动驾驶、ChatGPT"
            aria-invalid={Boolean(errors.customKeywords)}
            aria-describedby={
              errors.customKeywords ? "custom-keywords-error" : undefined
            }
          />
          {errors.customKeywords && (
            <p
              id="custom-keywords-error"
              className="mt-2 text-sm text-danger"
              role="alert"
            >
              {errors.customKeywords.message}
            </p>
          )}
        </div>

        <DeliverySettings
          email={email}
          dailyDelivery={dailyDelivery}
          emailError={errors.email?.message}
          onEmailChange={(value) =>
            setValue("email", value, {
              shouldDirty: true,
              shouldValidate: true,
            })
          }
          onDailyDeliveryChange={(value) =>
            setValue("dailyDelivery", value, {
              shouldDirty: true,
              shouldValidate: true,
            })
          }
        />

        <div className="mt-7 text-center">
          <Button
            type="submit"
            size="lg"
            className="w-full max-w-sm"
            disabled={isSubmitting || isLoadingDefaults}
          >
            {isSubmitting
              ? "正在保存…"
              : isLoadingDefaults
                ? "正在读取设置…"
                : "保存订阅"}
          </Button>
          <p className="mt-4 inline-flex items-center gap-2 text-xs text-muted-ink">
            <LockKeyhole className="size-3.5" aria-hidden="true" />
            你的设置仅保存在当前浏览器，不会发送给第三方。
          </p>
        </div>
      </form>

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
