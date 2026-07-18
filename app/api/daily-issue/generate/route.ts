import { apiError, isDateOnly, json, readJsonBody } from "@/lib/api/http";
import { enhanceDailyIssueWithAi } from "@/lib/ai/generate";
import { getDailyIssueFromDb, saveDailyIssueToDb } from "@/lib/db/daily-issues";
import { upsertCreationToDb } from "@/lib/db/creations";
import { dailyIssueCreation, generateDailyIssue } from "@/lib/demo/generate";

interface GenerateDailyIssueRequest {
  userId?: string;
  topics?: string[];
  issueDate?: string;
}

export async function POST(request: Request) {
  const body = await readJsonBody<GenerateDailyIssueRequest>(request);
  if (!body) {
    return apiError(400, "INVALID_JSON", "请求体必须是合法 JSON。", false);
  }

  const userId = typeof body.userId === "string" ? body.userId.trim() : "";
  const topics = Array.isArray(body.topics)
    ? body.topics.map((topic) => (typeof topic === "string" ? topic.trim() : "")).filter(Boolean)
    : [];
  const issueDate = typeof body.issueDate === "string" && body.issueDate ? body.issueDate : "2026-07-18";

  if (!userId) {
    return apiError(400, "INVALID_USER", "userId 不能为空。", false);
  }
  if (topics.length < 1) {
    return apiError(400, "INVALID_TOPICS", "至少需要选择一个订阅方向。", false);
  }
  if (!isDateOnly(issueDate)) {
    return apiError(400, "INVALID_DATE", "issueDate 必须是 YYYY-MM-DD 格式。", false);
  }

  try {
    const existing = await getDailyIssueFromDb(userId, issueDate);
    if (existing) return json(existing);
  } catch {
    // Keep demo generation available when Supabase is temporarily unavailable.
  }

  const fallbackIssue = generateDailyIssue(userId, topics, issueDate);
  const issue = await enhanceDailyIssueWithAi(fallbackIssue);

  try {
    await saveDailyIssueToDb(issue);
    await upsertCreationToDb(dailyIssueCreation(issue));
  } catch {
    // The response remains useful even when persistence fails.
  }

  return json(issue);
}
