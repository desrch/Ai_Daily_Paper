import { apiError, json, normalizeString } from "@/lib/api/http";
import { listCreationsFromDb } from "@/lib/db/creations";
import { allCreations } from "@/lib/demo/generate";
import type { CreationListResponse, CreationType } from "@/types";

const TYPES = new Set(["all", "daily_issue", "theme_poster", "topic_poster"]);

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const type = normalizeString(searchParams.get("type")) || "all";
  const keyword = normalizeString(searchParams.get("keyword"));
  const dateFrom = normalizeString(searchParams.get("dateFrom"));
  const dateTo = normalizeString(searchParams.get("dateTo"));
  const offset = Math.max(0, Number.parseInt(searchParams.get("offset") ?? "0", 10) || 0);
  const limit = Math.max(1, Math.min(50, Number.parseInt(searchParams.get("limit") ?? "12", 10) || 12));

  if (!TYPES.has(type)) {
    return apiError(400, "INVALID_TYPE", "作品类型只支持 all、daily_issue、theme_poster 或 topic_poster。", false);
  }

  let items;
  try {
    items = (await listCreationsFromDb()) ?? allCreations();
  } catch {
    items = allCreations();
  }
  items = items.filter((creation) => creation.saved);
  if (type !== "all") {
    items = items.filter((creation) => creation.type === (type as CreationType));
  }
  if (keyword) {
    items = items.filter(
      (creation) => creation.title.includes(keyword) || creation.description.includes(keyword)
    );
  }
  if (dateFrom) {
    items = items.filter((creation) => creation.createdAt.slice(0, 10) >= dateFrom);
  }
  if (dateTo) {
    items = items.filter((creation) => creation.createdAt.slice(0, 10) <= dateTo);
  }

  const total = items.length;
  const response: CreationListResponse = {
    items: items.slice(offset, offset + limit),
    total,
    offset,
    limit
  };

  return json(response);
}
