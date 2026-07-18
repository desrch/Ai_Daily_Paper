import { json } from "@/lib/api/http";
import { listDailyIssuesFromDb } from "@/lib/db/daily-issues";
import { ensureSeedData } from "@/lib/demo/generate";
import { store } from "@/lib/demo/store";

export async function GET() {
  ensureSeedData();
  try {
    const dbIssues = await listDailyIssuesFromDb();
    if (dbIssues) return json(dbIssues);
  } catch {
    // Fall through to in-memory demo data.
  }
  const issues = Array.from(store.dailyIssues.values()).sort(
    (a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt)
  );
  return json(issues);
}
