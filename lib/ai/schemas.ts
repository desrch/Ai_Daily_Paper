import { z } from "zod";

export const dailyAiSchema = z.object({
  dailyBriefing: z.string().min(1),
  quickNews: z.array(z.string().min(1)).min(1).max(8),
  watchNext: z.array(z.string().min(1)).min(1).max(5)
});

export const themePosterAiSchema = z.object({
  introduction: z.string().min(1),
  trendSummary: z.string().min(1),
  keywords: z.array(z.string().min(1)).min(1).max(8)
});

export const topicPosterAiSchema = z.object({
  introduction: z.string().min(1),
  trendSummary: z.string().min(1),
  keyTakeaways: z.array(z.string().min(1)).min(1).max(5),
  keywords: z.array(z.string().min(1)).min(1).max(8),
  articleSummaries: z
    .array(
      z.object({
        id: z.string().min(1),
        headline: z.string().min(1),
        summary: z.string().min(1)
      })
    )
    .min(1)
    .max(5)
});

export type DailyAiOutput = z.infer<typeof dailyAiSchema>;
export type ThemePosterAiOutput = z.infer<typeof themePosterAiSchema>;
export type TopicPosterAiOutput = z.infer<typeof topicPosterAiSchema>;
