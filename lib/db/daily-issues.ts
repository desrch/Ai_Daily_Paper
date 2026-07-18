import { databaseEnabled } from "@/lib/env";
import { getSupabaseServerClient } from "@/lib/db/supabase";
import type { DailyIssue, DeliveryResult } from "@/types";

interface DailyIssueRow {
  id: string;
  user_id: string;
  issue_date: string;
  content: DailyIssue;
  status: string;
  created_at: string;
}

export async function getDailyIssueFromDb(userId: string, issueDate: string) {
  if (!databaseEnabled()) return null;

  const { data, error } = await getSupabaseServerClient()
    .from("daily_issues")
    .select("*")
    .eq("user_id", userId)
    .eq("issue_date", issueDate)
    .maybeSingle();

  if (error) throw error;
  const row = data as DailyIssueRow | null;
  return row?.content ?? null;
}

export async function listDailyIssuesFromDb() {
  if (!databaseEnabled()) return null;

  const { data, error } = await getSupabaseServerClient()
    .from("daily_issues")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) throw error;
  return ((data ?? []) as DailyIssueRow[]).map((row) => row.content);
}

export async function saveDailyIssueToDb(issue: DailyIssue) {
  if (!databaseEnabled()) return null;

  const { error } = await getSupabaseServerClient().from("daily_issues").upsert(
    {
      id: issue.id,
      user_id: issue.userId,
      issue_date: issue.issueDate,
      content: issue,
      status: "ready",
      created_at: issue.createdAt
    },
    { onConflict: "user_id,issue_date" }
  );

  if (error) throw error;
  return issue;
}

export async function saveDeliveryLogToDb(result: DeliveryResult) {
  if (!databaseEnabled()) return null;

  const { error } = await getSupabaseServerClient().from("delivery_logs").insert({
    user_id: result.issue.userId,
    issue_date: result.issue.issueDate,
    email_sent: result.emailSent,
    status: result.status,
    message: result.message
  });

  if (error) throw error;
  return result;
}
