import { z } from "zod";

export const subscriptionFormSchema = z
  .object({
    topics: z.array(z.string()),
    customKeywords: z.string().max(50, "自定义关键词最多 50 个字符"),
    email: z.string(),
    dailyDelivery: z.boolean(),
  })
  .superRefine((data, context) => {
    if (data.topics.length === 0 && data.customKeywords.trim().length === 0) {
      context.addIssue({
        code: "custom",
        path: ["topics"],
        message: "请至少选择一个方向或填写自定义关键词",
      });
    }

    if (
      data.dailyDelivery &&
      !z.string().email().safeParse(data.email.trim()).success
    ) {
      context.addIssue({
        code: "custom",
        path: ["email"],
        message: "开启每日送达时，请填写有效邮箱",
      });
    }
  });

export type SubscriptionFormValues = z.input<
  typeof subscriptionFormSchema
>;

export function normalizeKeywords(value: string) {
  return Array.from(
    new Set(
      value
        .split(/[，,、\n]/)
        .map((keyword) => keyword.trim())
        .filter(Boolean),
    ),
  );
}
