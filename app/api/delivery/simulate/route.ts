import { apiError, isDateOnly, json, readJsonBody } from "@/lib/api/http";
import { enhanceDailyIssueWithAi } from "@/lib/ai/generate";
import { getDailyIssueFromDb, saveDailyIssueToDb, saveDeliveryLogToDb } from "@/lib/db/daily-issues";
import { upsertCreationToDb } from "@/lib/db/creations";
import { getSubscriptionBundleFromDb } from "@/lib/db/subscriptions";
import { dailyIssueCreation } from "@/lib/demo/generate";
import { generateDailyIssue } from "@/lib/demo/generate";
import { DEFAULT_USER_ID, getDefaultSubscriptionBundle } from "@/lib/demo/store";
import { renderDailyIssueEmail, renderDailyIssueText, sendEmail } from "@/lib/email/resend";
import type { DeliveryResult } from "@/types";

interface SimulateDeliveryRequest {
  userId?: string;
  issueDate?: string;
}

export async function POST(request: Request) {
  const body = await readJsonBody<SimulateDeliveryRequest>(request);
  if (!body) {
    return apiError(400, "INVALID_JSON", "请求体必须是合法 JSON。", false);
  }

  const userId = typeof body.userId === "string" && body.userId.trim() ? body.userId.trim() : DEFAULT_USER_ID;
  const issueDate = typeof body.issueDate === "string" && body.issueDate ? body.issueDate : "2026-07-18";
  if (!isDateOnly(issueDate)) {
    return apiError(400, "INVALID_DATE", "issueDate 必须是 YYYY-MM-DD 格式。", false);
  }

  let bundle = getDefaultSubscriptionBundle(userId);
  try {
    bundle = (await getSubscriptionBundleFromDb(userId)) ?? bundle;
  } catch {
    // Use local settings if Supabase is unavailable.
  }

  const topics = bundle.subscriptions.filter((subscription) => subscription.enabled).map((item) => item.topic);
  let issue = null;
  try {
    issue = await getDailyIssueFromDb(userId, issueDate);
  } catch {
    issue = null;
  }
  if (!issue) {
    issue = await enhanceDailyIssueWithAi(
      generateDailyIssue(userId, topics.length ? topics : ["人工智能"], issueDate)
    );
    try {
      await saveDailyIssueToDb(issue);
      await upsertCreationToDb(dailyIssueCreation(issue));
    } catch {
      // Delivery can still return the generated issue when persistence fails.
    }
  }

  const shouldEmail = Boolean(bundle.deliverySettings.dailyDelivery && bundle.deliverySettings.email);
  let emailSent = false;
  let emailError: string | undefined;

  if (shouldEmail) {
    const result = await sendEmail({
      to: bundle.deliverySettings.email,
      subject: `${issue.newspaperName} · ${issue.issueDate}`,
      html: renderDailyIssueEmail(issue),
      text: renderDailyIssueText(issue),
    });
    emailSent = result.success;
    emailError = result.error;
  }

  const result: DeliveryResult = {
    issue,
    emailSent,
    status: emailSent ? "completed" : "partial",
    message: emailSent
      ? "日报已生成并发送邮件。"
      : emailError
        ? `日报已生成，但邮件发送失败：${emailError}`
        : "日报已生成，但邮件暂未发送。",
  };

  try {
    await saveDeliveryLogToDb(result);
  } catch {
    // Delivery logs are best-effort in MVP.
  }

  return json(result);
}
